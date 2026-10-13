import { RouterConfig, VirtualDevice, NetworkTelemetry } from '../types/router';
import {
  extractHost,
  getDhcpPool,
  getEffectiveDns,
  intToIp,
  ipToInt,
  isApipa,
  isDnsWorking,
  isDomainBlockedByParental,
  isPrivateIp,
  isValidIPv4,
  maskToPrefix,
  sameSubnet,
  simulatedResolve
} from './netUtils';

export const ROUTER_CONSOLE_ID = '__router__';
export const ROUTER_LAN_MAC = '00:90:A9:7B:44:01';
export const ROUTER_WAN_MAC = '00:90:A9:7B:44:00';

export interface CliContext {
  config: RouterConfig;
  devices: VirtualDevice[];
  telemetry: NetworkTelemetry;
  isRebooting: boolean;
  /** Equipo desde el que se ejecuta el comando, o null para la consola del router */
  source: VirtualDevice | null;
}

export interface CliResult {
  lines: string[];
  isError?: boolean;
  /** Acción que el componente debe ejecutar (p. ej. reiniciar el router) */
  action?: 'reboot' | 'clear';
}

export const CLIENT_COMMANDS = [
  'help', 'clear', 'ipconfig', 'ifconfig', 'arp -a', 'ping', 'traceroute', 'tracert',
  'nslookup', 'dig', 'curl -I', 'speedtest'
];

export const ROUTER_COMMANDS = [
  'help', 'clear', 'show ip interface brief', 'show arp', 'show dhcp leases', 'dhcp-leases',
  'show running-config', 'iptables -L -n -v', 'iptables -t nat -L -n -v', 'netstat -tuln',
  'wifi-status', 'ping', 'traceroute', 'nslookup', 'system-reboot'
];

// ---------------------------------------------------------------------------
// Utilidades de red compartidas
// ---------------------------------------------------------------------------

function linkLatency(device: VirtualDevice | null): number {
  if (!device) return 0;
  if (device.connectionType.startsWith('ethernet')) return 1;
  if (device.connectionType === 'wifi_5g') return 3;
  if (device.connectionType === 'wifi_guest') return 6;
  return 9; // 2.4 GHz
}

function stableHash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Latencia añadida por Internet según el destino (los anycast DNS están "cerca"). */
function internetRtt(ip: string): number {
  if (['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1', '9.9.9.9'].includes(ip)) return 4;
  return 12 + (stableHash(ip) % 38);
}

function isGuestIsolatedPair(a: VirtualDevice | null, b: VirtualDevice | null, config: RouterConfig): boolean {
  if (!config.guestIsolation || !a || !b) return false;
  return a.connectionType === 'wifi_guest' || b.connectionType === 'wifi_guest';
}

type Resolution =
  | { ok: true; ip: string; viaDns: boolean }
  | { ok: false; reason: 'dns_timeout' | 'nxdomain_parental' | 'invalid' };

function resolveHost(target: string, ctx: CliContext): Resolution {
  const host = extractHost(target);
  if (!host) return { ok: false, reason: 'invalid' };
  if (isValidIPv4(host)) return { ok: true, ip: host, viaDns: false };
  if (host === 'gateway' || host === 'router' || host === 'localhost') {
    return { ok: true, ip: host === 'localhost' ? '127.0.0.1' : ctx.config.lanIp, viaDns: false };
  }
  if (isDomainBlockedByParental(host, ctx.config)) return { ok: false, reason: 'nxdomain_parental' };
  if (!isDnsWorking(ctx.config)) return { ok: false, reason: 'dns_timeout' };
  return { ok: true, ip: simulatedResolve(host), viaDns: true };
}

type Reachability =
  | { reachable: true; rtt: number; ttl: number; hops: 'self' | 'lan' | 'internet' }
  | { reachable: false; kind: 'timeout' | 'unreachable'; note?: string };

function reach(targetIp: string, ctx: CliContext): Reachability {
  const { config, devices, source, isRebooting } = ctx;
  const sourceIp = source ? source.ip : config.lanIp;

  if (targetIp.startsWith('127.') || targetIp === sourceIp) return { reachable: true, rtt: 0, ttl: 128, hops: 'self' };
  if (isRebooting) return { reachable: false, kind: 'timeout', note: 'El router se está reiniciando: no hay puerta de enlace disponible.' };

  // Destino en la LAN
  if (sameSubnet(targetIp, config.lanIp, config.lanSubnetMask)) {
    if (targetIp === config.lanIp) {
      if (source && source.connectionType === 'wifi_guest' && config.guestIsolation) {
        // El aislamiento de invitados bloquea el acceso al panel/ICMP del router
        return { reachable: false, kind: 'timeout', note: 'AP Isolation: la red de invitados no puede alcanzar la LAN ni el router.' };
      }
      return { reachable: true, rtt: linkLatency(source), ttl: 64, hops: 'lan' };
    }
    const target = devices.find(d => d.isOnline && d.ip === targetIp);
    if (!target) return { reachable: false, kind: 'unreachable', note: `Nadie responde a ARP "who-has ${targetIp}": no hay ningún equipo con esa IP.` };
    if (isGuestIsolatedPair(source, target, config) && source?.id !== target.id) {
      return { reachable: false, kind: 'timeout', note: 'Tráfico descartado por el aislamiento de la red de invitados (AP Isolation).' };
    }
    const ttl = target.type === 'pc_gamer' || target.type === 'laptop_work' ? 128 : 64;
    return { reachable: true, rtt: linkLatency(source) + linkLatency(target), ttl, hops: 'lan' };
  }

  if (isApipa(targetIp)) {
    return { reachable: false, kind: 'unreachable', note: '169.254.x.x es enlace local (APIPA): no se enruta a través del router.' };
  }
  const [a, b, c] = targetIp.split('.').map(Number);
  const nonRoutable = isPrivateIp(targetIp) || a === 0 || a >= 224 ||
    (a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113);
  if (nonRoutable) {
    return { reachable: false, kind: 'timeout', note: `${targetIp} es una dirección privada o reservada que no existe en tu LAN: el ISP descarta el paquete.` };
  }

  // Destino en Internet
  const base = source ? source.currentLatencyMs : 8 + Math.round(ctx.telemetry.averageLatencyMs / 4);
  return { reachable: true, rtt: base + internetRtt(targetIp), ttl: 117, hops: 'internet' };
}

/** Cada uno de los 4 paquetes se pierde con la probabilidad de pérdida actual del equipo. */
function lostPackets(ctx: CliContext): number {
  const loss = ctx.source ? ctx.source.packetLossPercent : ctx.telemetry.packetLossPercent;
  let lost = 0;
  for (let i = 0; i < 4; i++) if (Math.random() * 100 < loss) lost++;
  return lost;
}

function resolutionError(target: string, res: Extract<Resolution, { ok: false }>): string[] {
  if (res.reason === 'nxdomain_parental') {
    return [
      `La solicitud de ping no pudo encontrar el host ${target}. Compruebe el nombre y vuelva a intentarlo.`,
      `[DIDÁCTICA]: El Control Parental del router responde NXDOMAIN para "${extractHost(target)}".`
    ];
  }
  if (res.reason === 'dns_timeout') {
    return [
      `La solicitud de ping no pudo encontrar el host ${target}. Compruebe el nombre y vuelva a intentarlo.`,
      `[DIDÁCTICA]: El servidor DNS configurado no responde. Prueba "ping 8.8.8.8": si funciona por IP pero no por nombre, el fallo es de DNS.`
    ];
  }
  return [`Destino no válido: "${target}".`];
}

// ---------------------------------------------------------------------------
// Comandos comunes (cliente y router)
// ---------------------------------------------------------------------------

function cmdPing(args: string[], ctx: CliContext): CliResult {
  const target = args.find(a => !a.startsWith('-')) || ctx.config.lanIp;
  const res = resolveHost(target, ctx);
  if (!res.ok) return { lines: resolutionError(target, res), isError: true };

  const ip = res.ip;
  const label = res.viaDns ? `${extractHost(target)} [${ip}]` : ip;
  const r = reach(ip, ctx);
  const lines = [`Haciendo ping a ${label} con 32 bytes de datos:`];

  if (!r.reachable) {
    for (let i = 0; i < 4; i++) {
      lines.push(r.kind === 'unreachable'
        ? `Respuesta desde ${ctx.source ? ctx.source.ip : ctx.config.lanIp}: Host de destino inaccesible.`
        : 'Tiempo de espera agotado para esta solicitud.');
    }
    lines.push('', `Estadísticas de ping para ${ip}:`);
    lines.push(r.kind === 'unreachable'
      ? '    Paquetes: enviados = 4, recibidos = 4, perdidos = 0 (0% perdidos),'
      : '    Paquetes: enviados = 4, recibidos = 0, perdidos = 4 (100% perdidos),');
    if (r.kind === 'unreachable') lines.push('    (las 4 respuestas son errores ICMP "Destination Unreachable", no ecos)');
    if (r.note) lines.push(`[DIDÁCTICA]: ${r.note}`);
    return { lines, isError: true };
  }

  const lost = r.hops === 'self' || r.hops === 'lan' ? 0 : lostPackets(ctx);
  const rtts: number[] = [];
  const jitter = [0, 1, -1, 2];
  for (let i = 0; i < 4; i++) {
    // Los paquetes perdidos se reparten al final para que el patrón sea legible
    if (i >= 4 - lost) {
      lines.push('Tiempo de espera agotado para esta solicitud.');
    } else {
      const t = Math.max(r.rtt === 0 ? 0 : 1, r.rtt + jitter[i]);
      rtts.push(t);
      lines.push(`Respuesta desde ${ip}: bytes=32 tiempo${t === 0 ? '<1' : '='}${t === 0 ? '' : t}ms TTL=${r.ttl}`);
    }
  }
  const received = 4 - lost;
  lines.push('', `Estadísticas de ping para ${ip}:`);
  lines.push(`    Paquetes: enviados = 4, recibidos = ${received}, perdidos = ${lost} (${lost * 25}% perdidos),`);
  if (rtts.length > 0) {
    const avg = Math.round(rtts.reduce((s, t) => s + t, 0) / rtts.length);
    lines.push('Tiempos aproximados de ida y vuelta en milisegundos:');
    lines.push(`    Mínimo = ${Math.min(...rtts)}ms, Máximo = ${Math.max(...rtts)}ms, Media = ${avg}ms`);
    if (avg > 100) {
      lines.push(`[AVISO DIDÁCTICO]: La latencia es alta (${avg}ms): congestión de colas (Bufferbloat) o un ataque DoS. Revisa QoS y la protección DoS.`);
    }
  }
  if (lost > 0) lines.push('[AVISO DIDÁCTICO]: Hay pérdida de paquetes: interferencias Wi-Fi, saturación del enlace o DoS en curso.');
  return { lines, isError: lost === 4 };
}

function cmdTraceroute(args: string[], ctx: CliContext): CliResult {
  const target = args.find(a => !a.startsWith('-')) || '8.8.8.8';
  const res = resolveHost(target, ctx);
  if (!res.ok) {
    return { lines: [`No se puede resolver el nombre del sistema de destino ${target}.`, ...resolutionError(target, res).slice(1)], isError: true };
  }
  const ip = res.ip;
  const r = reach(ip, ctx);
  const lines = [`Traza a ${res.viaDns ? `${extractHost(target)} [${ip}]` : ip} sobre un máximo de 30 saltos:`, ''];
  const fmt = (n: number) => `${Math.max(1, Math.round(n))} ms`.padStart(6);
  const hop = (i: number, t: number, host: string) => `  ${String(i).padStart(2)}  ${fmt(t)}  ${fmt(t + 1)}  ${fmt(t)}  ${host}`;
  const stars = (i: number) => `  ${String(i).padStart(2)}       *        *        *     Tiempo de espera agotado para esta solicitud.`;

  const first = linkLatency(ctx.source) || 1;
  if (r.reachable && r.hops === 'self') {
    lines.push(hop(1, 1, `${ip} [este equipo]`));
  } else if (r.reachable && r.hops === 'lan') {
    lines.push(hop(1, r.rtt, ip === ctx.config.lanIp ? `${ip} [Router Gateway Local]` : ip));
  } else if (r.reachable) {
    const steps = [first, Math.max(first + 2, r.rtt * 0.45), Math.max(first + 4, r.rtt * 0.75), r.rtt];
    if (ctx.source) lines.push(hop(1, steps[0], `${ctx.config.lanIp} [Router Gateway Local]`));
    lines.push(hop(ctx.source ? 2 : 1, steps[1], `${ctx.config.wanGateway} [Nodo Agregador ISP Fibra]`));
    lines.push(hop(ctx.source ? 3 : 2, steps[2], '185.220.100.254 [Backbone Red Principal]'));
    lines.push(hop(ctx.source ? 4 : 3, steps[3], `${ip} [Destino alcanzado]`));
  } else {
    let n = 1;
    if (ctx.source && !ctx.isRebooting && !(ctx.source.connectionType === 'wifi_guest' && ctx.config.guestIsolation && sameSubnet(ip, ctx.config.lanIp, ctx.config.lanSubnetMask))) {
      lines.push(hop(n++, first, `${ctx.config.lanIp} [Router Gateway Local]`));
    }
    if (r.kind === 'unreachable') {
      lines.push(`  ${String(n).padStart(2)}  ${ctx.source ? ctx.source.ip : ctx.config.lanIp} informa: Host de destino inaccesible.`);
    } else {
      for (let i = 0; i < 3; i++) lines.push(stars(n++));
    }
    lines.push('', 'Traza interrumpida: el destino no responde.');
    if (r.note) lines.push(`[DIDÁCTICA]: ${r.note}`);
    return { lines, isError: true };
  }
  lines.push('', 'Traza completa.');
  return { lines };
}

function cmdNslookup(args: string[], ctx: CliContext): CliResult {
  const domain = args.find(a => !a.startsWith('-')) || 'google.com';
  const host = extractHost(domain);
  const { config } = ctx;
  const effective = getEffectiveDns(config);
  // En modo ISP el router hace de relé DNS (dnsmasq) y entrega su propia IP a los clientes
  const server = ctx.source && config.wanDnsMode === 'ISP' ? config.lanIp : effective.primary;
  const lines = [`Servidor:  ${server}`, `Address:   ${server}#53`, ''];

  if (isValidIPv4(host)) {
    lines.push(`** ${server} no puede encontrar ${host}: No existe un registro PTR en el simulador`);
    return { lines, isError: true };
  }
  if (isDomainBlockedByParental(host, config)) {
    lines.push(`** ${server} no puede encontrar ${host}: Non-existent domain (NXDOMAIN)`);
    lines.push(`[DIDÁCTICA]: El Control Parental del router interceptó la consulta DNS hacia "${host}" y devolvió NXDOMAIN.`);
    return { lines, isError: true };
  }
  if (!isDnsWorking(config)) {
    return {
      lines: [
        `DNS request timed out.`,
        `    timeout was 2 seconds.`,
        `Servidor:  UnKnown`,
        `Address:   ${effective.primary}`,
        '',
        `*** Se agotó el tiempo de espera de la solicitud a ${effective.primary} (y ${effective.secondary}).`,
        `[DIDÁCTICA]: Los servidores DNS configurados (${effective.primary}, ${effective.secondary}) no responden. Sin DNS no se pueden abrir webs por nombre aunque el ping por IP funcione.`
      ],
      isError: true
    };
  }
  lines.push('Respuesta no autoritativa:', `Nombre:    ${host}`, `Address:   ${simulatedResolve(host)}`);
  return { lines };
}

// ---------------------------------------------------------------------------
// Comandos de cliente
// ---------------------------------------------------------------------------

function cmdIpconfig(ctx: CliContext): CliResult {
  const { config, source } = ctx;
  if (!source) return { lines: [] };
  const lease = config.staticLeases.find(l => l.mac.toLowerCase() === source.mac.toLowerCase());
  const dns = config.wanDnsMode === 'Custom'
    ? `${config.wanPrimaryDns}, ${config.wanSecondaryDns}`
    : `${config.lanIp} (relé DNS del router)`;
  return {
    lines: [
      `Configuración IP del host [${source.name}]:`,
      '',
      `  Adaptador de red        : ${source.connectionType.replace(/_/g, ' ').toUpperCase()}`,
      `  Dirección IPv4          : ${source.ip}`,
      `  Máscara de subred       : ${config.lanSubnetMask} (/${maskToPrefix(config.lanSubnetMask)})`,
      `  Puerta de enlace (GW)   : ${config.lanIp}`,
      `  Dirección física (MAC)  : ${source.mac}`,
      `  Servidores DNS          : ${dns}`,
      `  Origen de la dirección  : ${lease ? `Reserva DHCP estática (${lease.hostname})` : `DHCP automático (concesión ${config.dhcpLeaseTimeHours} h)`}`
    ]
  };
}

function cmdClientArp(ctx: CliContext): CliResult {
  const { config, devices, source } = ctx;
  if (!source) return { lines: [] };
  const lines = [
    `Interfaz: ${source.ip} --- ${source.connectionType.replace(/_/g, ' ')}`,
    '  Dirección de Internet    Dirección física         Tipo',
  ];
  const isolated = source.connectionType === 'wifi_guest' && config.guestIsolation;
  lines.push(`  ${config.lanIp.padEnd(24)} ${ROUTER_LAN_MAC.padEnd(24)} dinámico (gateway)`);
  devices
    .filter(d => d.id !== source.id && d.isOnline && !isolated && !isGuestIsolatedPair(source, d, config))
    .forEach(d => lines.push(`  ${d.ip.padEnd(24)} ${d.mac.padEnd(24)} dinámico (${d.name.slice(0, 18)})`));
  if (isolated) lines.push('[DIDÁCTICA]: Con AP Isolation solo ves la puerta de enlace: el resto de equipos es invisible en capa 2.');
  return { lines };
}

function cmdCurl(args: string[], ctx: CliContext): CliResult {
  const url = args.find(a => !a.startsWith('-')) || 'http://example.com';
  const host = extractHost(url);
  const res = resolveHost(url, ctx);
  if (!res.ok) {
    if (res.reason === 'nxdomain_parental') {
      return {
        lines: [
          'HTTP/1.1 403 Forbidden',
          'Server: NetSim-ParentalFilter/1.0',
          'Content-Type: text/html',
          '',
          '<!DOCTYPE html><html><body><h1>Acceso Bloqueado por Control Parental</h1></body></html>',
          `[DIDÁCTICA]: El router redirige "${host}" a su página local de bloqueo.`
        ],
        isError: true
      };
    }
    return {
      lines: [
        `curl: (6) Could not resolve host: ${host}`,
        res.reason === 'dns_timeout' ? '[DIDÁCTICA]: El DNS configurado no responde; la conexión a Internet en sí puede estar funcionando.' : ''
      ].filter(Boolean),
      isError: true
    };
  }
  const r = reach(res.ip, ctx);
  if (!r.reachable) {
    return {
      lines: [
        r.kind === 'unreachable'
          ? `curl: (7) Failed to connect to ${host} port 80: No route to host`
          : `curl: (28) Failed to connect to ${host} port 80 after 21000 ms: Connection timed out`,
        ...(r.note ? [`[DIDÁCTICA]: ${r.note}`] : [])
      ],
      isError: true
    };
  }
  if (res.ip === ctx.config.lanIp) {
    return {
      lines: ['HTTP/1.1 200 OK', `Date: ${new Date().toUTCString()}`, 'Server: NetSim-httpd/3.0 (panel de administración)', 'Content-Type: text/html; charset=UTF-8', 'Connection: close']
    };
  }
  if (r.hops === 'lan') {
    return { lines: [`curl: (7) Failed to connect to ${host} port 80: Connection refused`, '[DIDÁCTICA]: El equipo existe y responde, pero no tiene ningún servidor web escuchando en el puerto 80.'], isError: true };
  }
  return {
    lines: [
      'HTTP/1.1 200 OK',
      `Date: ${new Date().toUTCString()}`,
      'Server: Apache/2.4.58',
      'Content-Type: text/html; charset=UTF-8',
      `Content-Length: ${1024 + (stableHash(host) % 9000)}`,
      'Connection: keep-alive'
    ]
  };
}

function cmdSpeedtest(ctx: CliContext): CliResult {
  const { source, config } = ctx;
  if (!source) return { lines: [] };
  if (ctx.isRebooting) return { lines: ['[error] Sin conexión: el router se está reiniciando.'], isError: true };
  if (!isDnsWorking(config)) {
    return { lines: ['[error] Cannot retrieve speedtest configuration: Could not resolve host www.speedtest.net', '[DIDÁCTICA]: Fallo de DNS.'], isError: true };
  }
  return {
    lines: [
      'Iniciando prueba de velocidad hacia el servidor Speedtest más cercano...',
      `Conectando vía WAN (${config.wanIp})...`,
      `Latencia           : ${source.currentLatencyMs} ms   | Pérdida: ${source.packetLossPercent}%`,
      `Velocidad de bajada: ${source.currentDownloadMbps} Mbps`,
      `Velocidad de subida: ${source.currentUploadMbps} Mbps`,
      `Línea contratada   : ${config.qosTotalDownlinkMbps} Mbps bajada / ${config.qosTotalUplinkMbps} Mbps subida`,
      '[DIDÁCTICA]: La prueba mide lo que le queda a ESTE equipo tras repartir la línea con el resto (QoS / congestión).'
    ]
  };
}

// ---------------------------------------------------------------------------
// Comandos de la consola del router
// ---------------------------------------------------------------------------

function portStatus(port: 1 | 2 | 3 | 4, devices: VirtualDevice[]): boolean {
  return devices.some(d => d.connectionType === `ethernet_lan${port}`);
}

function cmdShowIpIntBrief(ctx: CliContext): CliResult {
  const { config, devices } = ctx;
  const row = (iface: string, ip: string, method: string, status: string, proto: string) =>
    `${iface.padEnd(22)}${ip.padEnd(17)}YES ${method.padEnd(7)}${status.padEnd(22)}${proto}`;
  const lines = [
    `${'Interface'.padEnd(22)}${'IP-Address'.padEnd(17)}OK? ${'Method'.padEnd(7)}${'Status'.padEnd(22)}Protocol`,
    row('wan0 (GPON)', config.wanIp, config.wanConnectionType === 'Static' ? 'manual' : 'DHCP', 'up', 'up'),
    row('br-lan', config.lanIp, 'manual', 'up', 'up')
  ];
  ([1, 2, 3, 4] as const).forEach(p => {
    const up = portStatus(p, devices);
    lines.push(row(`lan${p} (RJ-45)`, 'unassigned', 'unset', up ? 'up' : 'down', up ? 'up' : 'down'));
  });
  lines.push(row('wlan0 (2.4 GHz)', 'unassigned', 'unset', config.wifi24Enabled ? 'up' : 'administratively down', config.wifi24Enabled ? 'up' : 'down'));
  lines.push(row('wlan1 (5 GHz)', 'unassigned', 'unset', config.wifi5Enabled ? 'up' : 'administratively down', config.wifi5Enabled ? 'up' : 'down'));
  lines.push(row('wlan-guest', 'unassigned', 'unset', config.guestWifiEnabled ? 'up' : 'administratively down', config.guestWifiEnabled ? 'up' : 'down'));
  return { lines };
}

function deviceIface(d: VirtualDevice): string {
  if (d.connectionType.startsWith('ethernet')) return d.connectionType.replace('ethernet_', '');
  return { wifi_24g: 'wlan0', wifi_5g: 'wlan1', wifi_guest: 'wlan-guest' }[d.connectionType as 'wifi_24g' | 'wifi_5g' | 'wifi_guest'] || '-';
}

function cmdRouterArp(ctx: CliContext): CliResult {
  const lines = [`${'IP address'.padEnd(18)}${'HW address'.padEnd(20)}${'Flags'.padEnd(8)}Device`];
  lines.push(`${ctx.config.wanGateway.padEnd(18)}${'5C:E3:0E:11:00:01'.padEnd(20)}${'0x2'.padEnd(8)}wan0`);
  ctx.devices.filter(d => d.isOnline).forEach(d => {
    lines.push(`${d.ip.padEnd(18)}${d.mac.padEnd(20)}${'0x2'.padEnd(8)}${deviceIface(d)}`);
  });
  return { lines };
}

function cmdDhcpLeases(ctx: CliContext): CliResult {
  const { config, devices } = ctx;
  const pool = getDhcpPool(config);
  const lines: string[] = [];
  if (!config.dhcpEnabled) {
    lines.push('dnsmasq-dhcp: servidor DHCP DESACTIVADO.');
  } else if (!pool.valid) {
    lines.push(`dnsmasq-dhcp: ERROR en la configuración del pool: ${pool.error}.`);
  } else {
    const used = devices.filter(d => d.isOnline && isValidIPv4(d.ip) && ipToInt(d.ip) >= pool.start && ipToInt(d.ip) <= pool.end).length;
    lines.push(`dnsmasq-dhcp: pool ${intToIp(pool.start)} - ${intToIp(pool.end)} (${pool.size} direcciones, ${used} en uso), concesión ${config.dhcpLeaseTimeHours} h`);
  }
  lines.push('', `${'Tipo'.padEnd(10)}${'MAC'.padEnd(20)}${'IP'.padEnd(26)}Hostname`);
  devices.forEach(d => {
    const lease = config.staticLeases.find(l => l.mac.toLowerCase() === d.mac.toLowerCase());
    if (!d.isOnline && !lease) return;
    lines.push(`${(lease ? 'estática' : 'dinámica').padEnd(10)}${d.mac.padEnd(20)}${(d.isOnline ? d.ip : `${lease!.ip} (offline)`).padEnd(26)}${d.name}`);
  });
  config.staticLeases
    .filter(l => !devices.some(d => d.mac.toLowerCase() === l.mac.toLowerCase()))
    .forEach(l => lines.push(`${'estática'.padEnd(10)}${l.mac.padEnd(20)}${`${l.ip} (sin equipo)`.padEnd(26)}${l.hostname}`));
  const apipa = devices.filter(d => d.connectionType !== 'disconnected' && isApipa(d.ip));
  if (apipa.length > 0) {
    lines.push('', `[AVISO]: ${apipa.length} cliente(s) sin concesión, autoconfigurados con APIPA: ${apipa.map(d => d.name).join(', ')}.`);
  }
  return { lines };
}

function cmdIptables(args: string[], ctx: CliContext): CliResult {
  const { config } = ctx;
  const natTable = args.includes('-t') && args[args.indexOf('-t') + 1] === 'nat';
  const r = (target: string, prot: string, inIf: string, outIf: string, src: string, dst: string, extra = '') =>
    `    0     0 ${target.padEnd(11)}${prot.padEnd(6)}--  ${inIf.padEnd(10)} ${outIf.padEnd(10)} ${src.padEnd(18)} ${dst.padEnd(18)} ${extra}`;
  const header = ` pkts bytes ${'target'.padEnd(11)}${'prot'.padEnd(6)}opt ${'in'.padEnd(10)} ${'out'.padEnd(10)} ${'source'.padEnd(18)} ${'destination'.padEnd(18)}`;
  const lines: string[] = [];

  if (natTable) {
    lines.push('Chain PREROUTING (policy ACCEPT)', header);
    config.portForwardRules.filter(rule => rule.enabled).forEach(rule => {
      const protos = rule.protocol === 'BOTH' ? ['tcp', 'udp'] : [rule.protocol.toLowerCase()];
      protos.forEach(p => lines.push(r('DNAT', p, 'wan0', '*', '0.0.0.0/0', config.wanIp, `${p} dpt:${rule.externalPort} to:${rule.internalIp}:${rule.internalPort}  /* ${rule.serviceName} */`)));
    });
    if (config.dmzEnabled) lines.push(r('DNAT', 'all', 'wan0', '*', '0.0.0.0/0', config.wanIp, `to:${config.dmzHostIp}  /* DMZ: todo lo no mapeado */`));
    if (config.portForwardRules.every(rule => !rule.enabled) && !config.dmzEnabled) lines.push('    (sin reglas de reenvío activas)');
    lines.push('', 'Chain POSTROUTING (policy ACCEPT)', header);
    const network = intToIp((ipToInt(config.lanIp) & ipToInt(config.lanSubnetMask)) >>> 0);
    lines.push(r('MASQUERADE', 'all', '*', 'wan0', `${network}/${maskToPrefix(config.lanSubnetMask)}`, '0.0.0.0/0'));
    if (config.upnpEnabled) lines.push('', 'Chain MINIUPNPD (1 references)', '    (mapeos dinámicos creados por UPnP)');
    return { lines };
  }

  const policy = config.firewallSpiEnabled ? 'DROP' : 'ACCEPT';
  lines.push(`Chain INPUT (policy ${policy})`, header);
  lines.push(r('ACCEPT', 'all', 'lo', '*', '0.0.0.0/0', '0.0.0.0/0'));
  if (config.firewallSpiEnabled) lines.push(r('ACCEPT', 'all', '*', '*', '0.0.0.0/0', '0.0.0.0/0', 'ctstate RELATED,ESTABLISHED'));
  if (config.dosProtectionEnabled) {
    lines.push(r('DROP', 'tcp', 'wan0', '*', '0.0.0.0/0', '0.0.0.0/0', 'tcp flags:0x17/0x02 limit: above 300/sec burst 50 mode srcip  /* SYN flood */'));
  }
  lines.push(r(config.wanPingRespond ? 'ACCEPT' : 'DROP', 'icmp', 'wan0', '*', '0.0.0.0/0', '0.0.0.0/0', 'icmptype 8  /* ping WAN */'));
  if (config.remoteManagementEnabled) lines.push(r('ACCEPT', 'tcp', 'wan0', '*', '0.0.0.0/0', '0.0.0.0/0', `tcp dpt:${config.remoteManagementPort}  /* gestión remota */`));
  lines.push(r('ACCEPT', 'all', 'br-lan', '*', '0.0.0.0/0', '0.0.0.0/0'));
  if (config.guestWifiEnabled && config.guestIsolation) {
    lines.push(r('DROP', 'all', 'wlan-guest', '*', '0.0.0.0/0', config.lanIp, '/* invitados sin acceso al panel */'));
  }

  lines.push('', `Chain FORWARD (policy ${policy})`, header);
  if (config.firewallSpiEnabled) lines.push(r('ACCEPT', 'all', '*', '*', '0.0.0.0/0', '0.0.0.0/0', 'ctstate RELATED,ESTABLISHED'));
  if (config.macFilteringMode !== 'disabled') {
    config.macFilterList.forEach(mac => lines.push(r(config.macFilteringMode === 'blacklist' ? 'DROP' : 'ACCEPT', 'all', 'br-lan', '*', '0.0.0.0/0', '0.0.0.0/0', `MAC ${mac}`)));
    if (config.macFilteringMode === 'whitelist') lines.push(r('DROP', 'all', 'br-lan', '*', '0.0.0.0/0', '0.0.0.0/0', '/* MAC no autorizada */'));
  }
  if (config.guestWifiEnabled && config.guestIsolation) lines.push(r('DROP', 'all', 'wlan-guest', 'br-lan', '0.0.0.0/0', '0.0.0.0/0', '/* AP Isolation */'));
  lines.push(r('ACCEPT', 'all', 'br-lan', 'wan0', '0.0.0.0/0', '0.0.0.0/0'));
  if (config.guestWifiEnabled) lines.push(r('ACCEPT', 'all', 'wlan-guest', 'wan0', '0.0.0.0/0', '0.0.0.0/0'));
  config.portForwardRules.filter(rule => rule.enabled).forEach(rule => {
    lines.push(r('ACCEPT', rule.protocol === 'BOTH' ? 'all' : rule.protocol.toLowerCase(), 'wan0', 'br-lan', '0.0.0.0/0', rule.internalIp, `dpt:${rule.internalPort}`));
  });
  if (config.dmzEnabled) lines.push(r('ACCEPT', 'all', 'wan0', 'br-lan', '0.0.0.0/0', config.dmzHostIp, '/* DMZ */'));

  lines.push('', 'Chain OUTPUT (policy ACCEPT)', header);
  if (!config.firewallSpiEnabled) lines.push('', '[AVISO]: Firewall SPI desactivado: política ACCEPT, cualquier paquete entrante es aceptado.');
  lines.push('', 'Consejo: "iptables -t nat -L -n -v" muestra las reglas de Port Forwarding / DMZ.');
  return { lines };
}

function cmdNetstat(ctx: CliContext): CliResult {
  const { config } = ctx;
  const row = (proto: string, local: string, state: string, prog: string) =>
    `${proto.padEnd(6)}0      0 ${local.padEnd(24)}${'0.0.0.0:*'.padEnd(20)}${state.padEnd(12)}${prog}`;
  const lines = [
    'Conexiones activas de Internet (solo servidores)',
    `Proto Recv-Q Send-Q ${'Local Address'.padEnd(24)}${'Foreign Address'.padEnd(20)}${'State'.padEnd(12)}Programa`,
    row('tcp', `${config.lanIp}:53`, 'LISTEN', 'dnsmasq'),
    row('tcp', `${config.lanIp}:80`, 'LISTEN', 'httpd (panel web)'),
    row('tcp', `${config.lanIp}:443`, 'LISTEN', 'httpd (panel web TLS)')
  ];
  if (config.remoteManagementEnabled) lines.push(row('tcp', `0.0.0.0:${config.remoteManagementPort}`, 'LISTEN', 'httpd (GESTIÓN REMOTA WAN)'));
  if (config.upnpEnabled) lines.push(row('tcp', `${config.lanIp}:5000`, 'LISTEN', 'miniupnpd'));
  lines.push(row('udp', `${config.lanIp}:53`, '', 'dnsmasq'));
  if (config.dhcpEnabled) lines.push(row('udp', '0.0.0.0:67', '', 'dnsmasq-dhcp'));
  if (config.upnpEnabled) lines.push(row('udp', '0.0.0.0:1900', '', 'miniupnpd (SSDP)'));
  if (config.remoteManagementEnabled) lines.push('', `[AVISO]: El panel escucha en 0.0.0.0:${config.remoteManagementPort}, también desde Internet.`);
  return { lines };
}

function cmdWifiStatus(ctx: CliContext): CliResult {
  const { config, devices } = ctx;
  const clients = (t: VirtualDevice['connectionType']) => devices.filter(d => d.isOnline && d.connectionType === t).length;
  const sec = (s: string) => ({ none: 'ABIERTA (sin cifrado)', wep: 'WEP (obsoleto)', wpa2: 'WPA2-PSK (CCMP)', wpa3: 'WPA3-SAE', wpa2_wpa3: 'WPA2/WPA3 mixto' }[s] || s);
  const clean24 = [1, 6, 11].includes(config.wifi24Channel);
  return {
    lines: [
      `wlan0  2.4 GHz  ${config.wifi24Enabled ? 'ACTIVA' : 'APAGADA'}`,
      `       SSID "${config.wifi24Ssid}"${config.wifi24Hidden ? ' (oculto)' : ''}  canal ${config.wifi24Channel} / ${config.wifi24ChannelWidth} MHz${clean24 ? '' : '  ⚠ canal solapado (usa 1, 6 u 11)'}`,
      `       Seguridad: ${sec(config.wifi24Security)}  Potencia: ${config.wifi24TxPower}%  Clientes: ${clients('wifi_24g')}`,
      `wlan1  5 GHz    ${config.wifi5Enabled ? 'ACTIVA' : 'APAGADA'}`,
      `       SSID "${config.wifi5Ssid}"${config.wifi5Hidden ? ' (oculto)' : ''}  canal ${config.wifi5Channel} / ${config.wifi5ChannelWidth} MHz`,
      `       Seguridad: ${sec(config.wifi5Security)}  Potencia: ${config.wifi5TxPower}%  Clientes: ${clients('wifi_5g')}`,
      `wlan-guest      ${config.guestWifiEnabled ? 'ACTIVA' : 'APAGADA'}`,
      `       SSID "${config.guestWifiSsid}"  Aislamiento: ${config.guestIsolation ? 'SÍ' : 'NO'}  Límite: ${config.guestBandwidthLimitMbps || 'sin límite'} Mbps  Clientes: ${clients('wifi_guest')}`,
      `WPS: ${config.wpsEnabled ? (config.wpsMode === 'pin' ? 'ACTIVO con PIN (vulnerable a Pixie Dust)' : 'ACTIVO (botón físico)') : 'desactivado'}`
    ]
  };
}

function cmdRunningConfig(ctx: CliContext): CliResult {
  const { config } = ctx;
  const onOff = (b: boolean) => (b ? 'enable' : 'disable');
  return {
    lines: [
      '! NetSim running-config',
      `hostname ${config.modelName.split(' ').slice(0, 2).join('-')}`,
      `! firmware ${config.firmwareVersion}`,
      `interface wan0`,
      `  ip address ${config.wanConnectionType === 'Static' ? config.wanIp : 'dhcp'}`,
      `  mtu ${config.wanMtu}`,
      `interface br-lan`,
      `  ip address ${config.lanIp} ${config.lanSubnetMask}`,
      `ip dhcp pool LAN`,
      ...(config.dhcpEnabled ? [] : ['  shutdown']),
      `  range ${config.dhcpPoolStart} ${config.dhcpPoolEnd}`,
      `  lease ${config.dhcpLeaseTimeHours}h`,
      ...config.staticLeases.map(l => `  host ${l.hostname} hardware-address ${l.mac} ip ${l.ip}`),
      `ip name-server ${config.wanDnsMode === 'ISP' ? 'isp-provided' : `${config.wanPrimaryDns} ${config.wanSecondaryDns}`}`,
      `firewall spi ${onOff(config.firewallSpiEnabled)}`,
      `firewall dos-protection ${onOff(config.dosProtectionEnabled)}`,
      `firewall wan-ping ${onOff(config.wanPingRespond)}`,
      `remote-management ${onOff(config.remoteManagementEnabled)}${config.remoteManagementEnabled ? ` port ${config.remoteManagementPort}` : ''}`,
      `upnp ${onOff(config.upnpEnabled)}`,
      `dmz ${config.dmzEnabled ? `host ${config.dmzHostIp}` : 'disable'}`,
      ...config.portForwardRules.map(rule => `${rule.enabled ? '' : '! '}ip nat inside source static ${rule.protocol.toLowerCase()} ${rule.internalIp} ${rule.internalPort} interface wan0 ${rule.externalPort}`),
      `qos ${onOff(config.qosEnabled)} downlink ${config.qosTotalDownlinkMbps} uplink ${config.qosTotalUplinkMbps}`,
      'end'
    ]
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const CLIENT_HELP = [
  'Comandos disponibles en el equipo cliente:',
  '  ping <ip|host>          Prueba de conectividad ICMP Echo y RTT',
  '  traceroute <ip|host>    Ruta de saltos (alias: tracert)',
  '  nslookup <dominio>      Consulta al servidor DNS (alias: dig)',
  '  arp -a                  Tabla ARP del equipo (IP <-> MAC en la subred)',
  '  ipconfig / ifconfig     Configuración IP, máscara, gateway y DNS',
  '  curl -I <url>           Petición HTTP HEAD (firewall y control parental)',
  '  speedtest               Prueba de velocidad contra Internet',
  '  clear                   Limpia la pantalla',
  '',
  'Tab autocompleta comandos · ↑/↓ recorren el historial.',
  'Elige "Consola del Router" en el selector para comandos de administración (show, iptables, netstat...).'
];

const ROUTER_HELP = [
  'Consola de administración del router (estilo Cisco IOS / Linux):',
  '  show ip interface brief      Estado e IPs de las interfaces',
  '  show arp                     Tabla ARP del router',
  '  show dhcp leases             Concesiones DHCP (alias: dhcp-leases)',
  '  show running-config          Configuración activa',
  '  iptables -L -n -v            Reglas del firewall (filter)',
  '  iptables -t nat -L -n -v     Reglas NAT: Port Forwarding, DMZ, MASQUERADE',
  '  netstat -tuln                Servicios escuchando en el router',
  '  wifi-status                  Estado de las radios Wi-Fi y WPS',
  '  ping / traceroute / nslookup Diagnóstico desde el propio router',
  '  system-reboot                Reinicia el router (alias: reload)',
  '  clear                        Limpia la pantalla'
];

export function executeCli(rawCmd: string, ctx: CliContext): CliResult {
  const parts = rawCmd.trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);
  const joined = parts.map(p => p.toLowerCase()).join(' ');

  if (command === 'clear' || command === 'cls') return { lines: [], action: 'clear' };
  if (command === 'help' || command === '?') return { lines: ctx.source ? CLIENT_HELP : ROUTER_HELP };

  if (!ctx.source) {
    if (ctx.isRebooting) return { lines: ['Conexión con la consola perdida: el router se está reiniciando...'], isError: true };
    if (joined.startsWith('show ip int')) return cmdShowIpIntBrief(ctx);
    if (joined === 'show arp' || joined === 'arp -a' || joined === 'arp') return cmdRouterArp(ctx);
    if (joined.startsWith('show dhcp') || command === 'dhcp-leases') return cmdDhcpLeases(ctx);
    if (joined.startsWith('show run')) return cmdRunningConfig(ctx);
    if (command === 'iptables') return cmdIptables(args.map(a => a.toLowerCase()), ctx);
    if (command === 'netstat' || joined.startsWith('ss -tuln')) return cmdNetstat(ctx);
    if (command === 'wifi-status' || joined === 'show wireless') return cmdWifiStatus(ctx);
    if (command === 'system-reboot' || command === 'reload' || command === 'reboot') {
      return { lines: ['Proceed with reload? [confirm] y', 'Reiniciando el router: se cortarán todas las conexiones durante unos segundos...'], action: 'reboot' };
    }
    if (command === 'ping') return cmdPing(args, ctx);
    if (command === 'traceroute' || command === 'tracert') return cmdTraceroute(args, ctx);
    if (command === 'nslookup' || command === 'dig') return cmdNslookup(args, ctx);
    return { lines: [`% Comando no reconocido: "${rawCmd.trim()}"`, 'Escribe "help" para ver los comandos de la consola del router.'], isError: true };
  }

  const source = ctx.source;
  if (!source.isOnline && command !== 'ipconfig' && command !== 'ifconfig') {
    return {
      lines: ['error: Interfaz de red sin conectividad.', `Estado actual: ${source.statusLog}`, 'Revisa la conexión del equipo (pestaña Dispositivos) o la configuración del router.'],
      isError: true
    };
  }

  switch (command) {
    case 'ipconfig':
    case 'ifconfig':
      return cmdIpconfig(ctx);
    case 'arp':
      return cmdClientArp(ctx);
    case 'ping':
      return cmdPing(args, ctx);
    case 'traceroute':
    case 'tracert':
      return cmdTraceroute(args, ctx);
    case 'nslookup':
    case 'dig':
      return cmdNslookup(args, ctx);
    case 'curl':
      return cmdCurl(args, ctx);
    case 'speedtest':
      return cmdSpeedtest(ctx);
    default:
      if (ROUTER_COMMANDS.some(c => c.split(' ')[0] === command)) {
        return { lines: [`"${command}" es un comando de administración del router.`, 'Selecciona "Consola del Router" en el selector de dispositivo para usarlo.'], isError: true };
      }
      return { lines: [`Comando no reconocido: "${command}".`, 'Escribe "help" para ver la lista de comandos disponibles.'], isError: true };
  }
}

/** Autocompletado con Tab: devuelve el texto completado o la lista de candidatos. */
export function autocomplete(input: string, isRouter: boolean): { completed?: string; candidates: string[] } {
  const list = isRouter ? ROUTER_COMMANDS : CLIENT_COMMANDS;
  const value = input.replace(/^\s+/, '').toLowerCase();
  if (!value) return { candidates: list };
  const matches = list.filter(c => c.startsWith(value) && c !== value);
  if (matches.length === 1) return { completed: matches[0] + ' ', candidates: [] };
  if (matches.length > 1) {
    let prefix = matches[0];
    for (const m of matches) while (!m.startsWith(prefix)) prefix = prefix.slice(0, -1);
    return { completed: prefix.length > value.length ? prefix : undefined, candidates: matches };
  }
  return { candidates: [] };
}
