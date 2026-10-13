import React, { useState, useEffect } from 'react';
import { RouterConfig, VirtualDevice } from '../types/router';
import { Play, Pause, Trash2, Filter, Layers, Lock, Unlock, Eye, Sparkles, Network } from 'lucide-react';

interface Props {
  config: RouterConfig;
  devices: VirtualDevice[];
  onOpenTopic: (topicId: string) => void;
}

export interface SniffedPacket {
  id: number;
  time: string;
  srcMac: string;
  dstMac: string;
  srcIp: string;
  dstIp: string;
  srcPort?: number;
  dstPort?: number;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'DNS' | 'DHCP' | 'ARP' | 'TLS';
  length: number;
  flags?: string;
  info: string;
  payloadCleartext?: string;
  payloadEncrypted?: string;
  isEncryptedInTransit: boolean;
}

export const PacketSnifferView: React.FC<Props> = ({ config, devices, onOpenTopic }) => {
  const [isCapturing, setIsCapturing] = useState<boolean>(true);
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [selectedPacket, setSelectedPacket] = useState<SniffedPacket | null>(null);

  // Initial stream of packets
  const [packets, setPackets] = useState<SniffedPacket[]>([
    {
      id: 1,
      time: '0.0012',
      srcMac: '00:1A:2B:3C:4D:5E',
      dstMac: '00:90:A9:7B:44:01',
      srcIp: '192.168.1.50',
      dstIp: '1.1.1.1',
      srcPort: 54122,
      dstPort: 53,
      protocol: 'DNS',
      length: 74,
      info: 'Standard query 0x1a4f A api.riotgames.com',
      payloadCleartext: 'DNS Query: api.riotgames.com Type: A Class: IN',
      payloadEncrypted: 'a4 b8 99 c1 0e 12 33 4a ff 89',
      isEncryptedInTransit: config.wifi24Security !== 'none'
    },
    {
      id: 2,
      time: '0.0154',
      srcMac: '00:90:A9:7B:44:01',
      dstMac: '00:1A:2B:3C:4D:5E',
      srcIp: '1.1.1.1',
      dstIp: '192.168.1.50',
      srcPort: 53,
      dstPort: 54122,
      protocol: 'DNS',
      length: 90,
      info: 'Standard query response 0x1a4f A 104.18.22.41',
      payloadCleartext: 'DNS Answer: api.riotgames.com -> 104.18.22.41 (TTL: 300)',
      payloadEncrypted: '3f 99 21 a0 be cc dd 41 90 22',
      isEncryptedInTransit: config.wifi24Security !== 'none'
    },
    {
      id: 3,
      time: '0.0340',
      srcMac: '00:1A:2B:3C:4D:5E',
      dstMac: '00:90:A9:7B:44:01',
      srcIp: '192.168.1.50',
      dstIp: '104.18.22.41',
      srcPort: 49210,
      dstPort: 443,
      protocol: 'TCP',
      length: 66,
      flags: '[SYN]',
      info: '49210 -> 443 [SYN] Seq=0 Win=64240 Len=0 MSS=1460',
      payloadCleartext: 'TCP Handshake: SYN Flag activo (Iniciando conexión)',
      payloadEncrypted: 'c8 11 92 40 bb aa fe 10',
      isEncryptedInTransit: config.wifi24Security !== 'none'
    },
    {
      id: 4,
      time: '0.0521',
      srcMac: '00:90:A9:7B:44:01',
      dstMac: '00:1A:2B:3C:4D:5E',
      srcIp: '104.18.22.41',
      dstIp: '192.168.1.50',
      srcPort: 443,
      dstPort: 49210,
      protocol: 'TCP',
      length: 66,
      flags: '[SYN, ACK]',
      info: '443 -> 49210 [SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0',
      payloadCleartext: 'TCP Handshake: Servidor remoto acepta conexión [SYN, ACK]',
      payloadEncrypted: 'ee 44 28 90 a1 b2 33',
      isEncryptedInTransit: config.wifi24Security !== 'none'
    },
    {
      id: 5,
      time: '0.0812',
      srcMac: '68:C6:3A:89:12:44',
      dstMac: '00:90:A9:7B:44:01',
      srcIp: '192.168.1.101',
      dstIp: '198.51.100.12',
      srcPort: 51200,
      dstPort: 443,
      protocol: 'TLS',
      length: 517,
      info: 'Client Hello, TLS 1.3, SNI: netflix.com',
      payloadCleartext: 'TLS Handshake: Client Hello (SNI: netflix.com)',
      payloadEncrypted: 'd4 50 e8 91 22 4a ff c0 88 12 34 56',
      isEncryptedInTransit: config.wifi5Security !== 'none'
    }
  ]);

  // Real-time generator of live packets when capturing is active
  useEffect(() => {
    if (!isCapturing) return;

    const interval = setInterval(() => {
      const activeDev = devices.filter(d => d.isOnline)[Math.floor(Math.random() * devices.filter(d => d.isOnline).length)] || devices[0];
      const protoList: SniffedPacket['protocol'][] = ['TCP', 'UDP', 'DNS', 'TLS', 'ICMP'];
      const pickedProto = protoList[Math.floor(Math.random() * protoList.length)];
      const id = Date.now() % 10000;
      const isWifi = activeDev.connectionType.startsWith('wifi');
      const isSecured = isWifi ? (config.wifi5Security !== 'none' && config.wifi24Security !== 'none') : true;

      const newPkt: SniffedPacket = {
        id,
        time: (Math.random() * 2).toFixed(4),
        srcMac: activeDev.mac,
        dstMac: '00:90:A9:7B:44:01',
        srcIp: activeDev.ip,
        dstIp: pickedProto === 'DNS' ? config.wanPrimaryDns : '142.250.200.14',
        srcPort: Math.floor(Math.random() * 20000 + 40000),
        dstPort: pickedProto === 'DNS' ? 53 : pickedProto === 'TLS' ? 443 : 80,
        protocol: pickedProto,
        length: Math.floor(Math.random() * 800 + 60),
        info: pickedProto === 'DNS'
          ? 'DNS Query A google.com'
          : pickedProto === 'TLS'
          ? 'Application Data TLSv1.3 (Stream cifrado)'
          : `TCP Traffic Len=${Math.floor(Math.random() * 500)}`,
        payloadCleartext: `Payload datos de ${activeDev.name} (${activeDev.currentActivity})`,
        payloadEncrypted: 'e3 f1 99 c4 12 a0 be 45 88 71',
        isEncryptedInTransit: isSecured
      };

      setPackets(prev => [newPkt, ...prev.slice(0, 35)]);
    }, 1400);

    return () => clearInterval(interval);
  }, [isCapturing, devices, config]);

  const filteredPackets = packets.filter(p => {
    if (protocolFilter === 'all') return true;
    return p.protocol.toLowerCase() === protocolFilter.toLowerCase();
  });

  const getProtocolColor = (proto: SniffedPacket['protocol']) => {
    switch (proto) {
      case 'DNS':
        return 'bg-cyan-950 text-cyan-400 border-cyan-800';
      case 'TLS':
        return 'bg-purple-950 text-purple-400 border-purple-800';
      case 'TCP':
        return 'bg-sky-950 text-sky-400 border-sky-800';
      case 'UDP':
        return 'bg-indigo-950 text-indigo-400 border-indigo-800';
      case 'ICMP':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'DHCP':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'ARP':
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-indigo-950/70 border border-indigo-800/60 text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Inspector de Paquetes en Vivo (Simulador Mini-Wireshark)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Analiza el tráfico en tiempo real capa por capa (Modelo OSI) y observa la diferencia entre tráfico cifrado y texto plano.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCapturing(!isCapturing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              isCapturing
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isCapturing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isCapturing ? 'Pausar Captura' : 'Reanudar Captura'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPackets([]);
              setSelectedPacket(null);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Limpiar paquetes capturados"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs bg-slate-950 p-2 rounded-lg border border-slate-800 no-scrollbar">
        <span className="text-slate-500 font-mono text-[11px] mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filtro:
        </span>
        {['all', 'TCP', 'UDP', 'DNS', 'TLS', 'ICMP', 'DHCP'].map((proto) => (
          <button
            key={proto}
            type="button"
            onClick={() => setProtocolFilter(proto)}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
              protocolFilter.toLowerCase() === proto.toLowerCase()
                ? 'bg-sky-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {proto.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Packet Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
        <div className="overflow-x-auto max-h-64 overflow-y-auto font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase tracking-wider sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">No.</th>
                <th className="py-2 px-3">Tiempo</th>
                <th className="py-2 px-3">Origen (Src)</th>
                <th className="py-2 px-3">Destino (Dst)</th>
                <th className="py-2 px-3">Protocolo</th>
                <th className="py-2 px-3">Longitud</th>
                <th className="py-2 px-3">Información del Paquete</th>
                <th className="py-2 px-3 text-right">Cifrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredPackets.map((pkt) => {
                const isSelected = selectedPacket?.id === pkt.id;
                return (
                  <tr
                    key={pkt.id}
                    onClick={() => setSelectedPacket(pkt)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-950/70 text-white font-semibold'
                        : 'hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <td className="py-1.5 px-3 text-slate-500">{pkt.id}</td>
                    <td className="py-1.5 px-3 text-slate-400">{pkt.time}s</td>
                    <td className="py-1.5 px-3 text-emerald-400">{pkt.srcIp}</td>
                    <td className="py-1.5 px-3 text-sky-400">{pkt.dstIp}</td>
                    <td className="py-1.5 px-3">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] border ${getProtocolColor(pkt.protocol)}`}>
                        {pkt.protocol}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-400">{pkt.length} B</td>
                    <td className="py-1.5 px-3 text-slate-300 truncate max-w-xs">{pkt.info}</td>
                    <td className="py-1.5 px-3 text-right">
                      {pkt.isEncryptedInTransit ? (
                        <span className="text-emerald-400 text-[10px] flex items-center justify-end gap-1 font-sans">
                          <Lock className="w-3 h-3" /> WPA2/3
                        </span>
                      ) : (
                        <span className="text-rose-400 text-[10px] flex items-center justify-end gap-1 font-sans font-bold">
                          <Unlock className="w-3 h-3" /> Abierto
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packet Inspection Deep Dive Panel */}
      {selectedPacket ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Desglose de Capas OSI — Paquete #{selectedPacket.id} ({selectedPacket.protocol})
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onOpenTopic('wifi_security_mode')}
              className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer"
            >
              ¿Cómo protege el cifrado WPA3? →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Capa 2: Enlace */}
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
              <span className="text-sky-400 font-bold block uppercase text-[10px]">
                Capa 2: Enlace de Datos (Ethernet II)
              </span>
              <div className="text-slate-300">MAC Origen: <span className="text-emerald-400">{selectedPacket.srcMac}</span></div>
              <div className="text-slate-300">MAC Destino: <span className="text-sky-400">{selectedPacket.dstMac}</span></div>
              <div className="text-slate-400 text-[10px]">EtherType: 0x0800 (IPv4)</div>
            </div>

            {/* Capa 3: Red */}
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
              <span className="text-emerald-400 font-bold block uppercase text-[10px]">
                Capa 3: Red (Protocolo IPv4)
              </span>
              <div className="text-slate-300">IP Origen: <span className="text-emerald-400">{selectedPacket.srcIp}</span></div>
              <div className="text-slate-300">IP Destino: <span className="text-sky-400">{selectedPacket.dstIp}</span></div>
              <div className="text-slate-400 text-[10px]">TTL: 64 · Protocolo: {selectedPacket.protocol}</div>
            </div>

            {/* Capa 4: Transporte */}
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
              <span className="text-amber-400 font-bold block uppercase text-[10px]">
                Capa 4: Transporte ({selectedPacket.protocol})
              </span>
              <div className="text-slate-300">Puerto Origen: <span className="text-amber-400">{selectedPacket.srcPort || '—'}</span></div>
              <div className="text-slate-300">Puerto Destino: <span className="text-amber-400">{selectedPacket.dstPort || '—'}</span></div>
              <div className="text-slate-400 text-[10px]">Flags: {selectedPacket.flags || 'Normal'}</div>
            </div>
          </div>

          {/* Wi-Fi In-Flight Security Comparison */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              ¿Qué ve un intruso si intercepta este paquete en el aire?
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded bg-black/70 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Con Wi-Fi Protegido (WPA2/WPA3):
                </span>
                <p className="font-mono text-[11px] text-slate-400 break-all select-all">
                  {selectedPacket.payloadEncrypted}
                </p>
                <p className="text-[10px] text-slate-500">Cifrado AES-CCMP de 128/192 bits: Imposible de leer sin la clave.</p>
              </div>

              <div className="p-2.5 rounded bg-black/70 border border-rose-900/50 space-y-1">
                <span className="text-[10px] font-mono text-rose-400 font-bold flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> Si la Red Wi-Fi fuera Abierta:
                </span>
                <p className="font-mono text-[11px] text-rose-300">
                  {selectedPacket.payloadCleartext || selectedPacket.info}
                </p>
                <p className="text-[10px] text-rose-400/80">Texto en claro: Cualquier atacante cercano puede leer contraseñas y webs visitadas.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 text-center text-xs text-slate-500 font-mono italic bg-slate-950 border border-slate-800 rounded-lg">
          Haz clic en cualquier paquete de la tabla superior para desglosarlo en sus 4 capas del modelo OSI.
        </div>
      )}
    </div>
  );
};
