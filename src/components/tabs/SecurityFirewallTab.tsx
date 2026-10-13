import React, { useState } from 'react';
import { RouterConfig, BlockedDomain } from '../../types/router';
import { EducationalBadge } from '../EducationalBadge';
import { Shield, ShieldAlert, ShieldCheck, Plus, Trash2, Save, Check, Globe } from 'lucide-react';

interface Props {
  config: RouterConfig;
  onUpdateConfig: (newConfig: Partial<RouterConfig>) => void;
  onOpenTopic: (topicId: string) => void;
}

export const SecurityFirewallTab: React.FC<Props> = ({ config, onUpdateConfig, onOpenTopic }) => {
  const [formData, setFormData] = useState<RouterConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [newMacInput, setNewMacInput] = useState('');

  const handleSave = () => {
    onUpdateConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddDomain = () => {
    if (!newDomainInput.trim()) return;
    const newBlocked: BlockedDomain = {
      id: `dom-${Date.now()}`,
      domain: newDomainInput.trim().toLowerCase(),
      category: 'custom',
      enabled: true
    };
    setFormData({
      ...formData,
      blockedDomains: [...formData.blockedDomains, newBlocked]
    });
    setNewDomainInput('');
  };

  const handleToggleDomain = (id: string) => {
    setFormData({
      ...formData,
      blockedDomains: formData.blockedDomains.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d)
    });
  };

  const handleDeleteDomain = (id: string) => {
    setFormData({
      ...formData,
      blockedDomains: formData.blockedDomains.filter(d => d.id !== id)
    });
  };

  const handleAddMac = () => {
    if (!newMacInput.trim()) return;
    const cleanMac = newMacInput.trim().toUpperCase();
    if (!formData.macFilterList.includes(cleanMac)) {
      setFormData({
        ...formData,
        macFilterList: [...formData.macFilterList, cleanMac]
      });
    }
    setNewMacInput('');
  };

  const handleDeleteMac = (mac: string) => {
    setFormData({
      ...formData,
      macFilterList: formData.macFilterList.filter(m => m !== mac)
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Seguridad, Firewall y Filtros de Acceso
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Control de paquetes SPI, mitigación de ataques DoS, modo oculto WAN, filtrado MAC y control parental.
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
        {/* Core Firewall Protections */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Defensas Principales del Cortafuegos
            </h3>
            <span className="text-[11px] font-mono text-emerald-400">Motor de Filtrado OSI Capa 3/4</span>
          </div>

          <div className="space-y-4">
            {/* SPI Firewall */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${formData.firewallSpiEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-white">Firewall SPI (Stateful Packet Inspection)</span>
                </div>
                <EducationalBadge topicId="firewall_spi" onOpenTopic={onOpenTopic} compact />
              </div>
              <p className="text-[11px] text-slate-400">
                Supervisa el estado de todas las conexiones entrantes y salientes. Descarta intentos de intrusión no solicitados desde Internet.
              </p>
              <label className="flex items-center gap-2 cursor-pointer text-xs pt-1">
                <input
                  type="checkbox"
                  checked={formData.firewallSpiEnabled}
                  onChange={(e) => setFormData({ ...formData, firewallSpiEnabled: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500"
                />
                <span className={formData.firewallSpiEnabled ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {formData.firewallSpiEnabled ? 'Habilitado (Recomendado)' : 'Deshabilitado (Peligro crítico)'}
                </span>
              </label>
            </div>

            {/* DoS Protection */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`w-4 h-4 ${formData.dosProtectionEnabled ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="text-xs font-bold text-white">Protección contra Ataques DoS / SYN Flood</span>
                </div>
                <EducationalBadge topicId="dos_protection" onOpenTopic={onOpenTopic} compact />
              </div>
              <p className="text-[11px] text-slate-400">
                Detecta y descarta ráfagas masivas de paquetes destinadas a colapsar el router (Inundación SYN, Ping of Death, ICMP Flood).
              </p>
              <label className="flex items-center gap-2 cursor-pointer text-xs pt-1">
                <input
                  type="checkbox"
                  checked={formData.dosProtectionEnabled}
                  onChange={(e) => setFormData({ ...formData, dosProtectionEnabled: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500"
                />
                <span className={formData.dosProtectionEnabled ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {formData.dosProtectionEnabled ? 'Protección DoS Activa' : 'Protección DoS Inactiva (Propenso a caídas)'}
                </span>
              </label>
            </div>

            {/* WAN Ping Response (Stealth) */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white">Respuesta a Ping en WAN (Modo Oculto)</span>
                </div>
                <EducationalBadge topicId="wan_ping_stealth" onOpenTopic={onOpenTopic} compact />
              </div>
              <p className="text-[11px] text-slate-400">
                Si se desactiva, el router no contestará a sondeos ICMP desde Internet, haciéndose invisible a los escáneres automáticos de la red.
              </p>
              <label className="flex items-center gap-2 cursor-pointer text-xs pt-1">
                <input
                  type="checkbox"
                  checked={formData.wanPingRespond}
                  onChange={(e) => setFormData({ ...formData, wanPingRespond: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500"
                />
                <span className={formData.wanPingRespond ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {formData.wanPingRespond ? 'Responde a Pings (Visible)' : 'Ignora Pings (Modo Oculto / Stealth)'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Remote Management & MAC Filter */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Gestión Remota & Control MAC
            </h3>
            <EducationalBadge topicId="remote_management" onOpenTopic={onOpenTopic} compact />
          </div>

          <div className="space-y-4">
            {/* Remote Management */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Gestión Remota desde Internet (WAN Web Admin)</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${formData.remoteManagementEnabled ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                  {formData.remoteManagementEnabled ? 'PELIGRO' : 'SEGURO'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Permite acceder a este panel de administración desde cualquier parte de Internet mediante la IP pública.
              </p>
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formData.remoteManagementEnabled}
                    onChange={(e) => setFormData({ ...formData, remoteManagementEnabled: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-sky-500"
                  />
                  <span className={formData.remoteManagementEnabled ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {formData.remoteManagementEnabled ? 'Gestión Remota Habilitada' : 'Deshabilitada (Recomendado)'}
                  </span>
                </label>
                {formData.remoteManagementEnabled && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">Puerto:</span>
                    <input
                      type="number"
                      value={formData.remoteManagementPort}
                      onChange={(e) => setFormData({ ...formData, remoteManagementPort: Number(e.target.value) })}
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* MAC Address Filtering */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Filtrado de Direcciones MAC</span>
                <EducationalBadge topicId="mac_filtering" onOpenTopic={onOpenTopic} compact />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Modo de Filtrado:</label>
                <select
                  value={formData.macFilteringMode}
                  onChange={(e) => setFormData({ ...formData, macFilteringMode: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="disabled">Desactivado (Cualquier equipo con contraseña accede)</option>
                  <option value="whitelist">Lista Blanca (Solo las MACs listadas acceden)</option>
                  <option value="blacklist">Lista Negra (Las MACs listadas son bloqueadas)</option>
                </select>
              </div>

              {formData.macFilteringMode !== 'disabled' && (
                <div className="space-y-2 pt-2 border-t border-slate-850">
                  <span className="text-[11px] font-mono text-slate-400">MACs Registradas ({formData.macFilterList.length}):</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {formData.macFilterList.map(mac => (
                      <span key={mac} className="inline-flex items-center gap-1 bg-slate-900 border border-slate-750 px-2 py-0.5 rounded text-[11px] font-mono text-sky-400">
                        {mac}
                        <button type="button" onClick={() => handleDeleteMac(mac)} className="text-slate-500 hover:text-rose-400 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {formData.macFilterList.length === 0 && (
                      <span className="text-[11px] text-slate-500 italic">No hay direcciones MAC en la lista.</span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Ej. DE:AD:BE:EF:00:13"
                      value={newMacInput}
                      onChange={(e) => setNewMacInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-750 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddMac}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs cursor-pointer"
                    >
                      Añadir MAC
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parental Controls & Web Filtering */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Control Parental & Filtro de Dominios Web
            </h3>
          </div>
          <EducationalBadge topicId="parental_control" onOpenTopic={onOpenTopic} compact />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div>
              <div className="text-xs font-semibold text-white">Estado del Filtro Web</div>
              <div className="text-[11px] text-slate-400">
                Intercepta consultas DNS hacia dominios y categorías no autorizadas
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.parentalControlEnabled}
                onChange={(e) => setFormData({ ...formData, parentalControlEnabled: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-sky-500"
              />
              <span className={formData.parentalControlEnabled ? 'text-emerald-400 font-bold' : 'text-slate-400 font-medium'}>
                {formData.parentalControlEnabled ? 'Control Parental Activo' : 'Desactivado'}
              </span>
            </label>
          </div>

          <div className={`space-y-3 ${formData.parentalControlEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
            <span className="text-xs font-mono text-slate-400 block font-semibold">Lista de Dominios Restringidos:</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {formData.blockedDomains.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={() => handleToggleDomain(item.id)}
                      className="rounded border-slate-700 bg-slate-900 text-sky-500"
                    />
                    <span className={`font-mono ${item.enabled ? 'text-rose-400 font-semibold' : 'text-slate-500 line-through'}`}>
                      {item.domain}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteDomain(item.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new domain */}
            <div className="flex gap-2 max-w-md pt-2">
              <input
                type="text"
                placeholder="ej. youtube.com, casino.com"
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-750 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddDomain}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Bloquear Dominio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
