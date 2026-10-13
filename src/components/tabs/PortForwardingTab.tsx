import React, { useState } from 'react';
import { RouterConfig, PortForwardRule } from '../../types/router';
import { EducationalBadge } from '../EducationalBadge';
import { ArrowLeftRight, Plus, Trash2, Save, Check, ShieldAlert, Cpu } from 'lucide-react';

interface Props {
  config: RouterConfig;
  onUpdateConfig: (newConfig: Partial<RouterConfig>) => void;
  onOpenTopic: (topicId: string) => void;
}

export const PortForwardingTab: React.FC<Props> = ({ config, onUpdateConfig, onOpenTopic }) => {
  const [formData, setFormData] = useState<RouterConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New rule state
  const [serviceName, setServiceName] = useState('');
  const [extPort, setExtPort] = useState('');
  const [intIp, setIntIp] = useState('');
  const [intPort, setIntPort] = useState('');
  const [protocol, setProtocol] = useState<'TCP' | 'UDP' | 'BOTH'>('TCP');

  const handleSave = () => {
    onUpdateConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleToggleRule = (id: string) => {
    setFormData({
      ...formData,
      portForwardRules: formData.portForwardRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    });
  };

  const handleDeleteRule = (id: string) => {
    setFormData({
      ...formData,
      portForwardRules: formData.portForwardRules.filter(r => r.id !== id)
    });
  };

  const handleAddRule = () => {
    if (!serviceName || !extPort || !intIp || !intPort) return;
    const newRule: PortForwardRule = {
      id: `rule-${Date.now()}`,
      serviceName,
      externalPort: Number(extPort),
      internalIp: intIp,
      internalPort: Number(intPort),
      protocol,
      enabled: true
    };
    setFormData({
      ...formData,
      portForwardRules: [...formData.portForwardRules, newRule]
    });
    setServiceName('');
    setExtPort('');
    setIntIp('');
    setIntPort('');
  };

  const loadPreset = (name: string, port: number, proto: 'TCP' | 'UDP' | 'BOTH') => {
    setServiceName(name);
    setExtPort(String(port));
    setIntPort(String(port));
    setIntIp('192.168.1.50');
    setProtocol(proto);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ArrowLeftRight className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Reenvío de Puertos (Port Forwarding), DMZ y UPnP
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Abre servicios locales hacia Internet (servidores web, Minecraft, Plex) y gestiona apertura automática de puertos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer self-start sm:self-auto"
        >
          {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? '¡Cambios Guardados!' : 'Guardar y Aplicar'}</span>
        </button>
      </div>

      {/* Port Forwarding Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Reglas de Servidores Virtuales / Port Forwarding
            </h3>
            <p className="text-xs text-slate-400">
              Redirige el tráfico de un puerto de tu IP pública ({config.wanIp}) hacia un equipo de tu red interna.
            </p>
          </div>
          <EducationalBadge topicId="port_forwarding" onOpenTopic={onOpenTopic} compact />
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Servicio / Descripción</th>
                <th className="py-2.5 px-3">Puerto Externo</th>
                <th className="py-2.5 px-3">IP Interna Destino</th>
                <th className="py-2.5 px-3">Puerto Interno</th>
                <th className="py-2.5 px-3">Protocolo</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {formData.portForwardRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        className="rounded border-slate-700 bg-slate-900 text-sky-500"
                      />
                      <span className={`text-[11px] ${rule.enabled ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                        {rule.enabled ? 'Abierto' : 'Cerrado'}
                      </span>
                    </label>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white font-sans">{rule.serviceName}</td>
                  <td className="py-2.5 px-3 text-sky-400">{rule.externalPort}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{rule.internalIp}</td>
                  <td className="py-2.5 px-3 text-sky-300">{rule.internalPort}</td>
                  <td className="py-2.5 px-3 text-amber-400">{rule.protocol}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      title="Eliminar regla"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {formData.portForwardRules.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-500 italic font-sans">
                    No hay reglas de reenvío configuradas. Tu router descarta todas las conexiones entrantes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Presets Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-850 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Cargar Preajuste Rápido:</span>
          <button
            type="button"
            onClick={() => loadPreset('Minecraft Server', 25565, 'TCP')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] cursor-pointer"
          >
            Minecraft (25565 TCP)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('Web Server HTTP', 80, 'TCP')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] cursor-pointer"
          >
            Web HTTP (80 TCP)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('Plex Media Server', 32400, 'TCP')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] cursor-pointer"
          >
            Plex (32400 TCP)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('WireGuard VPN', 51820, 'UDP')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] cursor-pointer"
          >
            WireGuard (51820 UDP)
          </button>
        </div>

        {/* Add Rule Form */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
          <span className="text-xs font-semibold text-slate-300 block">Añadir Nueva Regla de Reenvío:</span>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
            <input
              type="text"
              placeholder="Nombre del servicio"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white"
            />
            <input
              type="number"
              placeholder="Puerto Ext (ej. 80)"
              value={extPort}
              onChange={(e) => setExtPort(e.target.value)}
              className="bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white font-mono"
            />
            <input
              type="text"
              placeholder="IP Destino (192.168.1.50)"
              value={intIp}
              onChange={(e) => setIntIp(e.target.value)}
              className="bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white font-mono"
            />
            <input
              type="number"
              placeholder="Puerto Int (ej. 80)"
              value={intPort}
              onChange={(e) => setIntPort(e.target.value)}
              className="bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white font-mono"
            />
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as any)}
              className="bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white font-mono"
            >
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="BOTH">TCP / UDP</option>
            </select>
            <button
              type="button"
              onClick={handleAddRule}
              className="flex items-center justify-center gap-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </div>
        </div>
      </div>

      {/* DMZ & UPnP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DMZ (Demilitarized Zone) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              DMZ (Zona Desmilitarizada)
            </h3>
            <EducationalBadge topicId="dmz" onOpenTopic={onOpenTopic} compact />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <div>
                <div className="text-xs font-semibold text-white">Estado de la DMZ</div>
                <div className="text-[11px] text-slate-400">
                  {formData.dmzEnabled
                    ? 'Activada (Expone TODOS los puertos no asignados)'
                    : 'Desactivada (Recomendado)'}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.dmzEnabled}
                  onChange={(e) => setFormData({ ...formData, dmzEnabled: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500"
                />
                <span className={formData.dmzEnabled ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {formData.dmzEnabled ? 'Habilitada' : 'Deshabilitada'}
                </span>
              </label>
            </div>

            <div className={`space-y-3 ${formData.dmzEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Dirección IP del Host en DMZ:
                </label>
                <input
                  type="text"
                  value={formData.dmzHostIp}
                  onChange={(e) => setFormData({ ...formData, dmzHostIp: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs space-y-1.5 text-rose-300">
                <div className="font-bold flex items-center gap-1.5 text-rose-400">
                  <ShieldAlert className="w-4 h-4 shrink-0" /> Peligro Crítico de Exposición
                </div>
                <p className="text-[11px] text-slate-300">
                  El equipo en la IP {formData.dmzHostIp} queda completamente desprotegido del firewall. Cualquier atacante o robot en Internet puede intentar acceder a sus puertos compartidos de Windows (SMB 445), Escritorio Remoto (RDP 3389) o bases de datos sin filtro.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* UPnP (Universal Plug and Play) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              UPnP (Universal Plug and Play)
            </h3>
            <EducationalBadge topicId="upnp" onOpenTopic={onOpenTopic} compact />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <div>
                <div className="text-xs font-semibold text-white">Estado del Protocolo UPnP</div>
                <div className="text-[11px] text-slate-400">
                  {formData.upnpEnabled
                    ? 'Las aplicaciones locales pueden abrir puertos automáticamente'
                    : 'Desactivado (Apertura solo manual)'}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.upnpEnabled}
                  onChange={(e) => setFormData({ ...formData, upnpEnabled: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500"
                />
                <span className={formData.upnpEnabled ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {formData.upnpEnabled ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </label>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2">
              <span className="font-mono text-slate-400 text-[11px] font-semibold block">
                Mapeos Dinámicos Activos por UPnP:
              </span>
              {formData.upnpEnabled ? (
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span>PlayStation / Consola Gaming</span>
                    <span className="text-emerald-400">UDP 3074 → 192.168.1.102</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cliente Torrent / P2P</span>
                    <span className="text-amber-400">TCP 6881 → 192.168.1.50</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-[11px] italic font-mono">
                  UPnP inactivo: Ninguna aplicación puede crear reglas dinámicas.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
