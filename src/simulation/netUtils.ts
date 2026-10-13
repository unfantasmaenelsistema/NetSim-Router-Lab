import { RouterConfig } from '../types/router';

// DNS que entrega el ISP cuando el router está en modo "DNS del proveedor".
export const ISP_DNS_PRIMARY = '80.58.61.250';
export const ISP_DNS_SECONDARY = '80.58.61.254';

export function isValidIPv4(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

export function ipToInt(ip: string): number {
  return ip.trim().split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

export function intToIp(n: number): string {
  return [24, 16, 8, 0].map(shift => (n >>> shift) & 255).join('.');
}

export function isValidSubnetMask(mask: string): boolean {
  if (!isValidIPv4(mask)) return false;
  const n = ipToInt(mask);
  // Una máscara válida es una secuencia continua de unos seguida de ceros
  const inverted = ~n >>> 0;
  return n !== 0 && (inverted & (inverted + 1)) === 0;
}

export function maskToPrefix(mask: string): number {
  return ipToInt(mask).toString(2).replace(/0/g, '').length;
}

export function sameSubnet(a: string, b: string, mask: string): boolean {
  if (!isValidIPv4(a) || !isValidIPv4(b) || !isValidIPv4(mask)) return false;
  const m = ipToInt(mask);
  return ((ipToInt(a) & m) >>> 0) === ((ipToInt(b) & m) >>> 0);
}

export function isPrivateIp(ip: string): boolean {
  if (!isValidIPv4(ip)) return false;
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function isApipa(ip: string): boolean {
  return ip.startsWith('169.254.');
}

/** APIPA determinista a partir de la MAC (169.254.x.y), como haría Windows/Linux al no recibir DHCPOFFER. */
export function apipaFromMac(mac: string): string {
  let hash = 0;
  for (const ch of mac) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `169.254.${(hash >>> 8) % 254 + 1}.${hash % 254 + 1}`;
}

/** Servidores DNS que usan realmente los clientes según el modo configurado. */
export function getEffectiveDns(config: RouterConfig): { primary: string; secondary: string } {
  if (config.wanDnsMode === 'Custom') {
    return { primary: config.wanPrimaryDns, secondary: config.wanSecondaryDns };
  }
  return { primary: ISP_DNS_PRIMARY, secondary: ISP_DNS_SECONDARY };
}

/**
 * Un servidor DNS "responde" si es una IPv4 pública enrutable. Las redes de documentación
 * (TEST-NET 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24), 0.0.0.0/8, loopback, APIPA,
 * multicast y las IPs privadas que no son el propio router no tienen un resolvedor detrás.
 */
export function isDnsServerReachable(ip: string, config: RouterConfig): boolean {
  if (!isValidIPv4(ip)) return false;
  if (ip === config.lanIp) return true;
  const [a, b, c] = ip.split('.').map(Number);
  if (a === 0 || a === 127 || a >= 224) return false;
  if (a === 169 && b === 254) return false;
  if ((a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113)) return false;
  if (isPrivateIp(ip)) return false;
  return true;
}

export function isDnsWorking(config: RouterConfig): boolean {
  const { primary, secondary } = getEffectiveDns(config);
  return isDnsServerReachable(primary, config) || isDnsServerReachable(secondary, config);
}

export interface DhcpPoolInfo {
  valid: boolean;
  start: number;
  end: number;
  size: number;
  error?: string;
}

export function getDhcpPool(config: RouterConfig): DhcpPoolInfo {
  const { dhcpPoolStart, dhcpPoolEnd, lanIp, lanSubnetMask } = config;
  if (!isValidIPv4(dhcpPoolStart) || !isValidIPv4(dhcpPoolEnd)) {
    return { valid: false, start: 0, end: 0, size: 0, error: 'El rango del pool DHCP no es una IPv4 válida' };
  }
  const start = ipToInt(dhcpPoolStart);
  const end = ipToInt(dhcpPoolEnd);
  if (start > end) {
    return { valid: false, start, end, size: 0, error: 'La IP inicial del pool es mayor que la IP final' };
  }
  if (!sameSubnet(dhcpPoolStart, lanIp, lanSubnetMask) || !sameSubnet(dhcpPoolEnd, lanIp, lanSubnetMask)) {
    return { valid: false, start, end, size: 0, error: 'El pool DHCP está fuera de la subred LAN del router' };
  }
  return { valid: true, start, end, size: end - start + 1 };
}

const KNOWN_DOMAINS: Record<string, string> = {
  'google.com': '142.250.200.14',
  'www.google.com': '142.250.200.4',
  'wikipedia.org': '185.15.58.224',
  'es.wikipedia.org': '185.15.58.224',
  'youtube.com': '142.250.184.174',
  'cloudflare.com': '104.16.132.229',
  'one.one.one.one': '1.1.1.1',
  'dns.google': '8.8.8.8',
  'github.com': '140.82.121.4',
  'example.com': '93.184.215.14',
  'tiktok.com': '23.40.100.214',
  'roblox.com': '128.116.115.3',
  'bet365.com': '5.226.180.10',
  'netflix.com': '54.155.178.5',
  'unfantasmaenelsistema.com': '188.114.97.3',
  'www.unfantasmaenelsistema.com': '188.114.96.3'
};

/** Resolución simulada: tabla de dominios conocidos y, si no está, una IP pública estable derivada del nombre. */
export function simulatedResolve(domain: string): string {
  const d = domain.toLowerCase().replace(/^https?:\/\//, '').split(/[/:]/)[0];
  if (KNOWN_DOMAINS[d]) return KNOWN_DOMAINS[d];
  let hash = 2166136261;
  for (const ch of d) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  // Rango 34.x – 99.x: espacio público "neutro" para el simulador
  return `${34 + (hash % 66)}.${(hash >>> 8) & 255}.${(hash >>> 16) & 255}.${((hash >>> 24) % 253) + 1}`;
}

export function extractHost(target: string): string {
  return target.toLowerCase().replace(/^https?:\/\//, '').split(/[/:?#]/)[0];
}

export function isDomainBlockedByParental(host: string, config: RouterConfig): boolean {
  if (!config.parentalControlEnabled) return false;
  const h = extractHost(host);
  return config.blockedDomains.some(d => d.enabled && (h === d.domain || h.endsWith('.' + d.domain)));
}
