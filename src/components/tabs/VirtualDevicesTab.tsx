import React, { useState, useRef } from 'react';
import { VirtualDevice, ConnectionType, DeviceActivity, DeviceType, RouterConfig } from '../../types/router';
import { Laptop, Tv, Smartphone, ShieldAlert, Plus, Radio, Network, Wifi, Play, Pause, Flame, RefreshCw } from 'lucide-react';

interface Props {
  devices: VirtualDevice[];
  onUpdateDevice: (id: string, updates: Partial<VirtualDevice>) => void;
  onAddDevice: (newDevice: VirtualDevice) => void;
  onDeleteDevice: (id: string) => void;
  config: RouterConfig;
}

/** Medio por defecto al reconectar un equipo del que no se recuerda la conexión anterior */
function defaultConnectionFor(type: DeviceType): ConnectionType {
  if (type === 'pc_gamer' || type === 'console') return 'ethernet_lan1';
  if (type === 'iot_camera') return 'wifi_24g';
  return 'wifi_5g';
}

export const VirtualDevicesTab: React.FC<Props> = ({
  devices,
  onUpdateDevice,
  onAddDevice,
  onDeleteDevice,
  config
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<DeviceType>('custom');
  const [customConn, setCustomConn] = useState<ConnectionType>('wifi_5g');
  const [customMac, setCustomMac] = useState('');

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'smart_tv':
        return <Tv className="w-5 h-5 text-indigo-400" />;
      case 'smartphone':
        return <Smartphone className="w-5 h-5 text-emerald-400" />;
      case 'iot_camera':
        return <Radio className="w-5 h-5 text-amber-400" />;
      case 'attacker':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'pc_gamer':
      case 'laptop_work':
      default:
        return <Laptop className="w-5 h-5 text-sky-400" />;
    }
  };

  // Último medio de conexión de cada equipo antes de desconectarlo
  const lastConnectionRef = useRef<Record<string, ConnectionType>>({});

  const handleCreateCustom = () => {
    if (!customName.trim()) return;
    const generatedMac = customMac.trim() || `02:50:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`;
    const newDevice: VirtualDevice = {
      id: `dev-${Date.now()}`,
      name: customName.trim(),
      type: customType,
      connectionType: customConn,
      mac: generatedMac.toUpperCase(),
      ip: '0.0.0.0', // el servidor DHCP del router le asignará IP en el siguiente ciclo
      isOnline: customConn !== 'disconnected',
      currentActivity: 'web_browsing',
      demandDownloadMbps: 8,
      demandUploadMbps: 2,
      currentDownloadMbps: 8,
      currentUploadMbps: 2,
      currentLatencyMs: 25,
      packetLossPercent: 0,
      isBlockedByMac: false,
      isBlockedByParental: false,
      isolationRestricted: false,
      statusLog: 'Dispositivo personalizado añadido al laboratorio'
    };
    onAddDevice(newDevice);
    setCustomName('');
    setCustomMac('');
    setShowAddModal(false);
  };

  // Quick lab scenarios
  const triggerSteamHeavyDownload = () => {
    const pc = devices.find(d => d.id === 'dev-pc-gamer');
    if (pc) {
      onUpdateDevice(pc.id, { currentActivity: 'p2p_torrent' });
    }
  };

  const resetAllToNormal = () => {
    devices.forEach(d => {
      if (d.type === 'pc_gamer') onUpdateDevice(d.id, { currentActivity: 'gaming' });
      else if (d.type === 'smart_tv') onUpdateDevice(d.id, { currentActivity: 'streaming_4k' });
      else if (d.type === 'smartphone') onUpdateDevice(d.id, { currentActivity: 'web_browsing' });
      else if (d.type === 'laptop_work') onUpdateDevice(d.id, { currentActivity: 'video_call' });
      else if (d.type === 'attacker') onUpdateDevice(d.id, { currentActivity: 'idle', isOnline: false, connectionType: 'disconnected' });
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner & Quick Action Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Laboratorio de Dispositivos Virtuales Conectados
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Conecta o desconecta clientes, cámbialos entre Wi-Fi y cable Ethernet, o simula descargas masivas para observar el comportamiento de la red.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={triggerSteamHeavyDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/50 text-amber-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Simular Descarga Masiva (180 Mbps)</span>
          </button>

          <button
            type="button"
            onClick={resetAllToNormal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Restablecer Actividades</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Dispositivo</span>
          </button>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => {
          return (
            <div
              key={device.id}
              className={`bg-slate-900 border rounded-xl p-4 shadow-xl space-y-3 transition-all ${
                device.isOnline
                  ? 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-800/50 opacity-60'
              }`}
            >
              {/* Device Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{device.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${device.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <span className="text-[11px] font-mono text-slate-400">
                        {device.isOnline ? device.ip : 'Sin conexión'}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  {device.mac}
                </span>
              </div>

              {/* Real-time metrics */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Bajada</span>
                  <span className="text-xs font-bold text-emerald-400">{device.currentDownloadMbps} <span className="text-[9px] font-normal text-slate-500">M</span></span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Subida</span>
                  <span className="text-xs font-bold text-sky-400">{device.currentUploadMbps} <span className="text-[9px] font-normal text-slate-500">M</span></span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Ping RTT</span>
                  <span className={`text-xs font-bold ${device.currentLatencyMs > 100 ? 'text-rose-400' : 'text-amber-400'}`}>
                    {device.isOnline ? `${device.currentLatencyMs}ms` : '—'}
                  </span>
                </div>
              </div>

              {/* Status Log / Inspection message */}
              <div className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-850">
                <span className="text-slate-500 font-mono text-[10px] block">Diagnóstico de Enlace:</span>
                <span className={device.isBlockedByParental || device.isBlockedByMac ? 'text-rose-400' : 'text-slate-300'}>
                  {device.statusLog}
                </span>
              </div>

              {/* Connection Type Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Medio de Conexión:
                </label>
                <select
                  value={device.connectionType}
                  onChange={(e) => {
                    const val = e.target.value as ConnectionType;
                    onUpdateDevice(device.id, {
                      connectionType: val,
                      isOnline: val !== 'disconnected'
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="ethernet_lan1">Cable Ethernet (Puerto LAN 1 Gigabit)</option>
                  <option value="ethernet_lan2">Cable Ethernet (Puerto LAN 2 Gigabit)</option>
                  <option value="ethernet_lan3">Cable Ethernet (Puerto LAN 3 Gigabit)</option>
                  <option value="ethernet_lan4">Cable Ethernet (Puerto LAN 4 Gigabit)</option>
                  <option value="wifi_5g">Wi-Fi 5 GHz ({config.wifi5Ssid})</option>
                  <option value="wifi_24g">Wi-Fi 2.4 GHz ({config.wifi24Ssid})</option>
                  <option value="wifi_guest">Wi-Fi Invitados ({config.guestWifiSsid})</option>
                  <option value="disconnected">Desconectar / Apagar interfaz</option>
                </select>
              </div>

              {/* Activity Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Actividad / Carga de Tráfico:
                </label>
                <select
                  value={device.currentActivity}
                  disabled={!device.isOnline}
                  onChange={(e) => onUpdateDevice(device.id, { currentActivity: e.target.value as DeviceActivity })}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 disabled:opacity-40"
                >
                  <option value="idle">En Reposo / Standby (0.1 Mbps)</option>
                  <option value="gaming">Partida Online / Valorant (12 Mbps, ultra sensible al ping)</option>
                  <option value="streaming_4k">Streaming 4K HDR Netflix/YouTube (25 Mbps)</option>
                  <option value="p2p_torrent">Descarga Masiva Torrent / Steam (180 Mbps)</option>
                  <option value="video_call">Videollamada Teams / Zoom (6 Mbps simétrico)</option>
                  <option value="web_browsing">Navegación Web & Redes Sociales (8 Mbps)</option>
                  <option value="iot_surveillance">Transmisión Cámara Vigilancia (4.5 Mbps subida)</option>
                  <option value="ddos_attack">Ataque SYN Flooding / DoS (Genera 80 Mbps de spam)</option>
                </select>
              </div>

              {/* Action footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    // Se reconecta por el mismo medio que tenía (el PC por cable no acaba en Wi-Fi)
                    if (device.connectionType === 'disconnected') {
                      onUpdateDevice(device.id, { connectionType: lastConnectionRef.current[device.id] || defaultConnectionFor(device.type) });
                    } else {
                      lastConnectionRef.current[device.id] = device.connectionType;
                      onUpdateDevice(device.id, { connectionType: 'disconnected' });
                    }
                  }}
                  className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  {device.connectionType !== 'disconnected' ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                  <span>{device.connectionType !== 'disconnected' ? 'Desconectar' : 'Conectar'}</span>
                </button>

                {device.type === 'custom' && (
                  <button
                    type="button"
                    onClick={() => onDeleteDevice(device.id)}
                    className="text-rose-400 hover:text-rose-300 text-[11px] cursor-pointer"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-200">
            <h3 className="text-base font-bold text-white">Añadir Nuevo Dispositivo Virtual</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nombre del Dispositivo:</label>
                <input
                  type="text"
                  placeholder="Ej. MacBook Pro, Consola PS5, Tablet"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Tipo de Dispositivo:</label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as DeviceType)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-white"
                >
                  <option value="pc_gamer">PC / Ordenador de Alto Rendimiento</option>
                  <option value="smartphone">Teléfono Smartphone</option>
                  <option value="smart_tv">Smart TV / Reproductor Multimedia</option>
                  <option value="laptop_work">Portátil Corporativo</option>
                  <option value="iot_camera">Dispositivo IoT / Domótica</option>
                  <option value="attacker">Dispositivo Sospechoso / Atacante</option>
                  <option value="custom">Genérico Personalizado</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Medio de Conexión Inicial:</label>
                <select
                  value={customConn}
                  onChange={(e) => setCustomConn(e.target.value as ConnectionType)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="wifi_5g">Wi-Fi 5 GHz</option>
                  <option value="wifi_24g">Wi-Fi 2.4 GHz</option>
                  <option value="wifi_guest">Wi-Fi Red de Invitados</option>
                  <option value="ethernet_lan1">Cable Ethernet LAN 1</option>
                  <option value="ethernet_lan2">Cable Ethernet LAN 2</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Dirección MAC (Opcional):</label>
                <input
                  type="text"
                  placeholder="Automática si se deja en blanco"
                  value={customMac}
                  onChange={(e) => setCustomMac(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateCustom}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Añadir al Laboratorio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
