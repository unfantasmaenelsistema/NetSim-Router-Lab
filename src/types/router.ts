export type SecurityMode = 'none' | 'wep' | 'wpa2' | 'wpa3' | 'wpa2_wpa3';
export type ConnectionType = 'ethernet_lan1' | 'ethernet_lan2' | 'ethernet_lan3' | 'ethernet_lan4' | 'wifi_24g' | 'wifi_5g' | 'wifi_guest' | 'disconnected';
export type DeviceType = 'pc_gamer' | 'smart_tv' | 'smartphone' | 'iot_camera' | 'laptop_work' | 'console' | 'attacker' | 'custom';
export type DeviceActivity = 'idle' | 'gaming' | 'streaming_4k' | 'p2p_torrent' | 'video_call' | 'web_browsing' | 'iot_surveillance' | 'ddos_attack' | 'port_scanning';

export interface StaticLease {
  id: string;
  mac: string;
  ip: string;
  hostname: string;
}

export interface PortForwardRule {
  id: string;
  serviceName: string;
  externalPort: number;
  internalIp: string;
  internalPort: number;
  protocol: 'TCP' | 'UDP' | 'BOTH';
  enabled: boolean;
}

export interface BlockedDomain {
  id: string;
  domain: string;
  category: 'social' | 'adult' | 'gaming' | 'custom';
  enabled: boolean;
}

export interface RouterConfig {
  // System
  modelName: string;
  firmwareVersion: string;
  adminPasswordChanged: boolean;
  remoteManagementEnabled: boolean;
  remoteManagementPort: number;

  // WAN (Internet)
  wanIp: string;
  wanGateway: string;
  wanConnectionType: 'DHCP' | 'PPPoE' | 'Static';
  wanMtu: number;
  wanDnsMode: 'ISP' | 'Custom';
  wanPrimaryDns: string;
  wanSecondaryDns: string;
  wanPingRespond: boolean; // Stealth mode if false

  // LAN & DHCP
  lanIp: string;
  lanSubnetMask: string;
  dhcpEnabled: boolean;
  dhcpPoolStart: string;
  dhcpPoolEnd: string;
  dhcpLeaseTimeHours: number;
  staticLeases: StaticLease[];

  // Wi-Fi 2.4 GHz
  wifi24Enabled: boolean;
  wifi24Ssid: string;
  wifi24Hidden: boolean;
  wifi24Security: SecurityMode;
  wifi24Password: string;
  wifi24Channel: number; // 1, 6, 11
  wifi24ChannelWidth: 20 | 40; // MHz
  wifi24TxPower: number; // 25, 50, 100%

  // Wi-Fi 5 GHz
  wifi5Enabled: boolean;
  wifi5Ssid: string;
  wifi5Hidden: boolean;
  wifi5Security: SecurityMode;
  wifi5Password: string;
  wifi5Channel: number; // 36, 40, 44, 48, 149
  wifi5ChannelWidth: 20 | 40 | 80 | 160;
  wifi5TxPower: number;

  // Guest Network
  guestWifiEnabled: boolean;
  guestWifiSsid: string;
  guestWifiPassword: string;
  guestIsolation: boolean; // AP isolation (cannot reach LAN or other guests)
  guestBandwidthLimitMbps: number;

  // WPS
  wpsEnabled: boolean;
  wpsMode: 'push_button' | 'pin';
  wpsPin: string;

  // Security & Firewall
  firewallSpiEnabled: boolean;
  dosProtectionEnabled: boolean;
  macFilteringMode: 'disabled' | 'whitelist' | 'blacklist';
  macFilterList: string[]; // MAC addresses
  parentalControlEnabled: boolean;
  blockedDomains: BlockedDomain[];
  dmzEnabled: boolean;
  dmzHostIp: string;
  upnpEnabled: boolean;

  // Port Forwarding
  portForwardRules: PortForwardRule[];

  // QoS
  qosEnabled: boolean;
  qosTotalDownlinkMbps: number;
  qosTotalUplinkMbps: number;
  qosDevicePriorities: Record<string, 'highest' | 'high' | 'normal' | 'low'>;
  bufferbloatMitigation: boolean;
}

export interface VirtualDevice {
  id: string;
  name: string;
  type: DeviceType;
  connectionType: ConnectionType;
  mac: string;
  ip: string;
  isOnline: boolean;
  currentActivity: DeviceActivity;
  demandDownloadMbps: number;
  demandUploadMbps: number;
  currentDownloadMbps: number;
  currentUploadMbps: number;
  currentLatencyMs: number;
  packetLossPercent: number;
  isBlockedByMac: boolean;
  isBlockedByParental: boolean;
  isolationRestricted: boolean;
  statusLog: string;
}

export interface NetworkTelemetry {
  timestamp: number;
  totalDownloadMbps: number;
  totalUploadMbps: number;
  averageLatencyMs: number;
  maxLatencyMs: number;
  packetLossPercent: number;
  routerCpuPercent: number;
  routerRamPercent: number;
  activeSessionsCount: number;
  wifiInterference24: number; // 0-100%
  wifiInterference5: number;  // 0-100%
}

export interface EducationalTopic {
  id: string;
  title: string;
  subtitle: string;
  category: 'wifi' | 'lan' | 'security' | 'nat' | 'qos' | 'system';
  whatIsIt: string;
  whenEnabled: string;
  whenDisabled: string;
  performanceImpact: string;
  securityImpact: string;
  securityLevel: 'safe' | 'caution' | 'danger';
  recommendedSetting: string;
  realWorldExample: string;
}

export interface Mission {
  id: string;
  title: string;
  difficulty: 'Fácil' | 'Intermedio' | 'Avanzado';
  description: string;
  objective: string;
  problemScenario: string;
  steps: string[];
  hint: string;
  isCompleted: (config: RouterConfig, devices: VirtualDevice[], telemetry: NetworkTelemetry) => boolean;
  solutionSummary: string;
}

export interface SystemLogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'security' | 'config' | 'network';
  source: 'Firewall SPI' | 'DHCP Server' | 'Wi-Fi AP' | 'QoS Engine' | 'NAT / Port Forward' | 'Kernel / Sistema' | 'Control Parental';
  message: string;
  technicalDetails?: string;
  didacticExplanation?: string;
}
