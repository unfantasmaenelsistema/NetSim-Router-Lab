import React from 'react';
import { RouterConfig, VirtualDevice, NetworkTelemetry } from '../../types/router';
import { SecurityAuditReport } from '../../simulation/networkEngine';
import { RouterHardwareView } from '../RouterHardwareView';
import { RealTimeMonitor } from '../RealTimeMonitor';
import { ActiveTab } from '../Header';
import { Globe, ArrowRight, ShieldCheck, Wifi, Server, Laptop, ChevronRight, Terminal, Layers, Wrench, FileCheck, Sparkles } from 'lucide-react';

interface Props {
  config: RouterConfig;
  devices: VirtualDevice[];
  telemetry: NetworkTelemetry;
  telemetryHistory: NetworkTelemetry[];
  securityAudit: SecurityAuditReport;
  onOpenTopic: (topicId: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onReboot: () => void;
  onFactoryReset: () => void;
  isRebooting: boolean;
  onOpenAuditReport?: () => void;
}

export const DashboardTab: React.FC<Props> = ({
  config,
  devices,
  telemetry,
  telemetryHistory,
  securityAudit,
  onOpenTopic,
  onNavigateTab,
  onReboot,
  onFactoryReset,
  isRebooting,
  onOpenAuditReport
}) => {
  const onlineDevices = devices.filter(d => d.isOnline);

  return (
    <div className="space-y-6">
      {/* Visual Hardware Unit */}
      <RouterHardwareView
        config={config}
        devices={devices}
        telemetry={telemetry}
        onReboot={onReboot}
        onFactoryReset={onFactoryReset}
        isRebooting={isRebooting}
      />

      {/* Network Topology Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Topología Lógica de la Red Doméstica
            </h3>
            <p className="text-xs text-slate-400">
              Esquema de comunicación desde la Internet pública hasta tus clientes finales
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenTopic('nat')}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
          >
            ¿Cómo funciona NAT? →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Node 1: WAN / Internet */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-2 relative">
            <div className="w-10 h-10 rounded-full bg-blue-950/70 border border-blue-700/50 mx-auto flex items-center justify-center text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Internet Pública (WAN)</div>
              <div className="text-[11px] font-mono text-blue-400">{config.wanIp}</div>
              <div className="text-[10px] text-slate-500 mt-1">Puerta de Enlace ISP: {config.wanGateway}</div>
            </div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Node 2: Router & Firewall */}
          <div className="bg-slate-950 border border-sky-800/50 rounded-xl p-4 text-center space-y-2 relative shadow-lg">
            <div className="w-10 h-10 rounded-full bg-sky-950/70 border border-sky-700/50 mx-auto flex items-center justify-center text-sky-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">{config.modelName}</div>
              <div className="text-[11px] font-mono text-sky-400">LAN: {config.lanIp}</div>
              <div className="text-[10px] text-slate-400 mt-1">
                NAT + SPI: {config.firewallSpiEnabled ? 'Activo' : 'Inactivo'} · QoS: {config.qosEnabled ? 'On' : 'Off'}
              </div>
            </div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Node 3: Access Points & Switch */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-2 relative">
            <div className="w-10 h-10 rounded-full bg-indigo-950/70 border border-indigo-700/50 mx-auto flex items-center justify-center text-indigo-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Distribución Wi-Fi & LAN</div>
              <div className="text-[11px] font-mono text-indigo-400">
                2.4G ({config.wifi24Enabled ? 'On' : 'Off'}) · 5G ({config.wifi5Enabled ? 'On' : 'Off'})
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Invitados: {config.guestWifiEnabled ? 'Activa' : 'Desactivada'} · 4 Puertos GbE
              </div>
            </div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Node 4: Connected Devices */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-950/70 border border-emerald-700/50 mx-auto flex items-center justify-center text-emerald-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Clientes Conectados</div>
              <div className="text-[11px] font-mono text-emerald-400">
                {onlineDevices.length} de {devices.length} dispositivos
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('devices')}
                className="text-[10px] text-sky-400 hover:text-sky-300 underline mt-1 block mx-auto cursor-pointer"
              >
                Administrar clientes →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time telemetry monitor */}
      <RealTimeMonitor
        telemetryHistory={telemetryHistory}
        currentTelemetry={telemetry}
        devices={devices}
        config={config}
      />

      {/* Advanced Educational Tools Suite */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Herramientas Avanzadas de Diagnóstico & Ciberseguridad
          </h3>
          {onOpenAuditReport && (
            <button
              type="button"
              onClick={onOpenAuditReport}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Generar Informe de Auditoría PDF / TXT →</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card: Terminal CLI */}
          <div
            onClick={() => onNavigateTab('terminal')}
            className="bg-slate-900 border border-slate-800 hover:border-sky-500/60 p-4 rounded-xl cursor-pointer transition-all shadow-md group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-sky-400 font-semibold">
                <Terminal className="w-4 h-4" />
                <span>Terminal CLI Interactiva</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">
                PRO
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">ping, traceroute, nslookup, arp</h4>
            <p className="text-xs text-slate-400">
              Ejecuta diagnósticos reales desde cualquier dispositivo virtual o router para verificar conectividad y saltos.
            </p>
          </div>

          {/* Card: Packet Sniffer */}
          <div
            onClick={() => onNavigateTab('sniffer')}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/60 p-4 rounded-xl cursor-pointer transition-all shadow-md group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-indigo-400 font-semibold">
                <Layers className="w-4 h-4" />
                <span>Sniffer de Paquetes</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Wireshark
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Inspección de Tramas Ethernet & IP</h4>
            <p className="text-xs text-slate-400">
              Captura y disecciona tráfico en tiempo real observando payload en texto plano vs cifrado WPA/TLS.
            </p>
          </div>

          {/* Card: Troubleshooting Helpdesk */}
          <div
            onClick={() => onNavigateTab('troubleshooting')}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 p-4 rounded-xl cursor-pointer transition-all shadow-md group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-400 font-semibold">
                <Wrench className="w-4 h-4" />
                <span>Taller de Averías</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Helpdesk
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">5 Casos Reales Break & Fix</h4>
            <p className="text-xs text-slate-400">
              Inyecta fallos de DHCP, DNS caído, desalineación de NAT y canales saturados para aprender a repararlos.
            </p>
          </div>
        </div>
      </div>

      {/* General Configuration Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Wireless */}
        <div
          onClick={() => onNavigateTab('wireless')}
          className="bg-slate-900 border border-slate-800 hover:border-sky-700/60 p-4 rounded-xl cursor-pointer transition-all shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-sky-400 font-semibold">Configuración Wi-Fi</span>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Bandas 2.4G & 5G + Invitados</h4>
          <p className="text-xs text-slate-400">
            Ajusta SSID, contraseñas, canales, WPA3 y aislamiento de red para visitantes con analizador de espectro.
          </p>
        </div>

        {/* Card 2: Security */}
        <div
          onClick={() => onNavigateTab('security')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-700/60 p-4 rounded-xl cursor-pointer transition-all shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-emerald-400 font-semibold">Cortafuegos & Seguridad</span>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Firewall SPI, DoS & Filtros</h4>
          <p className="text-xs text-slate-400">
            Protección de paquetes en tiempo real, modo oculto (Stealth) y control parental.
          </p>
        </div>

        {/* Card 3: Cyber Lab */}
        <div
          onClick={() => onNavigateTab('cyberlab')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-700/60 p-4 rounded-xl cursor-pointer transition-all shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-indigo-400 font-semibold">Laboratorio de Pruebas</span>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Escáner Nmap & Ataque WPS</h4>
          <p className="text-xs text-slate-400">
            Comprueba la seguridad con pruebas de intrusión y ataques de estrés controlados.
          </p>
        </div>
      </div>
    </div>
  );
};
