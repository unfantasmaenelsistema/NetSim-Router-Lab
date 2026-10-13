import React from 'react';
import { RouterConfig, VirtualDevice } from '../types/router';
import { SecurityAuditReport } from '../simulation/networkEngine';
import { X, Printer, Download, ShieldCheck, CheckCircle2, AlertTriangle, FileText, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: RouterConfig;
  devices: VirtualDevice[];
  securityAudit: SecurityAuditReport;
  completedMissionsCount: number;
  totalMissionsCount: number;
}

export const AuditReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  devices,
  securityAudit,
  completedMissionsCount,
  totalMissionsCount
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const reportText = `================================================================================
   INFORME EJECUTIVO DE AUDITORÍA Y CERTIFICACIÓN DE RED DOMÉSTICA
   NetSim Router Lab | Certificado por Un Fantasma en el Sistema
================================================================================
Fecha de Emisión : ${new Date().toLocaleString()}
Router Objetivo  : ${config.modelName} (Firmware ${config.firmwareVersion})
IP WAN Pública   : ${config.wanIp}
Puerta de Enlace : ${config.lanIp} (Máscara ${config.lanSubnetMask})

--------------------------------------------------------------------------------
1. RESUMEN DE CIBERSEGURIDAD
--------------------------------------------------------------------------------
Puntuación Global  : ${securityAudit.score} / 100
Calificación       : Grado ${securityAudit.grade}
Firewall SPI       : ${config.firewallSpiEnabled ? 'ACTIVO' : 'INACTIVO (Crítico)'}
Protección Anti-DoS: ${config.dosProtectionEnabled ? 'ACTIVA' : 'INACTIVA'}
Protocolo WPS      : ${config.wpsEnabled ? `HABILITADO (${config.wpsMode})` : 'DESHABILITADO (Seguro)'}
DMZ                : ${config.dmzEnabled ? `HABILITADA hacia ${config.dmzHostIp}` : 'DESHABILITADA'}
Modo Stealth WAN   : ${!config.wanPingRespond ? 'ACTIVO (No responde a Ping)' : 'VISIBLE'}

--------------------------------------------------------------------------------
2. REDES INALÁMBRICAS (WI-FI)
--------------------------------------------------------------------------------
Wi-Fi 2.4 GHz : "${config.wifi24Ssid}" | Seguridad: ${config.wifi24Security.toUpperCase()} | Canal ${config.wifi24Channel} (${config.wifi24ChannelWidth} MHz)
Wi-Fi 5 GHz   : "${config.wifi5Ssid}" | Seguridad: ${config.wifi5Security.toUpperCase()} | Canal ${config.wifi5Channel} (${config.wifi5ChannelWidth} MHz)
Red Invitados : ${config.guestWifiEnabled ? `ACTIVA ("${config.guestWifiSsid}", Aislamiento: ${config.guestIsolation ? 'SI' : 'NO'})` : 'Desactivada'}

--------------------------------------------------------------------------------
3. INVENTARIO DE CLIENTES CONECTADOS (${devices.filter(d => d.isOnline).length} en línea)
--------------------------------------------------------------------------------
${devices.map(d => `- ${d.name.padEnd(24)} | IP: ${d.ip.padEnd(15)} | MAC: ${d.mac} | Enlace: ${d.connectionType}`).join('\n')}

--------------------------------------------------------------------------------
4. REENVÍO DE PUERTOS (NAT)
--------------------------------------------------------------------------------
${config.portForwardRules.length === 0 ? 'Sin reglas de reenvío configuradas.' : config.portForwardRules.map(r => `- ${r.serviceName}: Puerto Ext ${r.externalPort} -> ${r.internalIp}:${r.internalPort} (${r.protocol}) [${r.enabled ? 'ABIERTO' : 'CERRADO'}]`).join('\n')}

--------------------------------------------------------------------------------
5. PROGRESO EN MISIONES DIDÁCTICAS
--------------------------------------------------------------------------------
Misiones Completadas: ${completedMissionsCount} de ${totalMissionsCount}

Generado en https://www.unfantasmaenelsistema.com/
================================================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Auditoria_Red_${config.modelName.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-200 p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Printable Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-750 p-1 flex items-center justify-center shrink-0">
              <img
                src={`${import.meta.env.BASE_URL}icono.png`}
                alt="Logo"
                className="w-full h-full object-contain aspect-square"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Informe Oficial de Auditoría y Certificación de Red
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                  Certificado
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditoría técnica generada por NetSim Router Lab & Un Fantasma en el Sistema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .txt</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Executive Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-center">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Puntuación de Seguridad</span>
            <span className="text-2xl font-bold text-emerald-400">{securityAudit.score} / 100</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Calificación Global</span>
            <span className="text-2xl font-bold text-sky-400">Grado {securityAudit.grade}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Clientes Activos</span>
            <span className="text-2xl font-bold text-white">{devices.filter(d => d.isOnline).length} Hosts</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Misiones Superadas</span>
            <span className="text-2xl font-bold text-amber-400">{completedMissionsCount} / {totalMissionsCount}</span>
          </div>
        </div>

        {/* Section 1: Security Assessment */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            1. Diagnóstico de Ciberseguridad & Cortafuegos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Firewall SPI:</span>
                <span className={config.firewallSpiEnabled ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {config.firewallSpiEnabled ? 'HABILITADO (Protección de Estado)' : 'DESHABILITADO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Protección DoS / SYN Flood:</span>
                <span className={config.dosProtectionEnabled ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {config.dosProtectionEnabled ? 'ACTIVA (Rate Limiting)' : 'INACTIVA'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Modo Oculto WAN (Stealth):</span>
                <span className={!config.wanPingRespond ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                  {!config.wanPingRespond ? 'ACTIVO (Ignora Pings)' : 'Visible (Responde ICMP)'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Protocolo WPS:</span>
                <span className={!config.wpsEnabled ? 'text-emerald-400 font-bold' : config.wpsMode === 'pin' ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                  {config.wpsEnabled ? `Activo (${config.wpsMode})` : 'Desactivado (Protegido)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Zona Desmilitarizada (DMZ):</span>
                <span className={!config.dmzEnabled ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {config.dmzEnabled ? `EXPUESTA (${config.dmzHostIp})` : 'Desactivada'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Aislamiento de Invitados:</span>
                <span className={config.guestIsolation ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {config.guestIsolation ? 'AISLADO (Seguro)' : 'Sin Aislamiento'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Connected Devices Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            2. Inventario de Dispositivos Conectados
          </h3>

          <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950 font-mono text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Dispositivo</th>
                  <th className="py-2 px-3">Dirección IP</th>
                  <th className="py-2 px-3">Dirección MAC</th>
                  <th className="py-2 px-3">Medio de Enlace</th>
                  <th className="py-2 px-3 text-right">Prioridad QoS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {devices.map(d => (
                  <tr key={d.id}>
                    <td className="py-2 px-3 text-white font-sans font-semibold">{d.name}</td>
                    <td className="py-2 px-3 text-emerald-400">{d.ip}</td>
                    <td className="py-2 px-3 text-slate-400 text-[11px]">{d.mac}</td>
                    <td className="py-2 px-3 text-sky-300 capitalize">{d.connectionType.replace('_', ' ')}</td>
                    <td className="py-2 px-3 text-right text-amber-400 capitalize">{config.qosDevicePriorities[d.id] || 'Normal'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Attribution Banner */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Un Fantasma en el Sistema</span>
            <span>·</span>
            <span>https://www.unfantasmaenelsistema.com/</span>
          </div>
          <a
            href="https://www.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <span>Ver más tutoriales y recursos</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
