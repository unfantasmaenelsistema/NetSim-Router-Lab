import React, { useState } from 'react';
import { RouterConfig, VirtualDevice } from '../../types/router';
import { EducationalBadge } from '../EducationalBadge';
import { Sliders, Gauge, Check, Save, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  config: RouterConfig;
  devices: VirtualDevice[];
  onUpdateConfig: (newConfig: Partial<RouterConfig>) => void;
  onOpenTopic: (topicId: string) => void;
}

export const QosTab: React.FC<Props> = ({ config, devices, onUpdateConfig, onOpenTopic }) => {
  const [formData, setFormData] = useState<RouterConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onUpdateConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handlePriorityChange = (deviceId: string, priority: 'highest' | 'high' | 'normal' | 'low') => {
    setFormData({
      ...formData,
      qosDevicePriorities: {
        ...formData.qosDevicePriorities,
        [deviceId]: priority
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Calidad de Servicio (QoS) y Mitigación de Bufferbloat
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Prioriza el tráfico en tiempo real (videojuegos, llamadas VoIP) frente a descargas masivas para eliminar el lag.
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
        {/* Main QoS Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Motor de Gestión de Tráfico QoS
            </h3>
            <EducationalBadge topicId="qos" onOpenTopic={onOpenTopic} compact />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <div>
                <div className="text-xs font-semibold text-white">Habilitar Motor QoS</div>
                <div className="text-[11px] text-slate-400">
                  {formData.qosEnabled
                    ? 'Colas de prioridad activas (Protección contra congestión)'
                    : 'Desactivado (Tráfico procesado en orden FIFO simple)'}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.qosEnabled}
                  onChange={(e) => setFormData({ ...formData, qosEnabled: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500"
                />
                <span className={formData.qosEnabled ? 'text-emerald-400 font-bold' : 'text-slate-400 font-medium'}>
                  {formData.qosEnabled ? 'QoS Activado' : 'QoS Inactivo'}
                </span>
              </label>
            </div>

            <div className={`space-y-4 ${formData.qosEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Ancho de Banda Bajada (Mbps):
                  </label>
                  <input
                    type="number"
                    value={formData.qosTotalDownlinkMbps}
                    onChange={(e) => setFormData({ ...formData, qosTotalDownlinkMbps: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Capacidad contratada de descarga</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Ancho de Banda Subida (Mbps):
                  </label>
                  <input
                    type="number"
                    value={formData.qosTotalUplinkMbps}
                    onChange={(e) => setFormData({ ...formData, qosTotalUplinkMbps: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Capacidad contratada de subida</span>
                </div>
              </div>

              {/* Bufferbloat mitigation checkbox */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Algoritmo Anti-Bufferbloat (Smart Queue Management)</span>
                  <EducationalBadge topicId="bufferbloat" onOpenTopic={onOpenTopic} compact />
                </div>
                <p className="text-[11px] text-slate-400">
                  Mantiene colas de paquetes ultracortas para evitar retrasos cuando la red está al 100% de uso.
                </p>
                <label className="flex items-center gap-2 cursor-pointer text-xs pt-1">
                  <input
                    type="checkbox"
                    checked={formData.bufferbloatMitigation}
                    onChange={(e) => setFormData({ ...formData, bufferbloatMitigation: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-sky-500"
                  />
                  <span className={formData.bufferbloatMitigation ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                    {formData.bufferbloatMitigation ? 'Anti-Bufferbloat FQ-CoDel Activo' : 'Desactivado'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Didactic explanation card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-400" />
              ¿Por qué se produce el Lag sin QoS?
            </h3>
            <span className="text-xs font-mono text-amber-400">Concepto Clave</span>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 bg-rose-950/20 border border-rose-800/30 rounded-lg space-y-1">
              <span className="font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Sin QoS (Orden de llegada estándar):
              </span>
              <p className="text-[11px] leading-relaxed">
                Cuando alguien descarga una actualización de 40 GB o ve vídeo 4K, los paquetes grandes llenan los buffers de memoria del router. Los pequeños paquetes de tu partida de videojuegos o de tu llamada de trabajo deben esperar detrás de cientos de megabytes en la fila, haciendo que el ping salte de 18ms a 250ms+ (Bufferbloat).
              </p>
            </div>

            <div className="p-3 bg-emerald-950/20 border border-emerald-800/30 rounded-lg space-y-1">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Con QoS Habilitado:
              </span>
              <p className="text-[11px] leading-relaxed">
                El router clasifica los paquetes y coloca los del juego o la videollamada en un "carril prioritario expreso". La descarga masiva se ralentiza un leve 5% sin que lo notes, pero tu juego mantiene un ping constante de 18ms sin tirones ni pérdidas de paquetes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Device Priorities Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Matriz de Prioridad por Dispositivo
            </h3>
            <p className="text-xs text-slate-400">
              Asigna a qué equipos debe dar paso prioritario el router ante momentos de congestión o saturación de la fibra.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Dispositivo</th>
                <th className="py-2.5 px-3">Tipo / Uso Típico</th>
                <th className="py-2.5 px-3">IP Actual</th>
                <th className="py-2.5 px-3">Sensibilidad a Latencia</th>
                <th className="py-2.5 px-3">Nivel de Prioridad QoS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {devices.map((device) => {
                const currentPriority = formData.qosDevicePriorities[device.id] || 'normal';
                return (
                  <tr key={device.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${device.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        <span>{device.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 capitalize">{device.type.replace('_', ' ')}</td>
                    <td className="py-2.5 px-3 font-mono text-sky-400">{device.ip}</td>
                    <td className="py-2.5 px-3">
                      {device.type === 'pc_gamer' ? (
                        <span className="text-rose-400 font-bold text-[11px]">Crítica (Juegos)</span>
                      ) : device.type === 'laptop_work' ? (
                        <span className="text-amber-400 font-semibold text-[11px]">Alta (VoIP/Zoom)</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Baja / Moderada</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={currentPriority}
                        disabled={!formData.qosEnabled}
                        onChange={(e) => handlePriorityChange(device.id, e.target.value as any)}
                        className={`bg-slate-950 border border-slate-750 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none ${
                          currentPriority === 'highest'
                            ? 'text-rose-400 border-rose-800'
                            : currentPriority === 'high'
                            ? 'text-amber-400 border-amber-800'
                            : currentPriority === 'normal'
                            ? 'text-sky-400'
                            : 'text-slate-400'
                        }`}
                      >
                        <option value="highest">Máxima (Prioridad Absoluta)</option>
                        <option value="high">Alta (Preferente)</option>
                        <option value="normal">Normal (Estándar)</option>
                        <option value="low">Baja (Segundo Plano)</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
