import { RouterConfig, VirtualDevice, NetworkTelemetry, DeviceActivity } from '../types/router';
import { apipaFromMac, getDhcpPool, intToIp, ipToInt, isValidIPv4 } from './netUtils';

export function calculateDeviceBaseDemand(activity: DeviceActivity): { down: number; up: number } {
  switch (activity) {
    case 'idle':
      return { down: 0.1, up: 0.05 };
    case 'gaming':
      return { down: 12, up: 4 };
    case 'streaming_4k':
      return { down: 25, up: 1.5 };
    case 'p2p_torrent':
      return { down: 180, up: 55 };
    case 'video_call':
      return { down: 6, up: 6 };
    case 'web_browsing':
      return { down: 8, up: 2 };
    case 'iot_surveillance':
      return { down: 0.5, up: 4.5 };
    case 'ddos_attack':
      return { down: 2, up: 85 };
    case 'port_scanning':
      return { down: 1, up: 3 };
    default:
      return { down: 1, up: 1 };
  }
}

export interface SimulationResult {
  updatedDevices: VirtualDevice[];
  telemetry: NetworkTelemetry;
  securityAudit: SecurityAuditReport;
}

export interface SecurityAuditReport {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  vulnerabilities: {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    remediation: string;
  }[];
  positives: string[];
}

type QosClass = 'highest' | 'high' | 'normal' | 'low';
const QOS_ORDER: QosClass[] = ['highest', 'high', 'normal', 'low'];

/**
 * Servidor DHCP simulado: respeta reservas estáticas, mantiene la concesión de cada equipo si
 * sigue siendo válida y reparte las IPs libres del pool. Si el pool se agota (o está mal
 * configurado), el cliente se autoconfigura con APIPA 169.254.x.x y se queda sin conectividad.
 */
function assignAddresses(
  config: RouterConfig,
  devices: VirtualDevice[],
  wantsLease: boolean[]
): { ip: string; failure?: string }[] {
  const pool = getDhcpPool(config);
  const taken = new Set<number>();
  if (isValidIPv4(config.lanIp)) taken.add(ipToInt(config.lanIp));
  config.staticLeases.forEach(l => isValidIPv4(l.ip) && taken.add(ipToInt(l.ip)));

  const leaseFor = (d: VirtualDevice) => config.staticLeases.find(l => l.mac.toLowerCase() === d.mac.toLowerCase());
  const result: { ip: string; failure?: string }[] = devices.map(d => ({ ip: d.ip }));
  const pending: number[] = [];

  devices.forEach((device, idx) => {
    if (!wantsLease[idx]) return;
    const lease = leaseFor(device);
    if (lease) {
      result[idx] = { ip: lease.ip };
      return;
    }
    if (!config.dhcpEnabled) {
      result[idx] = { ip: apipaFromMac(device.mac), failure: 'DHCP desactivado: sin dirección IP válida (APIPA 169.254.x.x)' };
      return;
    }
    if (!pool.valid) {
      result[idx] = { ip: apipaFromMac(device.mac), failure: `DHCP sin servicio: ${pool.error} (APIPA 169.254.x.x)` };
      return;
    }
    // Renovación: el cliente conserva su IP si sigue dentro del pool y nadie la usa
    const current = isValidIPv4(device.ip) ? ipToInt(device.ip) : -1;
    if (current >= pool.start && current <= pool.end && !taken.has(current)) {
      taken.add(current);
      result[idx] = { ip: device.ip };
    } else {
      pending.push(idx);
    }
  });

  // Nuevas concesiones (DORA) para los clientes sin IP válida
  pending.forEach(idx => {
    for (let n = pool.start; n <= pool.end; n++) {
      if (!taken.has(n)) {
        taken.add(n);
        result[idx] = { ip: intToIp(n) };
        return;
      }
    }
    result[idx] = {
      ip: apipaFromMac(devices[idx].mac),
      failure: `Pool DHCP agotado (${pool.size} direcciones, todas ocupadas): APIPA 169.254.x.x`
    };
  });

  return result;
}

/** Reparto de ancho de banda: con QoS por prioridad estricta, sin QoS a partes iguales (FIFO). */
function allocateBandwidth(demands: number[], classes: QosClass[], capacity: number, qosEnabled: boolean): number[] {
  const total = demands.reduce((s, d) => s + d, 0);
  if (total <= capacity) return demands.slice();
  if (!qosEnabled) {
    const ratio = capacity / total;
    return demands.map(d => d * ratio);
  }
  // Como CAKE / fq_codel: cada flujo activo tiene un mínimo garantizado (2 % de la línea)
  // para no quedarse a cero; el resto se reparte por prioridad estricta.
  const active = demands.filter(d => d > 0).length;
  const floor = Math.min(capacity * 0.02, capacity / Math.max(1, active));
  const out = demands.map(d => Math.min(d, floor));
  let remaining = capacity - out.reduce((s, v) => s + v, 0);
  for (const cls of QOS_ORDER) {
    const idxs = demands.map((_, i) => i).filter(i => classes[i] === cls);
    const classDemand = idxs.reduce((s, i) => s + (demands[i] - out[i]), 0);
    if (classDemand <= 0) continue;
    const ratio = Math.min(1, remaining / classDemand);
    idxs.forEach(i => (out[i] += (demands[i] - out[i]) * ratio));
    remaining = Math.max(0, remaining - classDemand * ratio);
  }
  return out;
}

export function runSimulationTick(
  config: RouterConfig,
  currentDevices: VirtualDevice[],
  isExternalDosAttackActive: boolean
): SimulationResult {
  const wanCapDown = config.qosTotalDownlinkMbps || 300;
  const wanCapUp = config.qosTotalUplinkMbps || 100;

  // Check if DoS is active
  const isDosOngoing = isExternalDosAttackActive || currentDevices.some(d => d.isOnline && d.currentActivity === 'ddos_attack');
  const dosMitigated = isDosOngoing && config.firewallSpiEnabled && config.dosProtectionEnabled;
  const dosUnchecked = isDosOngoing && (!config.firewallSpiEnabled || !config.dosProtectionEnabled);

  const wifi24CleanChannel = [1, 6, 11].includes(config.wifi24Channel);

  // 1. Capa física / enlace: ¿puede asociarse el equipo?
  const linkChecks = currentDevices.map(device => {
    let failureReason = '';
    if (device.connectionType === 'disconnected') {
      failureReason = 'Desconectado físicamente';
    } else if (device.connectionType === 'wifi_24g' && !config.wifi24Enabled) {
      failureReason = 'Banda Wi-Fi 2.4 GHz desactivada';
    } else if (device.connectionType === 'wifi_5g' && !config.wifi5Enabled) {
      failureReason = 'Banda Wi-Fi 5 GHz desactivada';
    } else if (device.connectionType === 'wifi_guest' && !config.guestWifiEnabled) {
      failureReason = 'Red Wi-Fi de invitados desactivada';
    }

    const mac = device.mac.toUpperCase();
    const macList = config.macFilterList.map(m => m.toUpperCase());
    let isBlockedByMac = false;
    if (config.macFilteringMode === 'whitelist') {
      isBlockedByMac = !macList.includes(mac);
    } else if (config.macFilteringMode === 'blacklist') {
      isBlockedByMac = macList.includes(mac);
    }
    if (isBlockedByMac && !failureReason) {
      failureReason = 'Bloqueado por filtro de dirección MAC';
    }
    return { failureReason, isBlockedByMac };
  });

  // 2. Capa de red: DHCP
  const addresses = assignAddresses(config, currentDevices, linkChecks.map(l => !l.failureReason));

  // 3. Demanda de cada equipo
  const processedDevices: VirtualDevice[] = currentDevices.map((device, idx) => {
    const { isBlockedByMac } = linkChecks[idx];
    const failureReason = linkChecks[idx].failureReason || addresses[idx].failure || '';
    const canConnect = !failureReason;

    // Control parental: el filtro DNS corta el tráfico de la actividad bloqueada
    let isBlockedByParental = false;
    if (canConnect && config.parentalControlEnabled && (device.type === 'smartphone' || device.type === 'smart_tv')) {
      isBlockedByParental = config.blockedDomains.some(d => d.enabled && (
        (d.domain.includes('tiktok') && device.currentActivity === 'web_browsing') ||
        (d.domain.includes('roblox') && device.currentActivity === 'gaming')
      ));
    }

    const isGuest = device.connectionType === 'wifi_guest';
    const isIsolated = canConnect && isGuest && config.guestIsolation;

    const baseDemand = calculateDeviceBaseDemand(isBlockedByParental ? 'idle' : device.currentActivity);
    let demandDown = canConnect ? baseDemand.down : 0;
    let demandUp = canConnect ? baseDemand.up : 0;

    if (isGuest && config.guestBandwidthLimitMbps > 0) {
      demandDown = Math.min(demandDown, config.guestBandwidthLimitMbps);
      demandUp = Math.min(demandUp, config.guestBandwidthLimitMbps / 2);
    }

    const jitterFactor = 0.9 + Math.random() * 0.2;
    demandDown = Number((demandDown * jitterFactor).toFixed(1));
    demandUp = Number((demandUp * jitterFactor).toFixed(1));

    let statusLog: string;
    if (!canConnect) {
      statusLog = failureReason;
    } else if (isBlockedByParental) {
      statusLog = 'Tráfico filtrado por Control Parental (Dominio restringido)';
    } else if (isIsolated) {
      statusLog = 'Aislado en Red de Invitados (Acceso a Internet exclusivo, LAN inaccesible)';
    } else {
      statusLog = `Conectado y transmitiendo (${device.currentActivity.replace(/_/g, ' ')})`;
    }

    return {
      ...device,
      ip: addresses[idx].ip,
      isOnline: canConnect,
      demandDownloadMbps: demandDown,
      demandUploadMbps: demandUp,
      isBlockedByMac,
      isBlockedByParental,
      isolationRestricted: isIsolated,
      statusLog
    };
  });

  // 4. Reparto del ancho de banda WAN y latencia
  const totalDemandDown = processedDevices.reduce((s, d) => s + (d.isOnline ? d.demandDownloadMbps : 0), 0);
  const totalDemandUp = processedDevices.reduce((s, d) => s + (d.isOnline ? d.demandUploadMbps : 0), 0);
  const activeSessions = processedDevices.reduce(
    (s, d) => s + (d.isOnline ? Math.max(2, Math.round((d.demandDownloadMbps + d.demandUploadMbps) * 4)) : 0),
    0
  );
  const isOverloaded = totalDemandDown > wanCapDown || totalDemandUp > wanCapUp;
  const loadRatio = Math.max(totalDemandDown / wanCapDown, totalDemandUp / wanCapUp);
  const bufferbloatFactor = isOverloaded ? loadRatio * 80 : 0;

  const classes = processedDevices.map(d => (config.qosDevicePriorities[d.id] || 'normal') as QosClass);
  const online = processedDevices.map(d => d.isOnline);
  const allocDown = allocateBandwidth(processedDevices.map((d, i) => (online[i] ? d.demandDownloadMbps : 0)), classes, wanCapDown, config.qosEnabled);
  const allocUp = allocateBandwidth(processedDevices.map((d, i) => (online[i] ? d.demandUploadMbps : 0)), classes, wanCapUp, config.qosEnabled);

  const finalDevices = processedDevices.map((device, idx) => {
    if (!device.isOnline) {
      return {
        ...device,
        currentDownloadMbps: 0,
        currentUploadMbps: 0,
        currentLatencyMs: 999,
        packetLossPercent: 100
      };
    }

    let effectiveDown = allocDown[idx];
    let effectiveUp = allocUp[idx];
    let latency = 16;
    let packetLoss = 0;

    if (device.connectionType === 'wifi_24g') {
      latency += 12; // 2.4GHz interference penalty
      if (config.wifi24ChannelWidth === 40) {
        latency += 6; // 40MHz channel congestion in 2.4G
        packetLoss += 6;
      }
      if (!wifi24CleanChannel) {
        latency += 10; // canal solapado con los vecinos (fuera de 1/6/11)
        packetLoss += 6;
      }
      if (config.wifi24ChannelWidth === 40 || !wifi24CleanChannel) {
        effectiveDown *= 0.7;
        effectiveUp *= 0.7;
      }
    } else if (device.connectionType === 'wifi_5g') {
      latency += 3;
    } else if (device.connectionType.startsWith('ethernet')) {
      latency += 1;
    }

    if (config.qosEnabled) {
      const queueDelay: Record<QosClass, number> = isOverloaded
        ? { highest: 2, high: 6, normal: config.bufferbloatMitigation ? 15 : 40, low: config.bufferbloatMitigation ? 25 : 60 }
        : { highest: 1, high: 2, normal: 3, low: 5 };
      latency += queueDelay[classes[idx]];
      if (isOverloaded && classes[idx] === 'low' && !config.bufferbloatMitigation) packetLoss += 2;
    } else if (isOverloaded) {
      // Sin QoS: una sola cola FIFO, el bufferbloat afecta a todos por igual
      latency += bufferbloatFactor;
      packetLoss += Math.min(15, Math.round(bufferbloatFactor / 10));
    }

    if (dosUnchecked) {
      latency += 380 + Math.random() * 200;
      packetLoss += 25 + Math.random() * 20;
      effectiveDown *= 0.2;
      effectiveUp *= 0.2;
    } else if (dosMitigated) {
      latency += 8;
    }

    return {
      ...device,
      currentDownloadMbps: Number(effectiveDown.toFixed(1)),
      currentUploadMbps: Number(effectiveUp.toFixed(1)),
      currentLatencyMs: Math.round(latency),
      packetLossPercent: Math.min(100, Math.round(packetLoss))
    };
  });

  // 5. Telemetría
  const totalEffectiveDown = finalDevices.reduce((sum, d) => sum + d.currentDownloadMbps, 0);
  const totalEffectiveUp = finalDevices.reduce((sum, d) => sum + d.currentUploadMbps, 0);
  const onlineDevices = finalDevices.filter(d => d.isOnline);
  const avgLatency = onlineDevices.length > 0
    ? Math.round(onlineDevices.reduce((sum, d) => sum + d.currentLatencyMs, 0) / onlineDevices.length)
    : 15;
  const maxLatency = onlineDevices.length > 0
    ? Math.max(...onlineDevices.map(d => d.currentLatencyMs))
    : 15;
  const avgPacketLoss = onlineDevices.length > 0
    ? Math.round(onlineDevices.reduce((sum, d) => sum + d.packetLossPercent, 0) / onlineDevices.length)
    : 0;

  let cpu = 12; // idle baseline
  let ram = 34; // baseline firmware OS

  cpu += Math.round((totalEffectiveDown / wanCapDown) * 20);
  cpu += Math.round((totalEffectiveUp / wanCapUp) * 15);
  if (config.firewallSpiEnabled) cpu += 3;
  if (config.qosEnabled) cpu += 5;
  if (config.parentalControlEnabled) cpu += 4;

  if (dosUnchecked) {
    cpu = Math.min(99, cpu + 75);
    ram = Math.min(96, ram + 48);
  } else if (dosMitigated) {
    cpu = Math.min(45, cpu + 18);
    ram = Math.min(52, ram + 8);
  }

  const telemetry: NetworkTelemetry = {
    timestamp: Date.now(),
    totalDownloadMbps: Number(totalEffectiveDown.toFixed(1)),
    totalUploadMbps: Number(totalEffectiveUp.toFixed(1)),
    averageLatencyMs: avgLatency,
    maxLatencyMs: maxLatency,
    packetLossPercent: avgPacketLoss,
    routerCpuPercent: Math.min(100, cpu),
    routerRamPercent: Math.min(100, ram),
    activeSessionsCount: activeSessions + (dosUnchecked ? 4500 : 0),
    wifiInterference24: Math.min(95, 22 + (config.wifi24ChannelWidth === 40 ? 43 : 0) + (wifi24CleanChannel ? 0 : 25)),
    wifiInterference5: config.wifi5ChannelWidth === 160 ? 30 : 12
  };

  const securityAudit = performSecurityAudit(config);

  return {
    updatedDevices: finalDevices,
    telemetry,
    securityAudit
  };
}

export function performSecurityAudit(config: RouterConfig): SecurityAuditReport {
  let score = 100;
  const vulnerabilities: SecurityAuditReport['vulnerabilities'] = [];
  const positives: string[] = [];

  // 1. WPS Check
  if (config.wpsEnabled && config.wpsMode === 'pin') {
    score -= 25;
    vulnerabilities.push({
      id: 'vuln-wps-pin',
      severity: 'critical',
      title: 'WPS activado con código PIN (Vulnerable a Pixie Dust)',
      description: 'El diseño del PIN de 8 dígitos de WPS se divide en mitades verificables por separado. Atacantes con software como Reaver pueden descifrar la clave Wi-Fi en minutos.',
      remediation: 'Desactiva WPS o cámbialo a modo "Botón Pulsador" (PBC) en la pestaña Wi-Fi.'
    });
  } else if (config.wpsEnabled && config.wpsMode === 'push_button') {
    positives.push('WPS limitado a botón pulsador sin código PIN vulnerable.');
  } else {
    positives.push('WPS desactivado permanentemente para máxima protección.');
  }

  // 2. Wi-Fi Security Mode
  // Solo cuentan las redes que están emitiendo
  const activeWifiModes = [
    config.wifi24Enabled ? config.wifi24Security : null,
    config.wifi5Enabled ? config.wifi5Security : null
  ].filter((m): m is RouterConfig['wifi24Security'] => m !== null);

  if (activeWifiModes.length === 0) {
    positives.push('Radios Wi-Fi apagadas: sin superficie de ataque inalámbrica.');
  } else if (activeWifiModes.includes('none')) {
    score -= 40;
    vulnerabilities.push({
      id: 'vuln-wifi-open',
      severity: 'critical',
      title: 'Red Wi-Fi Abierta sin Cifrado',
      description: 'Cualquier persona dentro del radio de alcance puede capturar el tráfico no cifrado de los usuarios o infectar dispositivos.',
      remediation: 'Establece cifrado WPA3 o WPA2-Personal con clave robusta.'
    });
  } else if (activeWifiModes.includes('wep')) {
    score -= 35;
    vulnerabilities.push({
      id: 'vuln-wifi-wep',
      severity: 'critical',
      title: 'Cifrado WEP Obsoleto e Inseguro',
      description: 'El algoritmo WEP tiene debilidades criptográficas en sus vectores de inicialización (IV). Puede ser descifrado en menos de 60 segundos.',
      remediation: 'Actualiza inmediatamente a WPA2-AES o WPA3-Personal.'
    });
  } else if (config.wifi5Enabled && config.wifi5Security === 'wpa3') {
    positives.push('Wi-Fi 5 GHz protegido con el estándar de vanguardia WPA3-SAE.');
  } else {
    positives.push('Wi-Fi protegido con WPA2-AES robusto.');
  }

  // 3. Firewall SPI
  if (!config.firewallSpiEnabled) {
    score -= 30;
    vulnerabilities.push({
      id: 'vuln-no-spi',
      severity: 'critical',
      title: 'Firewall SPI Desactivado',
      description: 'El cortafuegos no está inspeccionando el estado de los paquetes. La red doméstica está desprotegida contra sondas no solicitadas desde Internet.',
      remediation: 'Activa "Firewall SPI (Stateful Packet Inspection)" en la pestaña de Seguridad.'
    });
  } else {
    positives.push('Firewall SPI activo y filtrando paquetes no solicitados.');
  }

  // 4. DoS Protection
  if (!config.dosProtectionEnabled) {
    score -= 15;
    vulnerabilities.push({
      id: 'vuln-no-dos',
      severity: 'warning',
      title: 'Protección Anti-DoS Desactivada',
      description: 'El router es vulnerable a ataques de inundación SYN Flood y saturación de tablas de conexiones por atacantes externos.',
      remediation: 'Habilita la protección DoS en la sección de Seguridad y Firewall.'
    });
  } else {
    positives.push('Protección activa contra inundaciones de paquetes DoS.');
  }

  // 5. DMZ Check
  if (config.dmzEnabled) {
    score -= 20;
    vulnerabilities.push({
      id: 'vuln-dmz-active',
      severity: 'warning',
      title: `DMZ (Zona Desmilitarizada) Activa hacia ${config.dmzHostIp}`,
      description: 'Todos los puertos no mapeados se reenvían al host DMZ sin cortafuegos, exponiéndolo a escaneos y exploits de Internet.',
      remediation: 'Desactiva DMZ y usa reglas específicas de Port Forwarding solo para los puertos estrictamente necesarios.'
    });
  } else {
    positives.push('DMZ inactiva; todos los equipos locales están detrás del firewall NAT.');
  }

  // 6. Remote Management
  if (config.remoteManagementEnabled) {
    score -= 20;
    vulnerabilities.push({
      id: 'vuln-remote-mgmt',
      severity: 'critical',
      title: `Gestión Remota Abierta en el Puerto ${config.remoteManagementPort}`,
      description: 'El panel de administración del router es accesible desde cualquier parte de Internet, exponiéndolo a ataques de fuerza bruta en credenciales de acceso.',
      remediation: 'Desactiva la gestión remota WAN. Accede al router solo desde la red local.'
    });
  } else {
    positives.push('Gestión remota deshabilitada en la interfaz pública WAN.');
  }

  // 7. WAN Ping response
  if (config.wanPingRespond) {
    score -= 8;
    vulnerabilities.push({
      id: 'vuln-wan-ping',
      severity: 'info',
      title: 'Respuesta a Ping en WAN Habilitada',
      description: 'El router responde a solicitudes ICMP Echo desde Internet, lo que facilita a bots y atacantes descubrir que tu IP está activa.',
      remediation: 'Desmarca "Responder a Ping en WAN" para activar el Modo Oculto (Stealth).'
    });
  } else {
    positives.push('Modo Oculto (Stealth) activo: el router ignora pings externos.');
  }

  // 8. Guest Network Isolation
  if (config.guestWifiEnabled && !config.guestIsolation) {
    score -= 12;
    vulnerabilities.push({
      id: 'vuln-guest-no-isolation',
      severity: 'warning',
      title: 'Red de Invitados sin Aislamiento de Red (AP Isolation)',
      description: 'Los dispositivos conectados a la red de invitados pueden comunicarse y escanear los equipos privados de tu red LAN.',
      remediation: 'Activa la opción "Aislamiento de Invitados" en la configuración Wi-Fi.'
    });
  } else if (config.guestWifiEnabled && config.guestIsolation) {
    positives.push('Red de invitados aislada correctamente de la red privada.');
  }

  // 9. UPnP
  if (config.upnpEnabled) {
    score -= 10;
    vulnerabilities.push({
      id: 'vuln-upnp',
      severity: 'warning',
      title: 'UPnP Activo (Apertura Automática de Puertos)',
      description: 'Cualquier programa o dispositivo IoT de la red local puede pedir al router que abra puertos hacia Internet sin intervención del administrador. El malware lo usa para exponer servicios o crear puertas traseras.',
      remediation: 'Desactiva UPnP en la pestaña Port Forwarding y crea manualmente solo las reglas que necesites.'
    });
  } else {
    positives.push('UPnP desactivado: ningún equipo puede abrir puertos sin supervisión.');
  }

  score = Math.max(0, Math.min(100, score));

  let grade: SecurityAuditReport['grade'] = 'F';
  if (score >= 95) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 35) grade = 'D';

  return {
    score,
    grade,
    vulnerabilities,
    positives
  };
}
