import React, { useState, useEffect } from 'react';
import { RouterConfig, SecurityMode } from '../../types/router';
import { EducationalBadge } from '../EducationalBadge';
import { WifiSpectrumAnalyzer } from '../WifiSpectrumAnalyzer';
import { Wifi, ShieldAlert, Users, KeyRound, Save, Check } from 'lucide-react';

interface Props {
  config: RouterConfig;
  onUpdateConfig: (newConfig: Partial<RouterConfig>) => void;
  onOpenTopic: (topicId: string) => void;
}

export const WirelessTab: React.FC<Props> = ({ config, onUpdateConfig, onOpenTopic }) => {
  const [formData, setFormData] = useState<RouterConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleSave = () => {
    onUpdateConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Tab Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wifi className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Configuración Inalámbrica (Wi-Fi Dual-Band & Invitados)
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Administra frecuencias de radio (2.4 GHz y 5 GHz), cifrado criptográfico, red para visitas y protocolo WPS.
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
        {/* Banda 2.4 GHz */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Banda 2.4 GHz (Mayor Alcance / Paredes)
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.wifi24Enabled}
                onChange={(e) => setFormData({ ...formData, wifi24Enabled: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
              />
              <span className="text-slate-300 font-medium">Habilitada</span>
            </label>
          </div>

          <div className={`space-y-4 ${formData.wifi24Enabled ? '' : 'opacity-40 pointer-events-none'}`}>
            {/* SSID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Nombre de Red (SSID):</label>
                <EducationalBadge topicId="ssid" onOpenTopic={onOpenTopic} compact />
              </div>
              <input
                type="text"
                value={formData.wifi24Ssid}
                onChange={(e) => setFormData({ ...formData, wifi24Ssid: e.target.value })}
                className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
              <div className="flex items-center gap-2 mt-2">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.wifi24Hidden}
                    onChange={(e) => setFormData({ ...formData, wifi24Hidden: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-sky-500"
                  />
                  <span>Ocultar SSID (No difundir nombre)</span>
                </label>
              </div>
            </div>

            {/* Security Mode */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Modo de Seguridad:</label>
                <EducationalBadge topicId="wifi_security_mode" onOpenTopic={onOpenTopic} compact />
              </div>
              <select
                value={formData.wifi24Security}
                onChange={(e) => setFormData({ ...formData, wifi24Security: e.target.value as SecurityMode })}
                className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              >
                <option value="none">Abierta (Sin Contraseña - Inseguro)</option>
                <option value="wep">WEP (Obsoleto - Extremadamente vulnerable)</option>
                <option value="wpa2">WPA2-Personal (AES) (Estándar recomendado)</option>
                <option value="wpa3">WPA3-Personal (SAE) (Máxima seguridad)</option>
                <option value="wpa2_wpa3">WPA2/WPA3 Mixto (Máxima compatibilidad)</option>
              </select>

              {(formData.wifi24Security === 'none' || formData.wifi24Security === 'wep') && (
                <div className="mt-2 p-2.5 rounded bg-rose-950/40 border border-rose-800/50 text-[11px] text-rose-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    Advertencia: Esta opción permite que intrusos capturen tráfico y descifren datos de tus dispositivos.
                  </span>
                </div>
              )}
            </div>

            {/* Password */}
            {formData.wifi24Security !== 'none' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Clave de Seguridad (PSK):</label>
                <input
                  type="text"
                  value={formData.wifi24Password}
                  onChange={(e) => setFormData({ ...formData, wifi24Password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            )}

            {/* Channel and Width */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Canal (Frecuencia):</label>
                <select
                  value={formData.wifi24Channel}
                  onChange={(e) => setFormData({ ...formData, wifi24Channel: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                >
                  <option value={1}>Canal 1 (2.412 GHz)</option>
                  <option value={6}>Canal 6 (2.437 GHz - Típico)</option>
                  <option value={11}>Canal 11 (2.462 GHz)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">Ancho de Canal:</label>
                  <EducationalBadge topicId="wifi_channel_width" onOpenTopic={onOpenTopic} compact />
                </div>
                <select
                  value={formData.wifi24ChannelWidth}
                  onChange={(e) => setFormData({ ...formData, wifi24ChannelWidth: Number(e.target.value) as 20 | 40 })}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                >
                  <option value={20}>20 MHz (Estable / Sin interferencia)</option>
                  <option value={40}>40 MHz (Mayor velocidad / Propenso a colisiones)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Banda 5 GHz */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Banda 5 GHz (Alta Velocidad / Baja Latencia)
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.wifi5Enabled}
                onChange={(e) => setFormData({ ...formData, wifi5Enabled: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
              />
              <span className="text-slate-300 font-medium">Habilitada</span>
            </label>
          </div>

          <div className={`space-y-4 ${formData.wifi5Enabled ? '' : 'opacity-40 pointer-events-none'}`}>
            {/* SSID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Nombre de Red (SSID):</label>
                <EducationalBadge topicId="ssid" onOpenTopic={onOpenTopic} compact />
              </div>
              <input
                type="text"
                value={formData.wifi5Ssid}
                onChange={(e) => setFormData({ ...formData, wifi5Ssid: e.target.value })}
                className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
              <div className="flex items-center gap-2 mt-2">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.wifi5Hidden}
                    onChange={(e) => setFormData({ ...formData, wifi5Hidden: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-sky-500"
                  />
                  <span>Ocultar SSID 5GHz</span>
                </label>
              </div>
            </div>

            {/* Security Mode */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Modo de Seguridad:</label>
                <EducationalBadge topicId="wifi_security_mode" onOpenTopic={onOpenTopic} compact />
              </div>
              <select
                value={formData.wifi5Security}
                onChange={(e) => setFormData({ ...formData, wifi5Security: e.target.value as SecurityMode })}
                className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              >
                <option value="wpa3">WPA3-Personal (SAE) (Recomendado para Wi-Fi 6)</option>
                <option value="wpa2_wpa3">WPA2/WPA3 Mixto (Compatibilidad con dispositivos antiguos)</option>
                <option value="wpa2">WPA2-Personal (AES)</option>
                <option value="none">Abierta (Sin cifrado)</option>
              </select>
            </div>

            {/* Password */}
            {formData.wifi5Security !== 'none' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Clave de Seguridad (PSK):</label>
                <input
                  type="text"
                  value={formData.wifi5Password}
                  onChange={(e) => setFormData({ ...formData, wifi5Password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            )}

            {/* Channel and Width */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Canal 5GHz:</label>
                <select
                  value={formData.wifi5Channel}
                  onChange={(e) => setFormData({ ...formData, wifi5Channel: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                >
                  <option value={36}>Canal 36 (5.180 GHz - Sin DFS)</option>
                  <option value={40}>Canal 40 (5.200 GHz)</option>
                  <option value={44}>Canal 44 (5.220 GHz)</option>
                  <option value={48}>Canal 48 (5.240 GHz)</option>
                  <option value={149}>Canal 149 (5.745 GHz)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">Ancho de Canal:</label>
                  <EducationalBadge topicId="wifi_channel_width" onOpenTopic={onOpenTopic} compact />
                </div>
                <select
                  value={formData.wifi5ChannelWidth}
                  onChange={(e) => setFormData({ ...formData, wifi5ChannelWidth: Number(e.target.value) as 40 | 80 | 160 })}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                >
                  <option value={40}>40 MHz (Estándar)</option>
                  <option value={80}>80 MHz (Velocidad óptima ~600 Mbps)</option>
                  <option value={160}>160 MHz (Ultra velocidad Wi-Fi 6)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Red de Invitados (Guest Network) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Red de Invitados (Guest Wi-Fi)
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.guestWifiEnabled}
                onChange={(e) => setFormData({ ...formData, guestWifiEnabled: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
              />
              <span className="text-slate-300 font-medium">Habilitar Red de Invitados</span>
            </label>
          </div>

          <div className={`space-y-4 ${formData.guestWifiEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">SSID Invitados:</label>
              <input
                type="text"
                value={formData.guestWifiSsid}
                onChange={(e) => setFormData({ ...formData, guestWifiSsid: e.target.value })}
                className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Contraseña Invitados:</label>
              <input
                type="text"
                value={formData.guestWifiPassword}
                onChange={(e) => setFormData({ ...formData, guestWifiPassword: e.target.value })}
                className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* AP Isolation switch */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>Aislamiento de Invitados (AP Isolation)</span>
                </label>
                <EducationalBadge topicId="guest_isolation" onOpenTopic={onOpenTopic} compact />
              </div>
              <p className="text-[11px] text-slate-400">
                Impide que los invitados puedan comunicarse entre sí o acceder a tus equipos locales (ordenadores, NAS, impresoras).
              </p>
              <label className="flex items-center gap-2 cursor-pointer text-xs pt-1">
                <input
                  type="checkbox"
                  checked={formData.guestIsolation}
                  onChange={(e) => setFormData({ ...formData, guestIsolation: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500"
                />
                <span className={formData.guestIsolation ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {formData.guestIsolation ? 'Aislamiento Activado (Seguro)' : 'Aislamiento Desactivado (Riesgo)'}
                </span>
              </label>
            </div>

            {/* Bandwidth Limiter */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Límite de Ancho de Banda para Invitados:</span>
                <span className="font-mono text-sky-400 font-bold">{formData.guestBandwidthLimitMbps} Mbps</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={formData.guestBandwidthLimitMbps}
                onChange={(e) => setFormData({ ...formData, guestBandwidthLimitMbps: Number(e.target.value) })}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* WPS Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                WPS (Wi-Fi Protected Setup)
              </h3>
            </div>
            <EducationalBadge topicId="wps" onOpenTopic={onOpenTopic} compact />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <div>
                <div className="text-xs font-semibold text-white">Estado de WPS</div>
                <div className="text-[11px] text-slate-400">
                  {formData.wpsEnabled ? 'Protocolo WPS Activo en el router' : 'Protocolo WPS Desactivado'}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.wpsEnabled}
                  onChange={(e) => setFormData({ ...formData, wpsEnabled: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500"
                />
                <span className={formData.wpsEnabled ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {formData.wpsEnabled ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </label>
            </div>

            <div className={`space-y-3 ${formData.wpsEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Método de Emparejamiento WPS:</label>
                <select
                  value={formData.wpsMode}
                  onChange={(e) => setFormData({ ...formData, wpsMode: e.target.value as 'push_button' | 'pin' })}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="push_button">Botón Pulsador Físico (PBC - Seguro momentáneo)</option>
                  <option value="pin">Código PIN de 8 dígitos (Extremadamente vulnerable)</option>
                </select>
              </div>

              {formData.wpsMode === 'pin' && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs space-y-1.5">
                  <div className="text-rose-400 font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> Alerta de Ciberseguridad: PIN Vulnerable
                  </div>
                  <p className="text-[11px] text-slate-300">
                    PIN actual: <span className="font-mono font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">{formData.wpsPin}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Cualquier atacante cercano puede usar herramientas como Pixie Dust para obtener la clave WPA completa en segundos. Puedes comprobarlo en la pestaña "Pruebas de Ciberseguridad".
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Wi-Fi Spectrum Analyzer & Channel Overlap Curves */}
      <WifiSpectrumAnalyzer
        config={formData}
        onUpdateConfig={(patch) => {
          setFormData(prev => ({ ...prev, ...patch }));
          onUpdateConfig(patch);
        }}
        onOpenTopic={onOpenTopic}
      />
    </div>
  );
};
