import { RouterConfig, VirtualDevice, NetworkTelemetry, DeviceActivity } from '../types/router';

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

export function runSimulationTick(
  config: RouterConfig,
  currentDevices: VirtualDevice[],
  isExternalDosAttackActive: boolean
): SimulationResult {
  const wanCapDown = config.qosTotalDownlinkMbps || 300;
  const wanCapUp = config.qosTotalUplinkMbps || 100;

  let totalDemandDown = 0;
  let totalDemandUp = 0;
  let activeSessions = 0;

  // Check if DoS is active
  const isDosOngoing = isExternalDosAttackActive || currentDevices.some(d => d.isOnline && d.currentActivity === 'ddos_attack');
  const dosMitigated = isDosOngoing && config.firewallSpiEnabled && config.dosProtectionEnabled;
  const dosUnchecked = isDosOngoing && (!config.firewallSpiEnabled || !config.dosProtectionEnabled);

  // 1. Process device connections and demands
  const processedDevices: VirtualDevice[] = currentDevices.map(device => {
    // Determine connection feasibility
    let canConnect = true;
    let failureReason = '';

    if (device.connectionType === 'disconnected') {
      canConnect = false;
      failureReason = 'Desconectado físicamente';
    } else if (device.connectionType === 'wifi_24g' && !config.wifi24Enabled) {
      canConnect = false;
      failureReason = 'Banda Wi-Fi 2.4 GHz desactivada';
    } else if (device.connectionType === 'wifi_5g' && !config.wifi5Enabled) {
      canConnect = false;
      failureReason = 'Banda Wi-Fi 5 GHz desactivada';
    } else if (device.connectionType === 'wifi_guest' && !config.guestWifiEnabled) {
      canConnect = false;
      failureReason = 'Red Wi-Fi de invitados desactivada';
    }

    // Check MAC filtering
    let isBlockedByMac = false;
    if (config.macFilteringMode === 'whitelist') {
      isBlockedByMac = !config.macFilterList.includes(device.mac);
    } else if (config.macFilteringMode === 'blacklist') {
      isBlockedByMac = config.macFilterList.includes(device.mac);
    }

    if (isBlockedByMac) {
      canConnect = false;
      failureReason = 'Bloqueado por filtro de dirección MAC';
    }

    // Check IP Assignment (DHCP)
    let assignedIp = device.ip;
    const staticLease = config.staticLeases.find(l => l.mac.toLowerCase() === device.mac.toLowerCase());
    if (staticLease) {
      assignedIp = staticLease.ip;
    } else if (!config.dhcpEnabled) {
      // No DHCP and no static lease -> APIPA 169.254.x.x
      assignedIp = '169.254.120.' + (Math.abs(device.mac.charCodeAt(device.mac.length - 1)) % 250);
      canConnect = false;
      failureReason = 'DHCP desactivado: Sin dirección IP válida (APIPA 169.254.x.x)';
    }

    // Check Parental control
    let isBlockedByParental = false;
    if (config.parentalControlEnabled) {
      const hasBlockedDomain = config.blockedDomains.some(d => d.enabled && (
        (d.domain.includes('tiktok') && device.currentActivity === 'web_browsing') ||
        (d.domain.includes('roblox') && device.currentActivity === 'gaming')
      ));
      if (hasBlockedDomain && (device.type === 'smartphone' || device.type === 'smart_tv')) {
        isBlockedByParental = true;
      }
    }

    // Guest isolation check
    const isGuest = device.connectionType === 'wifi_guest';
    const isIsolated = isGuest && config.guestIsolation;

    // Calculate demands
    const baseDemand = calculateDeviceBaseDemand(device.currentActivity);
    let demandDown = canConnect ? baseDemand.down : 0;
    let demandUp = canConnect ? baseDemand.up : 0;

    // If guest network bandwidth limit is set
    if (isGuest && config.guestBandwidthLimitMbps > 0) {
      demandDown = Math.min(demandDown, config.guestBandwidthLimitMbps);
      demandUp = Math.min(demandUp, config.guestBandwidthLimitMbps / 2);
    }

    // Add slight realistic jitter/fluctuation
    const jitterFactor = 0.9 + Math.random() * 0.2;
    demandDown = Number((demandDown * jitterFactor).toFixed(1));
    demandUp = Number((demandUp * jitterFactor).toFixed(1));

    if (canConnect) {
      totalDemandDown += demandDown;
      totalDemandUp += demandUp;
      activeSessions += Math.max(2, Math.round((demandDown + demandUp) * 4));
    }

    let statusLog = '';
    if (!canConnect) {
      statusLog = failureReason;
    } else if (isBlockedByParental) {
      statusLog = 'Tráfico filtrado por Control Parental (Dominio restringido)';
    } else if (isIsolated) {
      statusLog = 'Aislado en Red de Invitados (Acceso a Internet exclusivo, LAN inaccesible)';
    } else {
      statusLog = `Conectado y transmitiendo (${device.currentActivity.replace('_', ' ')})`;
    }

    return {
      ...device,
      ip: assignedIp,
      isOnline: canConnect,
      demandDownloadMbps: demandDown,
      demandUploadMbps: demandUp,
      isBlockedByMac,
      isBlockedByParental,
      isolationRestricted: isIsolated,
      statusLog
    };
  });

  // 2. Bandwidth distribution & Latency computation
  const isDownOverloaded = totalDemandDown > wanCapDown;
  const isUpOverloaded = totalDemandUp > wanCapUp;
  const bufferbloatFactor = isDownOverloaded || isUpOverloaded ? (totalDemandDown / wanCapDown) * 80 : 0;

  const finalDevices = processedDevices.map(device => {
    if (!device.isOnline) {
      return {
        ...device,
        currentDownloadMbps: 0,
        currentUploadMbps: 0,
        currentLatencyMs: 999,
        packetLossPercent: 100
      };
    }

    let effectiveDown = device.demandDownloadMbps;
    let effectiveUp = device.demandUploadMbps;
    let latency = 16;
    let packetLoss = 0;

    // Medium latency baseline
    if (device.connectionType === 'wifi_24g') {
      latency += 12; // 2.4GHz interference penalty
      if (config.wifi24ChannelWidth === 40) latency += 6; // 40MHz channel congestion in 2.4G
    } else if (device.connectionType === 'wifi_5g') {
      latency += 3;
    } else if (device.connectionType.startsWith('ethernet')) {
      latency += 1;
    }

    // QoS Logic
    const priority = config.qosDevicePriorities[device.id] || 'normal';

    if (config.qosEnabled) {
      if (priority === 'highest') {
        effectiveDown = device.demandDownloadMbps;
        effectiveUp = device.demandUploadMbps;
        latency += 2; // Protected by priority queue
      } else if (priority === 'high') {
        effectiveDown = device.demandDownloadMbps * 0.95;
        effectiveUp = device.demandUploadMbps * 0.95;
        latency += 6;
      } else if (priority === 'normal') {
        const ratio = isDownOverloaded ? Math.max(0.4, wanCapDown / (totalDemandDown * 1.1)) : 1;
        effectiveDown = Number((device.demandDownloadMbps * ratio).toFixed(1));
        effectiveUp = Number((device.demandUploadMbps * ratio).toFixed(1));
        latency += config.bufferbloatMitigation ? 15 : 40;
      } else {
        // low
        const ratio = isDownOverloaded ? 0.25 : 0.8;
        effectiveDown = Number((device.demandDownloadMbps * ratio).toFixed(1));
        effectiveUp = Number((device.demandUploadMbps * ratio).toFixed(1));
        latency += config.bufferbloatMitigation ? 25 : 60;
      }
    } else {
      // NO QOS -> Bufferbloat affects everyone, especially games!
      if (isDownOverloaded) {
        const ratio = Math.max(0.3, wanCapDown / totalDemandDown);
        effectiveDown = Number((device.demandDownloadMbps * ratio).toFixed(1));
        effectiveUp = Number((device.demandUploadMbps * ratio).toFixed(1));
        latency += bufferbloatFactor;
        packetLoss += Math.min(15, Math.round(bufferbloatFactor / 10));
      }
    }

    // DoS impact
    if (dosUnchecked) {
      latency += 380 + Math.random() * 200;
      packetLoss += 25 + Math.random() * 20;
      effectiveDown = Number((effectiveDown * 0.2).toFixed(1));
      effectiveUp = Number((effectiveUp * 0.2).toFixed(1));
    } else if (dosMitigated) {
      latency += 8;
    }

    return {
      ...device,
      currentDownloadMbps: effectiveDown,
      currentUploadMbps: effectiveUp,
      currentLatencyMs: Math.round(latency),
      packetLossPercent: Math.min(100, Math.round(packetLoss))
    };
  });

  // 3. Compute telemetry
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

  // Router CPU & RAM calculation
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
    wifiInterference24: config.wifi24ChannelWidth === 40 ? 65 : 22,
    wifiInterference5: config.wifi5ChannelWidth === 160 ? 30 : 12
  };

  // 4. Security Audit
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
  if (config.wifi24Security === 'none' || config.wifi5Security === 'none') {
    score -= 40;
    vulnerabilities.push({
      id: 'vuln-wifi-open',
      severity: 'critical',
      title: 'Red Wi-Fi Abierta sin Cifrado',
      description: 'Cualquier persona dentro del radio de alcance puede capturar el tráfico no cifrado de los usuarios o infectar dispositivos.',
      remediation: 'Establece cifrado WPA3 o WPA2-Personal con clave robusta.'
    });
  } else if (config.wifi24Security === 'wep' || config.wifi5Security === 'wep') {
    score -= 35;
    vulnerabilities.push({
      id: 'vuln-wifi-wep',
      severity: 'critical',
      title: 'Cifrado WEP Obsoleto e Inseguro',
      description: 'El algoritmo WEP tiene debilidades criptográficas en sus vectores de inicialización (IV). Puede ser descifrado en menos de 60 segundos.',
      remediation: 'Actualiza inmediatamente a WPA2-AES o WPA3-Personal.'
    });
  } else if (config.wifi5Security === 'wpa3') {
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
