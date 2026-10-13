import React, { useState } from 'react';
import { RouterConfig, StaticLease } from '../../types/router';
import { EducationalBadge } from '../EducationalBadge';
import { Network, Server, Globe2, Plus, Trash2, Save, Check, AlertTriangle } from 'lucide-react';

interface Props {
  config: RouterConfig;
  onUpdateConfig: (newConfig: Partial<RouterConfig>) => void;
  onOpenTopic: (topicId: string) => void;
}

export const NetworkLanTab: React.FC<Props> = ({ config, onUpdateConfig, onOpenTopic }) => {
  const [formData, setFormData] = useState<RouterConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New reservation inputs
  const [newHostname, setNewHostname] = useState('');
  const [newMac, setNewMac] = useState('');
  const [newIp, setNewIp] = useState('');

  const handleSave = () => {
    onUpdateConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddStaticLease = () => {
    if (!newHostname || !newMac || !newIp) return;
    const newLease: StaticLease = {
      id: `lease-${Date.now()}`,
      hostname: newHostname,
      mac: newMac.toUpperCase(),
      ip: newIp
    };
    setFormData({
      ...formData,
      staticLeases: [...formData.staticLeases, newLease]
    });
    setNewHostname('');
    setNewMac('');
    setNewIp('');
  };

  const handleDeleteStaticLease = (id: string) => {
    setFormData({
      ...formData,
      staticLeases: formData.staticLeases.filter(l => l.id !== id)
    });
  };

  const setDnsPreset = (primary: string, secondary: string) => {
    setFormData({
      ...formData,
      wanDnsMode: 'Custom',
      wanPrimaryDns: primary,
      wanSecondaryDns: secondary
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Red Local (LAN), Servidor DHCP y DNS
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Configura la dirección de la puerta de enlace, el rango de direcciones IP automáticas, reservas estáticas y resolución DNS.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Router LAN IP & Gateway */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Parámetros de Red Local (LAN)
            </h3>
            <EducationalBadge topicId="gateway" onOpenTopic={onOpenTopic} compact />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Dirección IP del Router (Puerta de Enlace / Gateway):
              </label>
              <input
                type="text"
                value={formData.lanIp}
                onChange={(e) => setFormData({ ...formData, lanIp: e.target.value })}
                className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Dirección con la que los equipos acceden a Internet y a este panel web.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Máscara de Subred:
              </label>
              <input
                type="text"
                value={formData.lanSubnetMask}
                onChange={(e) => setFormData({ ...formData, lanSubnetMask: e.target.value })}
                className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Define el tamaño de la subred local (255.255.255.0 = red /24, hasta 254 dispositivos).
              </span>
            </div>
          </div>
        </div>

        {/* Servidor DHCP */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Servidor DHCP (Asignación Automática)
              </h3>
            </div>
            <EducationalBadge topicId="dhcp_server" onOpenTopic={onOpenTopic} compact />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <div>
                <div className="text-xs font-semibold text-white">Estado del Servidor DHCP</div>
                <div className="text-[11px] text-slate-400">
                  {formData.dhcpEnabled
                    ? 'Asigna IPs automáticas a los clientes'
                    : 'Desactivado (Los clientes necesitan IP manual)'}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.dhcpEnabled}
                  onChange={(e) => setFormData({ ...formData, dhcpEnabled: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500"
                />
                <span className={formData.dhcpEnabled ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {formData.dhcpEnabled ? 'Activado' : 'Desactivado'}
                </span>
              </label>
            </div>

            {!formData.dhcpEnabled && (
              <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-lg text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Al desactivar DHCP, los nuevos clientes recibirán direcciones APIPA (169.254.x.x) y no podrán navegar a menos que configures su IP estática manualmente.
                </span>
              </div>
            )}

            <div className={`space-y-3 ${formData.dhcpEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">IP Inicial del Pool:</label>
                  <input
                    type="text"
                    value={formData.dhcpPoolStart}
                    onChange={(e) => setFormData({ ...formData, dhcpPoolStart: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">IP Final del Pool:</label>
                  <input
                    type="text"
                    value={formData.dhcpPoolEnd}
                    onChange={(e) => setFormData({ ...formData, dhcpPoolEnd: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">Tiempo de Concesión (Lease Time):</label>
                  <EducationalBadge topicId="dhcp_lease_time" onOpenTopic={onOpenTopic} compact />
                </div>
                <select
                  value={formData.dhcpLeaseTimeHours}
                  onChange={(e) => setFormData({ ...formData, dhcpLeaseTimeHours: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                >
                  <option value={2}>2 Horas (Cafeterías / Redes públicas)</option>
                  <option value={12}>12 Horas</option>
                  <option value={24}>24 Horas (Recomendado para hogares)</option>
                  <option value={72}>72 Horas (3 días)</option>
                  <option value={168}>168 Horas (1 semana)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DNS Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Configuración de Servidores DNS (Domain Name System)
            </h3>
          </div>
          <EducationalBadge topicId="dns_servers" onOpenTopic={onOpenTopic} compact />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                <input
                  type="radio"
                  name="dnsMode"
                  checked={formData.wanDnsMode === 'ISP'}
                  onChange={() => setFormData({ ...formData, wanDnsMode: 'ISP' })}
                  className="text-sky-500"
                />
                <span>Automático del Proveedor (ISP)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                <input
                  type="radio"
                  name="dnsMode"
                  checked={formData.wanDnsMode === 'Custom'}
                  onChange={() => setFormData({ ...formData, wanDnsMode: 'Custom' })}
                  className="text-sky-500"
                />
                <span>DNS Personalizados (Rápidos & Seguros)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">DNS Primario:</label>
                <input
                  type="text"
                  value={formData.wanPrimaryDns}
                  disabled={formData.wanDnsMode === 'ISP'}
                  onChange={(e) => setFormData({ ...formData, wanPrimaryDns: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white disabled:opacity-40 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">DNS Secundario:</label>
                <input
                  type="text"
                  value={formData.wanSecondaryDns}
                  disabled={formData.wanDnsMode === 'ISP'}
                  onChange={(e) => setFormData({ ...formData, wanSecondaryDns: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white disabled:opacity-40 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Quick DNS Presets */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
            <span className="text-xs font-mono text-slate-400 font-semibold block">Presets Populares:</span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setDnsPreset('1.1.1.1', '1.0.0.1')}
                className="text-left px-2 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-sky-400 flex justify-between items-center cursor-pointer"
              >
                <span>Cloudflare (1.1.1.1)</span>
                <span className="text-[10px] text-slate-500 font-mono">Ultra Rápido</span>
              </button>

              <button
                type="button"
                onClick={() => setDnsPreset('8.8.8.8', '8.8.4.4')}
                className="text-left px-2 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-sky-400 flex justify-between items-center cursor-pointer"
              >
                <span>Google DNS (8.8.8.8)</span>
                <span className="text-[10px] text-slate-500 font-mono">Confiable</span>
              </button>

              <button
                type="button"
                onClick={() => setDnsPreset('94.140.14.14', '94.140.15.15')}
                className="text-left px-2 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-emerald-400 flex justify-between items-center cursor-pointer"
              >
                <span>AdGuard DNS</span>
                <span className="text-[10px] text-slate-500 font-mono">Bloqueo Anuncios</span>
              </button>

              <button
                type="button"
                onClick={() => setDnsPreset('9.9.9.9', '149.112.112.112')}
                className="text-left px-2 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-indigo-400 flex justify-between items-center cursor-pointer"
              >
                <span>Quad9 (9.9.9.9)</span>
                <span className="text-[10px] text-slate-500 font-mono">Anti-Malware</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Static DHCP Reservations */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Reservas Estáticas DHCP (IP-MAC Binding)
            </h3>
            <p className="text-xs text-slate-400">
              Garantiza que servidores, consolas o PCs específicos reciban siempre la misma IP privada.
            </p>
          </div>
          <EducationalBadge topicId="static_dhcp_reservation" onOpenTopic={onOpenTopic} compact />
        </div>

        {/* Current Reservations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Nombre del Dispositivo</th>
                <th className="py-2.5 px-3">Dirección MAC</th>
                <th className="py-2.5 px-3">IP Fija Asignada</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {formData.staticLeases.map((lease) => (
                <tr key={lease.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-white">{lease.hostname}</td>
                  <td className="py-2.5 px-3 text-sky-400">{lease.mac}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{lease.ip}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteStaticLease(lease.id)}
                      className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                      title="Eliminar reserva"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {formData.staticLeases.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500 italic font-sans">
                    No hay reservas estáticas configuradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add new reservation form */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
          <span className="text-xs font-semibold text-slate-300 block">Añadir Nueva Reserva Estática:</span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Ej. Servidor-Minecraft"
              value={newHostname}
              onChange={(e) => setNewHostname(e.target.value)}
              className="bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white"
            />
            <input
              type="text"
              placeholder="MAC (00:1A:2B:3C:4D:5E)"
              value={newMac}
              onChange={(e) => setNewMac(e.target.value)}
              className="bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white font-mono"
            />
            <input
              type="text"
              placeholder="IP (192.168.1.50)"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              className="bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white font-mono"
            />
            <button
              type="button"
              onClick={handleAddStaticLease}
              className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Reserva</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
