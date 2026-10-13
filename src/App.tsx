import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { RouterConfig, VirtualDevice, NetworkTelemetry, SystemLogEntry } from './types/router';
import { INITIAL_ROUTER_CONFIG } from './data/defaultRouterConfig';
import { INITIAL_VIRTUAL_DEVICES } from './data/defaultDevices';
import { INITIAL_SYSTEM_LOGS } from './data/initialLogs';
import { MISSIONS } from './data/missions';
import { runSimulationTick, SecurityAuditReport } from './simulation/networkEngine';

// Components
import { Header, ActiveTab } from './components/Header';
import { EducationalModal } from './components/EducationalModal';
import { ActivityLogDrawer } from './components/ActivityLogDrawer';
import { AuditReportModal } from './components/AuditReportModal';
import { TroubleshootingLab, TroubleshootingStatus } from './components/TroubleshootingLab';
import { DashboardTab } from './components/tabs/DashboardTab';
import { useTheme } from './hooks/useTheme';
import { ErrorBoundary } from './components/ErrorBoundary';

// Las pestañas secundarias se cargan bajo demanda para aligerar la carga inicial
const NetworkCliTerminal = lazy(() => import('./components/NetworkCliTerminal').then(m => ({ default: m.NetworkCliTerminal })));
const PacketSnifferView = lazy(() => import('./components/PacketSnifferView').then(m => ({ default: m.PacketSnifferView })));
const WirelessTab = lazy(() => import('./components/tabs/WirelessTab').then(m => ({ default: m.WirelessTab })));
const NetworkLanTab = lazy(() => import('./components/tabs/NetworkLanTab').then(m => ({ default: m.NetworkLanTab })));
const SecurityFirewallTab = lazy(() => import('./components/tabs/SecurityFirewallTab').then(m => ({ default: m.SecurityFirewallTab })));
const PortForwardingTab = lazy(() => import('./components/tabs/PortForwardingTab').then(m => ({ default: m.PortForwardingTab })));
const QosTab = lazy(() => import('./components/tabs/QosTab').then(m => ({ default: m.QosTab })));
const VirtualDevicesTab = lazy(() => import('./components/tabs/VirtualDevicesTab').then(m => ({ default: m.VirtualDevicesTab })));
const SecurityLabTab = lazy(() => import('./components/tabs/SecurityLabTab').then(m => ({ default: m.SecurityLabTab })));
const MissionsTab = lazy(() => import('./components/tabs/MissionsTab').then(m => ({ default: m.MissionsTab })));
const GlossaryTab = lazy(() => import('./components/tabs/GlossaryTab').then(m => ({ default: m.GlossaryTab })));

function hostapdSecurityLine(mode: RouterConfig['wifi24Security']): string {
  switch (mode) {
    case 'none':
      return 'hostapd: auth_algs=1, wpa=0 (red ABIERTA, sin cifrado)';
    case 'wep':
      return 'hostapd: auth_algs=3, wep_default_key=0 (WEP-RC4, obsoleto)';
    case 'wpa2':
      return 'hostapd: wpa=2, wpa_key_mgmt=WPA-PSK, rsn_pairwise=CCMP';
    case 'wpa3':
      return 'hostapd: wpa=2, wpa_key_mgmt=SAE, ieee80211w=2 (MFP obligatorio), rsn_pairwise=CCMP';
    case 'wpa2_wpa3':
      return 'hostapd: wpa=2, wpa_key_mgmt=WPA-PSK SAE, ieee80211w=1 (modo de transición), rsn_pairwise=CCMP';
  }
}

export default function App() {
  // Theme state (claro / oscuro / sistema) with localStorage persistence
  const { themeMode, setThemeMode, resolvedTheme } = useTheme();

  // Primary router and network state
  const [config, setConfig] = useState<RouterConfig>(INITIAL_ROUTER_CONFIG);
  const [devices, setDevices] = useState<VirtualDevice[]>(INITIAL_VIRTUAL_DEVICES);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [educationalMode, setEducationalMode] = useState<boolean>(true);
  const [activeEducationalTopic, setActiveEducationalTopic] = useState<string | null>(null);

  // Simulation controls
  const [isExternalDosAttackActive, setIsExternalDosAttackActive] = useState<boolean>(false);
  const [isRebooting, setIsRebooting] = useState<boolean>(false);

  // Initial simulation telemetry baseline
  const initialTick = runSimulationTick(INITIAL_ROUTER_CONFIG, INITIAL_VIRTUAL_DEVICES, false);
  const [currentTelemetry, setCurrentTelemetry] = useState<NetworkTelemetry>(initialTick.telemetry);
  const [telemetryHistory, setTelemetryHistory] = useState<NetworkTelemetry[]>([initialTick.telemetry]);
  const [securityAudit, setSecurityAudit] = useState<SecurityAuditReport>(initialTick.securityAudit);

  // Activity Log State
  const [logs, setLogs] = useState<SystemLogEntry[]>(INITIAL_SYSTEM_LOGS);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState<boolean>(false);
  // Número de entradas que el usuario ya ha visto (las nuevas se añaden al principio)
  const [seenLogsCount, setSeenLogsCount] = useState<number>(0);
  const unreadLogsCount = isActivityLogOpen ? 0 : Math.max(0, logs.length - seenLogsCount);

  // Progreso del Taller de Averías (se conserva al cambiar de pestaña)
  const [troubleshootingStatus, setTroubleshootingStatus] = useState<TroubleshootingStatus>({});

  // Executive Security Audit Report Modal
  const [isAuditReportOpen, setIsAuditReportOpen] = useState<boolean>(false);

  const addSystemLog = (entry: Omit<SystemLogEntry, 'id' | 'timestamp'>) => {
    const newLog: SystemLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      ...entry
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Keep ref for fresh state in timer
  const stateRef = useRef({ config, devices, isExternalDosAttackActive, isRebooting });
  useEffect(() => {
    stateRef.current = { config, devices, isExternalDosAttackActive, isRebooting };
  }, [config, devices, isExternalDosAttackActive, isRebooting]);

  // Simulation Tick Loop (Every 800ms)
  useEffect(() => {
    const timer = setInterval(() => {
      const { config: curConfig, devices: curDevices, isExternalDosAttackActive: curDos, isRebooting: curReboot } = stateRef.current;

      if (curReboot) {
        // While rebooting, simulate zero throughput
        const rebootTelemetry: NetworkTelemetry = {
          timestamp: Date.now(),
          totalDownloadMbps: 0,
          totalUploadMbps: 0,
          averageLatencyMs: 999,
          maxLatencyMs: 999,
          packetLossPercent: 100,
          routerCpuPercent: 85,
          routerRamPercent: 40,
          activeSessionsCount: 0,
          wifiInterference24: 0,
          wifiInterference5: 0
        };
        setCurrentTelemetry(rebootTelemetry);
        setTelemetryHistory(prev => [...prev.slice(-30), rebootTelemetry]);
        return;
      }

      const result = runSimulationTick(curConfig, curDevices, curDos);
      // Solo se sustituyen los equipos que no han cambiado desde que se tomó la instantánea:
      // así una edición del usuario hecha durante el tick no se pierde (se simula en el siguiente).
      const snapshot = new Map(curDevices.map((d, i) => [d.id, { before: d, after: result.updatedDevices[i] }]));
      setDevices(prev => prev.map(d => {
        const entry = snapshot.get(d.id);
        return entry && entry.before === d ? entry.after : d;
      }));
      setCurrentTelemetry(result.telemetry);
      setSecurityAudit(result.securityAudit);
      setTelemetryHistory(prev => [...prev.slice(-30), result.telemetry]);
    }, 800);

    return () => clearInterval(timer);
  }, []);

  // Handlers with Didactic System Logging
  const handleUpdateConfig = (newConfig: Partial<RouterConfig>) => {
    // Record relevant configuration events in the log
    if (newConfig.firewallSpiEnabled !== undefined && newConfig.firewallSpiEnabled !== config.firewallSpiEnabled) {
      addSystemLog({
        level: newConfig.firewallSpiEnabled ? 'security' : 'warning',
        source: 'Firewall SPI',
        message: `Firewall SPI ${newConfig.firewallSpiEnabled ? 'HABILITADO' : 'DESHABILITADO'}.`,
        technicalDetails: `Reglas de filtrado de estado conntrack actualizadas (POLICIES: ${newConfig.firewallSpiEnabled ? 'DROP ESTABLISHED/RELATED' : 'ACCEPT ALL'}).`,
        didacticExplanation: newConfig.firewallSpiEnabled
          ? 'El firewall ahora inspecciona y descarta paquetes no solicitados desde Internet.'
          : '¡PELIGRO!: Sin SPI, los dispositivos locales quedan desprotegidos contra sondeos de intrusión.'
      });
    }

    if (newConfig.dosProtectionEnabled !== undefined && newConfig.dosProtectionEnabled !== config.dosProtectionEnabled) {
      addSystemLog({
        level: newConfig.dosProtectionEnabled ? 'security' : 'warning',
        source: 'Firewall SPI',
        message: `Protección contra Ataques DoS / SYN Flood ${newConfig.dosProtectionEnabled ? 'ACTIVADA' : 'DESACTIVADA'}.`,
        technicalDetails: `hashlimit-mode srcip, hashlimit-srcmask 32, hashlimit-upto 300/sec, burst 50.`,
        didacticExplanation: newConfig.dosProtectionEnabled
          ? 'El router descarta ráfagas anómalas antes de que saturen la CPU.'
          : 'El router procesará todos los paquetes SYN recibidos, corriendo riesgo de saturación.'
      });
    }

    if (newConfig.wifi24Security !== undefined && newConfig.wifi24Security !== config.wifi24Security) {
      addSystemLog({
        level: 'config',
        source: 'Wi-Fi AP',
        message: `Modo de cifrado 2.4 GHz cambiado a: ${newConfig.wifi24Security.toUpperCase()}`,
        technicalDetails: hostapdSecurityLine(newConfig.wifi24Security),
        didacticExplanation: 'Actualiza los algoritmos criptográficos con los que los dispositivos negocian la clave de red.'
      });
    }

    if (newConfig.wifi5Security !== undefined && newConfig.wifi5Security !== config.wifi5Security) {
      addSystemLog({
        level: 'config',
        source: 'Wi-Fi AP',
        message: `Modo de cifrado 5 GHz cambiado a: ${newConfig.wifi5Security.toUpperCase()}`,
        technicalDetails: hostapdSecurityLine(newConfig.wifi5Security),
        didacticExplanation: newConfig.wifi5Security === 'wpa3' || newConfig.wifi5Security === 'wpa2_wpa3'
          ? 'WPA3 implementa SAE, impidiendo ataques de fuerza bruta offline contra las tramas de autenticación.'
          : 'Actualiza los algoritmos criptográficos con los que los dispositivos negocian la clave de red.'
      });
    }

    if (newConfig.wpsEnabled !== undefined && newConfig.wpsEnabled !== config.wpsEnabled) {
      addSystemLog({
        level: newConfig.wpsEnabled ? 'warning' : 'security',
        source: 'Wi-Fi AP',
        message: `WPS ${newConfig.wpsEnabled ? 'HABILITADO' : 'DESHABILITADO permanentemente'}.`,
        technicalDetails: `wps_state=${newConfig.wpsEnabled ? '2' : '0'}`,
        didacticExplanation: newConfig.wpsEnabled
          ? 'Tener WPS activo (especialmente con PIN) expone la clave a ataques Pixie Dust.'
          : 'Desactivar WPS es una de las recomendaciones esenciales de seguridad para routers domésticos.'
      });
    }

    if (newConfig.qosEnabled !== undefined && newConfig.qosEnabled !== config.qosEnabled) {
      addSystemLog({
        level: 'config',
        source: 'QoS Engine',
        message: `Motor de Calidad de Servicio (QoS) ${newConfig.qosEnabled ? 'ACTIVADO' : 'DESACTIVADO'}.`,
        technicalDetails: `tc qdisc add dev wan0 root cake bandwidth ${newConfig.qosTotalDownlinkMbps || config.qosTotalDownlinkMbps}mbit`,
        didacticExplanation: newConfig.qosEnabled
          ? 'Las colas de prioridad garantizan que los juegos y llamadas no sufran lag durante descargas masivas.'
          : 'Los paquetes volverán a procesarse por orden de llegada (FIFO), propenso a Bufferbloat.'
      });
    }

    if (newConfig.dmzEnabled !== undefined && newConfig.dmzEnabled !== config.dmzEnabled) {
      addSystemLog({
        level: newConfig.dmzEnabled ? 'warning' : 'security',
        source: 'NAT / Port Forward',
        message: `Zona Desmilitarizada (DMZ) ${newConfig.dmzEnabled ? `ACTIVADA hacia ${newConfig.dmzHostIp}` : 'DESACTIVADA'}.`,
        technicalDetails: `iptables -t nat -A PREROUTING -i wan0 -j DNAT --to-destination ${newConfig.dmzHostIp || config.dmzHostIp}`,
        didacticExplanation: newConfig.dmzEnabled
          ? 'PELIGRO: El equipo DMZ recibe todo el tráfico externo no solicitado sin protección del cortafuegos.'
          : 'DMZ desactivada: los equipos locales vuelven a estar protegidos tras el firewall NAT.'
      });
    }

    if (newConfig.guestIsolation !== undefined && newConfig.guestIsolation !== config.guestIsolation) {
      addSystemLog({
        level: 'config',
        source: 'Wi-Fi AP',
        message: `Aislamiento de Red de Invitados (AP Isolation): ${newConfig.guestIsolation ? 'ACTIVADO' : 'DESACTIVADO'}`,
        technicalDetails: `ebtables -A FORWARD -i wlan_guest -o br-lan -j ${newConfig.guestIsolation ? 'DROP' : 'ACCEPT'}`,
        didacticExplanation: newConfig.guestIsolation
          ? 'Los invitados solo tienen salida hacia Internet y no pueden comunicarse con equipos privados ni entre sí.'
          : 'Riesgo: los invitados pueden escanear la red local de la vivienda.'
      });
    }

    setConfig(prev => ({ ...prev, ...newConfig }));
    showToast('Parámetros guardados y aplicados al firmware del router');
  };

  const handleUpdateDevice = (id: string, updates: Partial<VirtualDevice>) => {
    const existing = devices.find(d => d.id === id);

    if (updates.connectionType && existing && updates.connectionType !== existing.connectionType) {
      addSystemLog({
        level: updates.connectionType === 'disconnected' ? 'info' : 'network',
        source: updates.connectionType.startsWith('ethernet') ? 'Kernel / Sistema' : 'Wi-Fi AP',
        message: updates.connectionType === 'disconnected'
          ? `Dispositivo "${existing.name}" desconectado de la red.`
          : `Dispositivo "${existing.name}" (${existing.mac}) conectado a ${updates.connectionType.replace('_', ' ').toUpperCase()}.`,
        technicalDetails: `Asignación IP: ${existing.ip}. Enlace físico/radio establecido a 1000 Mbps / MCS 11.`,
        didacticExplanation: 'El router detecta la conexión en la capa de enlace y le proporciona acceso según las reglas de firewall.'
      });
    }

    if (updates.currentActivity && existing && updates.currentActivity !== existing.currentActivity) {
      if (updates.currentActivity === 'p2p_torrent') {
        addSystemLog({
          level: 'warning',
          source: 'QoS Engine',
          message: `Alta demanda de ancho de banda: "${existing.name}" inició descarga masiva Torrent / Steam (180 Mbps).`,
          technicalDetails: `Tráfico TCP/UDP multiconexión detectado. Consumo: ~180 Mbps. Colas de bufferbloat puestas a prueba.`,
          didacticExplanation: 'Una descarga masiva satura el ancho de banda contratado. Si QoS está apagado, provocará lag en el resto de equipos.'
        });
      } else if (updates.currentActivity === 'ddos_attack') {
        addSystemLog({
          level: 'security',
          source: 'Firewall SPI',
          message: `¡ALERTA DE SEGURIDAD!: Inundación de paquetes anómalos detectada desde host interno "${existing.name}" (${existing.ip})!`,
          technicalDetails: `SYN/UDP Flood interno. Tasa de paquetes salientes: >80 Mbps. Posible equipo infectado en la red.`,
          didacticExplanation: 'Un dispositivo comprometido (botnet o malware) puede lanzar ataques desde tu propia red hacia Internet o el router.'
        });
      }
    }

    setDevices(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
  };

  const handleAddDevice = (newDevice: VirtualDevice) => {
    setDevices(prev => [...prev, newDevice]);
    addSystemLog({
      level: 'network',
      source: 'DHCP Server',
      message: `Nuevo dispositivo añadido al laboratorio: "${newDevice.name}" (${newDevice.mac}) solicitando dirección IP por DHCP.`,
      technicalDetails: `dnsmasq: DHCPDISCOVER from ${newDevice.mac} -> DHCPOFFER -> DHCPREQUEST -> DHCPACK.`,
      didacticExplanation: 'El servidor DHCP le asigna la primera IP libre del pool y el router añade la entrada en la tabla ARP (IP <-> MAC).'
    });
    showToast(`Dispositivo "${newDevice.name}" conectado a la red`);
  };

  const handleDeleteDevice = (id: string) => {
    const dev = devices.find(d => d.id === id);
    if (dev) {
      addSystemLog({
        level: 'info',
        source: 'Kernel / Sistema',
        message: `Dispositivo "${dev.name}" (${dev.mac}) retirado del laboratorio.`,
        technicalDetails: `Entrada de tabla ARP y lease DHCP purgados.`
      });
    }
    setDevices(prev => prev.filter(d => d.id !== id));
    showToast('Dispositivo retirado del laboratorio');
  };

  const handleReboot = () => {
    setIsRebooting(true);
    addSystemLog({
      level: 'warning',
      source: 'Kernel / Sistema',
      message: 'Comando de reinicio ejecutado. Apagando interfaces de red y demonios...',
      technicalDetails: 'shutdown -r now. Enviando señales SIGTERM y SIGKILL a hostapd, dnsmasq e iptables.',
      didacticExplanation: 'Al reiniciar el router, todas las conexiones activas se pierden momentáneamente y se limpian las tablas en memoria RAM.'
    });
    showToast('Reiniciando el router... Las interfaces se están reiniciando.');

    setTimeout(() => {
      setIsRebooting(false);
      addSystemLog({
        level: 'info',
        source: 'Kernel / Sistema',
        message: '¡Reinicio completado! Todos los servicios, radio Wi-Fi y firewall están operativos.',
        technicalDetails: 'Uptime restablecido a 0s. IP WAN 185.220.101.42 adquirida por DHCP.',
        didacticExplanation: 'El router vuelve a su estado operacional normal con la memoria limpia.'
      });
      showToast('¡Router reiniciado con éxito! Todos los servicios en línea.');
    }, 2800);
  };

  const handleFactoryReset = () => {
    if (window.confirm('¿Deseas restablecer todos los parámetros del router a los valores de fábrica?')) {
      setConfig(INITIAL_ROUTER_CONFIG);
      setDevices(INITIAL_VIRTUAL_DEVICES);
      setIsExternalDosAttackActive(false);
      setTroubleshootingStatus({});
      addSystemLog({
        level: 'warning',
        source: 'Kernel / Sistema',
        message: 'Restablecimiento de fábrica ejecutado. Configuración NVRAM devuelta a valores predeterminados.',
        technicalDetails: 'mtd erase nvram && reboot. Claves WPA y reglas NAT restablecidas.',
        didacticExplanation: 'El reset de fábrica elimina todas las contraseñas y reglas configuradas por el usuario.'
      });
      showToast('Router restablecido a los valores predeterminados de fábrica.');
    }
  };

  // Toggle DoS with Log Entry
  const handleToggleExternalDos = (active: boolean) => {
    setIsExternalDosAttackActive(active);
    if (active) {
      addSystemLog({
        level: 'security',
        source: 'Firewall SPI',
        message: `¡ATAQUE EN CURSO!: Inundación masiva DoS SYN Flood entrante desde botnet externa hacia IP pública ${config.wanIp}!`,
        technicalDetails: `Tasa: ~60.000 paquetes SYN falsos por segundo. Protección DoS en router: ${config.dosProtectionEnabled ? 'ACTIVA (Filtrando)' : 'INACTIVA (Saturando CPU)'}.`,
        didacticExplanation: config.dosProtectionEnabled
          ? 'El firewall descarta los paquetes maliciosos en la cola de red antes de que desborden los buffers del procesador.'
          : '¡Alerta!: La protección DoS está apagada. La CPU del router llegará al 95%+ y todos los clientes sufrirán lag extremo o desconexión.'
      });
    } else {
      addSystemLog({
        level: 'info',
        source: 'Firewall SPI',
        message: 'El flujo de ataque DoS externo ha finalizado. Conexión WAN normalizada.',
        technicalDetails: 'Tasa de paquetes por segundo devuelta a niveles normales (~50 pps).'
      });
    }
  };

  // Simulate didactic log events on demand
  const handleSimulateEvent = (type: 'attack' | 'dhcp' | 'parental' | 'qos') => {
    switch (type) {
      case 'attack':
        addSystemLog({
          level: 'security',
          source: 'Firewall SPI',
          message: 'Intento de sondeo malicioso bloqueado en puerto 3389 (RDP) desde IP externa 185.191.171.43.',
          technicalDetails: 'DROP IN=wan0 PROTO=TCP SPT=54211 DPT=3389 FLAGS=SYN (Sondeo automatizado de Shodan descartado por SPI).',
          didacticExplanation: 'Robots en Internet rastrean continuamente puertos de Escritorio Remoto para lanzar ataques de fuerza bruta de contraseñas. El firewall SPI bloquea el paquete porque no fue solicitado.'
        });
        showToast('Evento simulado: Intento de intrusión bloqueado por el Firewall');
        break;
      case 'dhcp':
        addSystemLog({
          level: 'network',
          source: 'DHCP Server',
          message: 'Solicitud DHCP Discover recibida desde nuevo cliente (MAC: F0:18:98:C1:22:90). Oferta IP: 192.168.1.115.',
          technicalDetails: 'DORA completado: DHCPDISCOVER -> DHCPOFFER(192.168.1.115) -> DHCPREQUEST -> DHCPACK(24h lease).',
          didacticExplanation: 'Ciclo completo de autoconfiguración IP: el nuevo móvil recibe su dirección IP, puerta de enlace y DNS en 12 milisegundos.'
        });
        showToast('Evento simulado: Negociación DHCP DORA completada');
        break;
      case 'parental':
        addSystemLog({
          level: 'warning',
          source: 'Control Parental',
          message: 'Consulta DNS interceptada y bloqueada: Intento de acceso a "tiktok.com" desde Smartphone Móvil.',
          technicalDetails: 'dnsmasq-filter: NXDOMAIN devuelto para dominio restringido tiktok.com (Categoría: Redes Sociales).',
          didacticExplanation: 'El control parental responde a la consulta DNS diciendo que el dominio no existe o redirigiéndolo a una página de aviso local.'
        });
        showToast('Evento simulado: Consulta bloqueada por Control Parental');
        break;
      case 'qos':
        addSystemLog({
          level: 'network',
          source: 'QoS Engine',
          message: 'Clasificación de prioridad QoS: Paquetes UDP del puerto 27015 (Juego Valorant / CS2) enviados a cola de baja latencia.',
          technicalDetails: 'DSCP CS5 / EF aplicado. Paquetes prioritarios adelantan en cola FQ-CoDel con delay garantizado < 15ms.',
          didacticExplanation: 'El motor de QoS reconoce el tráfico del juego y le da paso prioritario antes de las descargas en segundo plano.'
        });
        showToast('Evento simulado: Clasificación de paquetes por QoS');
        break;
    }
  };

  // Compute completed missions
  const completedMissionsCount = MISSIONS.filter(m => {
    try {
      return m.isCompleted(config, devices, currentTelemetry);
    } catch {
      return false;
    }
  }).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Educational Inspector Modal */}
      <EducationalModal
        topicId={activeEducationalTopic}
        onClose={() => setActiveEducationalTopic(null)}
      />

      {/* Printable/Exportable Executive Security Audit Report Modal */}
      <AuditReportModal
        isOpen={isAuditReportOpen}
        onClose={() => setIsAuditReportOpen(false)}
        config={config}
        devices={devices}
        securityAudit={securityAudit}
        completedMissionsCount={completedMissionsCount}
        totalMissionsCount={MISSIONS.length}
      />

      {/* Activity Log Side Panel Drawer */}
      <ActivityLogDrawer
        isOpen={isActivityLogOpen}
        onClose={() => {
          setIsActivityLogOpen(false);
          setSeenLogsCount(logs.length);
        }}
        logs={logs}
        onClearLogs={() => {
          setLogs([]);
          setSeenLogsCount(0);
          showToast('Log de actividad vaciado');
        }}
        onSimulateEvent={handleSimulateEvent}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-sky-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        securityAudit={securityAudit}
        educationalMode={educationalMode}
        setEducationalMode={setEducationalMode}
        completedMissionsCount={completedMissionsCount}
        totalMissionsCount={MISSIONS.length}
        onOpenActivityLog={() => setIsActivityLogOpen(true)}
        unreadLogsCount={unreadLogsCount}
        onOpenAuditReport={() => setIsAuditReportOpen(true)}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        resolvedTheme={resolvedTheme}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <ErrorBoundary key={activeTab}>
        <Suspense fallback={<div className="py-16 text-center text-xs text-slate-400 font-mono">Cargando módulo...</div>}>
        {activeTab === 'dashboard' && (
          <DashboardTab
            config={config}
            devices={devices}
            telemetry={currentTelemetry}
            telemetryHistory={telemetryHistory}
            securityAudit={securityAudit}
            onOpenTopic={setActiveEducationalTopic}
            onNavigateTab={setActiveTab}
            onReboot={handleReboot}
            onFactoryReset={handleFactoryReset}
            isRebooting={isRebooting}
            onOpenAuditReport={() => setIsAuditReportOpen(true)}
          />
        )}

        {activeTab === 'wireless' && (
          <WirelessTab
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onOpenTopic={setActiveEducationalTopic}
          />
        )}

        {activeTab === 'lan' && (
          <NetworkLanTab
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onOpenTopic={setActiveEducationalTopic}
          />
        )}

        {activeTab === 'security' && (
          <SecurityFirewallTab
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onOpenTopic={setActiveEducationalTopic}
          />
        )}

        {activeTab === 'portforward' && (
          <PortForwardingTab
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onOpenTopic={setActiveEducationalTopic}
          />
        )}

        {activeTab === 'qos' && (
          <QosTab
            config={config}
            devices={devices}
            onUpdateConfig={handleUpdateConfig}
            onOpenTopic={setActiveEducationalTopic}
          />
        )}

        {activeTab === 'devices' && (
          <VirtualDevicesTab
            devices={devices}
            onUpdateDevice={handleUpdateDevice}
            onAddDevice={handleAddDevice}
            onDeleteDevice={handleDeleteDevice}
            config={config}
          />
        )}

        {activeTab === 'cyberlab' && (
          <SecurityLabTab
            config={config}
            devices={devices}
            securityAudit={securityAudit}
            isExternalDosAttackActive={isExternalDosAttackActive}
            setIsExternalDosAttackActive={handleToggleExternalDos}
            onOpenTopic={setActiveEducationalTopic}
            onUpdateConfig={handleUpdateConfig}
            onOpenAuditReport={() => setIsAuditReportOpen(true)}
          />
        )}

        {activeTab === 'terminal' && (
          <NetworkCliTerminal
            config={config}
            devices={devices}
            telemetry={currentTelemetry}
            isRebooting={isRebooting}
            onReboot={handleReboot}
            onOpenTopic={setActiveEducationalTopic}
          />
        )}

        {activeTab === 'sniffer' && (
          <PacketSnifferView
            config={config}
            devices={devices}
            onOpenTopic={setActiveEducationalTopic}
          />
        )}

        {activeTab === 'troubleshooting' && (
          <TroubleshootingLab
            config={config}
            devices={devices}
            onUpdateConfig={handleUpdateConfig}
            onNavigateTab={setActiveTab}
            onOpenTopic={setActiveEducationalTopic}
            status={troubleshootingStatus}
            onStatusChange={setTroubleshootingStatus}
          />
        )}

        {activeTab === 'missions' && (
          <MissionsTab
            config={config}
            devices={devices}
            telemetry={currentTelemetry}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'glossary' && (
          <GlossaryTab />
        )}
        </Suspense>
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Creator Attribution Card */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl transition-all">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <a
                href="https://www.unfantasmaenelsistema.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 group"
                title="Visitar Un Fantasma en el Sistema"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-750 flex items-center justify-center p-1.5 shadow-inner group-hover:border-sky-500/60 transition-colors">
                  <img
                    src={`${import.meta.env.BASE_URL}icono.png`}
                    alt="Logo Un Fantasma en el Sistema"
                    className="w-full h-full object-contain aspect-square"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </a>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Un Fantasma en el Sistema
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                    Blog de Ciberseguridad & Redes
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                  Artículos técnicos, herramientas, hacking ético, análisis de tráfico y tutoriales de administración de sistemas.
                </p>
              </div>
            </div>

            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Visitar unfantasmaenelsistema.com</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          {/* Subfooter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">NetSim Router Lab</span>
              <span>·</span>
              <span>Simulador educativo de redes domésticas</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-400">
              <button
                type="button"
                onClick={() => setActiveTab('terminal')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terminal CLI
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sniffer')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Sniffer Paquetes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('troubleshooting')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Taller de Averías
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('missions')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Misiones ({completedMissionsCount}/{MISSIONS.length})
              </button>
              <button
                type="button"
                onClick={() => setIsAuditReportOpen(true)}
                className="hover:text-emerald-300 text-emerald-400/90 font-medium transition-colors cursor-pointer"
              >
                Informe Oficial PDF
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('glossary')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Glosario
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
