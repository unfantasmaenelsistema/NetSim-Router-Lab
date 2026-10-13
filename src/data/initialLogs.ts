import { SystemLogEntry } from '../types/router';

export const INITIAL_SYSTEM_LOGS: SystemLogEntry[] = [
  {
    id: 'log-boot-1',
    timestamp: Date.now() - 1000 * 60 * 15,
    level: 'info',
    source: 'Kernel / Sistema',
    message: 'Sistema operativo RouterOS NetSim v3.0.4 cargado con éxito en memoria.',
    technicalDetails: 'Kernel Linux 6.1.42-netcore. Arquitectura ARMv8 4-cores. RAM: 512MB DDR4.',
    didacticExplanation: 'El router es en realidad un pequeño ordenador dedicado. Al encenderse, carga el kernel del sistema y monta los controladores de red.'
  },
  {
    id: 'log-boot-2',
    timestamp: Date.now() - 1000 * 60 * 14,
    level: 'info',
    source: 'Firewall SPI',
    message: 'Módulo iptables / nftables y conntrack cargado. Firewall SPI activo.',
    technicalDetails: 'Tabla conntrack configurada con max_entries=16384. Políticas por defecto: INPUT DROP, FORWARD DROP.',
    didacticExplanation: 'El firewall SPI inicializa la tabla de estados para recordar qué conexiones fueron solicitadas desde dentro de casa.'
  },
  {
    id: 'log-wifi-1',
    timestamp: Date.now() - 1000 * 60 * 12,
    level: 'info',
    source: 'Wi-Fi AP',
    message: 'Punto de acceso inalámbrico wlan0 (2.4 GHz) activado en Canal 6.',
    technicalDetails: 'hostapd: SSID "MiFibra_Hogar_2.4G", ancho 20 MHz, cifrado WPA2-PSK (AES-CCMP).',
    didacticExplanation: 'El demonio hostapd comienza a emitir las tramas Beacon que anuncian la red Wi-Fi a los móviles y televisores.'
  },
  {
    id: 'log-wifi-2',
    timestamp: Date.now() - 1000 * 60 * 11,
    level: 'info',
    source: 'Wi-Fi AP',
    message: 'Punto de acceso inalámbrico wlan1 (5 GHz) activado en Canal 36.',
    technicalDetails: 'hostapd: SSID "MiFibra_Hogar_5G", ancho 80 MHz, protocolo WPA3-SAE.',
    didacticExplanation: 'La banda de 5GHz ofrece mayor ancho de banda y menor congestión gracias a los canales de 80 MHz.'
  },
  {
    id: 'log-dhcp-1',
    timestamp: Date.now() - 1000 * 60 * 9,
    level: 'network',
    source: 'DHCP Server',
    message: 'Reserva estática asignada a PC Gamer: 192.168.1.50 para MAC 00:1A:2B:3C:4D:5E.',
    technicalDetails: 'dnsmasq: DHCPACK(br-lan) 192.168.1.50 00:1a:2b:3c:4d:5e PC-Gamer-Torre',
    didacticExplanation: 'El servidor DHCP reconoce la MAC del PC y le entrega una IP predeterminada para que las reglas de reenvío sigan operativas.'
  },
  {
    id: 'log-dhcp-2',
    timestamp: Date.now() - 1000 * 60 * 7,
    level: 'network',
    source: 'DHCP Server',
    message: 'Concesión IP automática entregada a Smart TV: 192.168.1.101 (Válida 24 horas).',
    technicalDetails: 'dnsmasq: DHCPREQUEST recibido -> DHCPOFFER enviado -> DHCPACK completado.',
    didacticExplanation: 'El proceso DORA (Discover, Offer, Request, Acknowledge) entrega configuración IP automática en milisegundos.'
  },
  {
    id: 'log-firewall-1',
    timestamp: Date.now() - 1000 * 60 * 3,
    level: 'security',
    source: 'Firewall SPI',
    message: 'Intento de sondeo no solicitado bloqueado desde Internet (194.26.29.112:4444 -> WAN:445).',
    technicalDetails: 'DROP IN=eth0 OUT= MAC=00:90:a9:7b:44:01 SRC=194.26.29.112 DST=185.220.101.42 PROTO=TCP DPT=445 FLAGS=SYN',
    didacticExplanation: 'Un bot en Internet intentó escanear el puerto SMB 445 en busca de vulnerabilidades. El firewall SPI descartó el paquete silenciosamente.'
  }
];
