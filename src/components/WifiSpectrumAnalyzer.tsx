import React, { useState } from 'react';
import { RouterConfig } from '../types/router';
import { Radio, Signal, HelpCircle, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface Props {
  config: RouterConfig;
  onUpdateConfig: (newConfig: Partial<RouterConfig>) => void;
  onOpenTopic: (topicId: string) => void;
}

export const WifiSpectrumAnalyzer: React.FC<Props> = ({ config, onUpdateConfig, onOpenTopic }) => {
  const [selectedBand, setSelectedBand] = useState<'2.4G' | '5G'>('2.4G');

  // 2.4GHz interference calculation
  const is24Width40 = config.wifi24ChannelWidth === 40;
  const isNonOverlapping24 = config.wifi24Channel === 1 || config.wifi24Channel === 6 || config.wifi24Channel === 11;
  const interferenceScore24 = is24Width40 ? 85 : (!isNonOverlapping24 ? 65 : 18);

  // 5GHz interference calculation
  const is5GHzOptimal = config.wifi5ChannelWidth === 80;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-sky-950/70 border border-sky-800/60 text-sky-400">
              <Signal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Analizador Gráfico de Espectro Wi-Fi & Solapamiento de Canales
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Visualiza las curvas de emisión electromagnética y comprende por qué se producen colisiones de radio con las redes vecinas.
          </p>
        </div>

        {/* Band Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setSelectedBand('2.4G')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              selectedBand === '2.4G'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Banda 2.4 GHz (13 Canales)
          </button>
          <button
            type="button"
            onClick={() => setSelectedBand('5G')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              selectedBand === '5G'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Banda 5 GHz (Canales UNII)
          </button>
        </div>
      </div>

      {/* 2.4 GHz Spectrum View */}
      {selectedBand === '2.4G' && (
        <div className="space-y-4">
          {/* Status strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-500 font-mono text-[10px] block">Canal Configurado:</span>
              <span className="text-base font-bold text-white font-mono">
                Canal {config.wifi24Channel} ({config.wifi24ChannelWidth} MHz)
              </span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-500 font-mono text-[10px] block">Tipo de Canal:</span>
              <span className={`text-base font-bold font-mono ${isNonOverlapping24 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isNonOverlapping24 ? 'No Solapado (Limpio)' : 'Solapado (Interferencia)'}
              </span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-500 font-mono text-[10px] block">Nivel de Interferencia:</span>
              <span className={`text-base font-bold font-mono ${interferenceScore24 > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {interferenceScore24}% ({interferenceScore24 > 50 ? 'Severo' : 'Óptimo'})
              </span>
            </div>
          </div>

          {/* SVG Spectrum Curve Visualizer (2.4 GHz) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span>Espectro 2.412 GHz – 2.472 GHz</span>
              <span className="text-emerald-400 font-semibold">Tu Red: "{config.wifi24Ssid}"</span>
            </div>

            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 650 180" className="w-full h-44 bg-slate-900/40 rounded-lg min-w-[500px]">
                {/* Channel scale lines */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(ch => {
                  const x = 35 + (ch - 1) * 45;
                  const isSafe = ch === 1 || ch === 6 || ch === 11;
                  return (
                    <g key={ch}>
                      <line x1={x} y1={20} x2={x} y2={150} stroke="#1e293b" strokeDasharray="2 2" />
                      <text x={x} y={165} fill={isSafe ? '#38bdf8' : '#64748b'} fontSize="10" textAnchor="middle" fontFamily="monospace">
                        Ch {ch}
                      </text>
                    </g>
                  );
                })}

                {/* Neighbor 1 (Ch 1) */}
                <path
                  d="M 0 150 Q 35 70 70 150 Z"
                  fill="#64748b"
                  fillOpacity="0.15"
                  stroke="#64748b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <text x="35" y="85" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  Vecino_Piso2
                </text>

                {/* Neighbor 2 (Ch 6) */}
                <path
                  d="M 225 150 Q 260 60 295 150 Z"
                  fill="#64748b"
                  fillOpacity="0.15"
                  stroke="#64748b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <text x="260" y="75" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  MOVISTAR_6A
                </text>

                {/* Neighbor 3 (Ch 11) */}
                <path
                  d="M 450 150 Q 485 65 520 150 Z"
                  fill="#64748b"
                  fillOpacity="0.15"
                  stroke="#64748b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <text x="485" y="80" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  Vodafone_WiFi
                </text>

                {/* User Router WiFi Curve (Active) */}
                {(() => {
                  const chX = 35 + (config.wifi24Channel - 1) * 45;
                  const spread = is24Width40 ? 80 : 45;
                  const leftX = Math.max(0, chX - spread);
                  const rightX = Math.min(640, chX + spread);
                  return (
                    <g>
                      <path
                        d={`M ${leftX} 150 Q ${chX} 35 ${rightX} 150 Z`}
                        fill="#0284c7"
                        fillOpacity="0.45"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                      />
                      <text x={chX} y={28} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        ★ {config.wifi24Ssid} ({config.wifi24ChannelWidth} MHz)
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Didactic Tip */}
            <div className="p-3 bg-sky-950/20 border border-sky-800/40 rounded-lg text-xs text-sky-300 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-sky-400">
                <Sparkles className="w-3.5 h-3.5" /> La Regla de Oro de los Canales 1, 6 y 11:
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">
                En la banda de 2.4 GHz cada canal tiene 22 MHz de ancho pero están separados por solo 5 MHz. Por tanto, elegir canales intermedios como el 3 o el 8 sufre interferencia de ambos lados. <strong>Usa siempre los canales 1, 6 u 11 con 20 MHz de ancho</strong> para obtener la señal más limpia.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5 GHz Spectrum View */}
      {selectedBand === '5G' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-500 font-mono text-[10px] block">Canal 5 GHz:</span>
              <span className="text-base font-bold text-white font-mono">
                Canal {config.wifi5Channel} ({config.wifi5ChannelWidth} MHz)
              </span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-500 font-mono text-[10px] block">Capacidad Teórica:</span>
              <span className="text-base font-bold text-sky-400 font-mono">
                {config.wifi5ChannelWidth === 160 ? '2400 Mbps (Wi-Fi 6)' : config.wifi5ChannelWidth === 80 ? '1200 Mbps' : '600 Mbps'}
              </span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-500 font-mono text-[10px] block">Saturación del Espectro:</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                Mínima (Banda Limpia)
              </span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span>Espectro 5.180 GHz – 5.825 GHz (Banda UNII-1 a UNII-3)</span>
              <span className="text-sky-400 font-semibold">Tu Red: "{config.wifi5Ssid}"</span>
            </div>

            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 650 160" className="w-full h-40 bg-slate-900/40 rounded-lg min-w-[500px]">
                {/* 5GHz Channels blocks */}
                {[
                  { ch: 36, x: 50, name: 'Ch 36' },
                  { ch: 40, x: 100, name: 'Ch 40' },
                  { ch: 44, x: 150, name: 'Ch 44' },
                  { ch: 48, x: 200, name: 'Ch 48' },
                  { ch: 52, x: 270, name: 'Ch 52 (DFS)' },
                  { ch: 100, x: 380, name: 'Ch 100 (DFS)' },
                  { ch: 149, x: 520, name: 'Ch 149' },
                  { ch: 161, x: 590, name: 'Ch 161' }
                ].map((item, idx) => (
                  <g key={idx}>
                    <rect x={item.x - 20} y={110} width="40" height="25" fill="#1e293b" rx="3" />
                    <text x={item.x} y={126} fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                      {item.ch}
                    </text>
                  </g>
                ))}

                {/* 80 MHz Channel Bonding Block */}
                <rect x="25" y="55" width="200" height="45" fill="#0369a1" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="2" rx="6" />
                <text x="125" y="82" fill="#e0f2fe" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {config.wifi5Ssid} (Canal {config.wifi5Channel} · {config.wifi5ChannelWidth} MHz)
                </text>
              </svg>
            </div>

            <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-xs text-emerald-300 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ventaja de la banda 5 GHz:
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">
                A diferencia de 2.4 GHz, en 5 GHz los canales no se solapan individualmente y se pueden agrupar en bloques de <strong>80 MHz o 160 MHz</strong> para transmitir a más de 1 Gbps con latencias inferiores a 3ms.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
