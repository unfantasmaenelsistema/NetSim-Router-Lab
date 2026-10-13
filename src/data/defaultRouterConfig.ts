import { RouterConfig } from '../types/router';

export const INITIAL_ROUTER_CONFIG: RouterConfig = {
  // System
  modelName: 'NetSim AX3000 Dual-Band Wi-Fi 6',
  firmwareVersion: 'v3.0.4-build2026',
  adminPasswordChanged: false,
  remoteManagementEnabled: false,
  remoteManagementPort: 8443,

  // WAN
  wanIp: '185.220.101.42',
  wanGateway: '185.220.100.1',
  wanConnectionType: 'DHCP',
  wanMtu: 1500,
  wanDnsMode: 'ISP',
  wanPrimaryDns: '80.58.61.250',
  wanSecondaryDns: '80.58.61.254',
  wanPingRespond: false,

  // LAN & DHCP
  lanIp: '192.168.1.1',
  lanSubnetMask: '255.255.255.0',
  dhcpEnabled: true,
  dhcpPoolStart: '192.168.1.100',
  dhcpPoolEnd: '192.168.1.200',
  dhcpLeaseTimeHours: 24,
  staticLeases: [
    {
      id: 'lease-1',
      hostname: 'PC-Gamer-Torre',
      mac: '00:1A:2B:3C:4D:5E',
      ip: '192.168.1.50'
    },
    {
      id: 'lease-2',
      hostname: 'Servidor-NAS',
      mac: 'E4:5F:01:22:98:AA',
      ip: '192.168.1.10'
    }
  ],

  // Wi-Fi 2.4 GHz
  wifi24Enabled: true,
  wifi24Ssid: 'MiFibra_Hogar_2.4G',
  wifi24Hidden: false,
  wifi24Security: 'wpa2',
  wifi24Password: 'WifiSegura2026!',
  wifi24Channel: 6,
  wifi24ChannelWidth: 20,
  wifi24TxPower: 100,

  // Wi-Fi 5 GHz
  wifi5Enabled: true,
  wifi5Ssid: 'MiFibra_Hogar_5G',
  wifi5Hidden: false,
  wifi5Security: 'wpa3',
  wifi5Password: 'WifiSegura2026!',
  wifi5Channel: 36,
  wifi5ChannelWidth: 80,
  wifi5TxPower: 100,

  // Guest Network
  guestWifiEnabled: false,
  guestWifiSsid: 'MiFibra_Invitados',
  guestWifiPassword: 'BienvenidoAmigo2026',
  guestIsolation: true,
  guestBandwidthLimitMbps: 15,

  // WPS
  wpsEnabled: true,
  wpsMode: 'pin',
  wpsPin: '38294615',

  // Security & Firewall
  firewallSpiEnabled: true,
  dosProtectionEnabled: false,
  macFilteringMode: 'disabled',
  macFilterList: [],
  parentalControlEnabled: false,
  blockedDomains: [
    { id: 'dom-1', domain: 'tiktok.com', category: 'social', enabled: true },
    { id: 'dom-2', domain: 'bet365.com', category: 'adult', enabled: true },
    { id: 'dom-3', domain: 'roblox.com', category: 'gaming', enabled: false }
  ],
  dmzEnabled: false,
  dmzHostIp: '192.168.1.50',
  upnpEnabled: true,

  // Port Forwarding
  portForwardRules: [
    {
      id: 'rule-minecraft',
      serviceName: 'Minecraft Server',
      externalPort: 25565,
      internalIp: '192.168.1.50',
      internalPort: 25565,
      protocol: 'TCP',
      enabled: false
    },
    {
      id: 'rule-web',
      serviceName: 'Servidor Web HTTP',
      externalPort: 80,
      internalIp: '192.168.1.10',
      internalPort: 80,
      protocol: 'TCP',
      enabled: false
    }
  ],

  // QoS
  qosEnabled: false,
  qosTotalDownlinkMbps: 300,
  qosTotalUplinkMbps: 100,
  qosDevicePriorities: {
    'dev-pc-gamer': 'highest',
    'dev-laptop-work': 'high',
    'dev-smart-tv': 'normal',
    'dev-smartphone': 'normal',
    'dev-iot-cam': 'low'
  },
  bufferbloatMitigation: true
};
