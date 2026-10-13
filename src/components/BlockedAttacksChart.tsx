import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ShieldCheck, ShieldAlert, BarChart3, AlertTriangle, Layers, Filter } from 'lucide-react';
import { RouterConfig } from '../types/router';

interface Props {
  config: RouterConfig;
  isExternalDosAttackActive: boolean;
}

export interface AttackDataPoint {
  time: string;
  portScans: number;
  dosPackets: number;
  bruteForce: number;
  wpsProbes: number;
  total: number;
}

// 24-hour baseline data sampled in 2-hour intervals
const BASELINE_24H_DATA: AttackDataPoint[] = [
  { time: '02:00', portScans: 42, dosPackets: 15, bruteForce: 12, wpsProbes: 4, total: 73 },
  { time: '04:00', portScans: 68, dosPackets: 28, bruteForce: 24, wpsProbes: 6, total: 126 },
  { time: '06:00', portScans: 55, dosPackets: 18, bruteForce: 16, wpsProbes: 3, total: 92 },
  { time: '08:00', portScans: 38, dosPackets: 12, bruteForce: 9, wpsProbes: 2, total: 61 },
  { time: '10:00', portScans: 48, dosPackets: 22, bruteForce: 14, wpsProbes: 5, total: 89 },
  { time: '12:00', portScans: 62, dosPackets: 35, bruteForce: 19, wpsProbes: 4, total: 120 },
  { time: '14:00', portScans: 58, dosPackets: 26, bruteForce: 15, wpsProbes: 3, total: 102 },
  { time: '16:00', portScans: 74, dosPackets: 40, bruteForce: 28, wpsProbes: 7, total: 149 },
  { time: '18:00', portScans: 89, dosPackets: 48, bruteForce: 32, wpsProbes: 8, total: 177 },
  { time: '20:00', portScans: 112, dosPackets: 65, bruteForce: 45, wpsProbes: 11, total: 233 },
  { time: '22:00', portScans: 95, dosPackets: 52, bruteForce: 38, wpsProbes: 9, total: 194 },
  { time: 'Ahora', portScans: 80, dosPackets: 44, bruteForce: 25, wpsProbes: 5, total: 154 }
];

export const BlockedAttacksChart: React.FC<Props> = ({ config, isExternalDosAttackActive }) => {
  const [chartMode, setChartMode] = useState<'stacked' | 'grouped'>('stacked');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'portScans' | 'dosPackets' | 'bruteForce' | 'wpsProbes'>('all');

  // Compute live data with dynamic adjustments if external DoS is ongoing
  const dynamicData = BASELINE_24H_DATA.map((item, idx) => {
    const isCurrent = idx === BASELINE_24H_DATA.length - 1;
    let dos = item.dosPackets;
    let scans = item.portScans;

    if (isCurrent && isExternalDosAttackActive) {
      if (config.dosProtectionEnabled && config.firewallSpiEnabled) {
        dos = 480; // Surge of blocked DoS packets
      } else {
        dos = 0; // Not blocked!
      }
    }

    if (!config.firewallSpiEnabled) {
      scans = 4; // Almost nothing blocked without SPI
    }

    return {
      ...item,
      portScans: scans,
      dosPackets: dos,
      total: scans + dos + item.bruteForce + item.wpsProbes
    };
  });

  const totalBlocked = dynamicData.reduce((sum, d) => sum + d.total, 0);
  const totalPortScans = dynamicData.reduce((sum, d) => sum + d.portScans, 0);
  const totalDos = dynamicData.reduce((sum, d) => sum + d.dosPackets, 0);
  const totalBruteForce = dynamicData.reduce((sum, d) => sum + d.bruteForce, 0);
  const totalWps = dynamicData.reduce((sum, d) => sum + d.wpsProbes, 0);

  // Custom Dark Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 font-sans min-w-[200px]">
          <div className="font-mono text-sky-400 font-bold border-b border-slate-800 pb-1 flex justify-between items-center">
            <span>Intervalo: {label}</span>
            <span className="text-slate-400 text-[10px]">Últimas 24h</span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-bold text-white">{entry.value}</span>
              </div>
            ))}
          </div>
          <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 italic">
            Paquetes descartados por reglas de firewall iptables/conntrack
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-rose-950/70 border border-rose-800/60 text-rose-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Histórico de Ataques Bloqueados por el Firewall (Últimas 24 Horas)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Registro visual del tráfico hostil y escaneos de Internet neutralizados por las reglas de Firewall SPI y mitigación DoS.
          </p>
        </div>

        {/* Chart View Modes */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setChartMode('stacked')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                chartMode === 'stacked'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Barras Apiladas</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('grouped')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                chartMode === 'grouped'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Barras Agrupadas</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Blocked */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 flex items-center justify-between mb-1">
            <span>Total Bloqueados (24h)</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {totalBlocked.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Efectividad: {config.firewallSpiEnabled ? '99.8%' : '12.4% (SPI OFF)'}
          </div>
        </div>

        {/* Port Scans */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 flex items-center justify-between mb-1">
            <span>Sondeos de Puertos</span>
            <span className="w-2 h-2 rounded-full bg-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-sky-400">
            {totalPortScans.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Shodan, Censys y Nmap
          </div>
        </div>

        {/* DoS Floods */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 flex items-center justify-between mb-1">
            <span>Inundaciones DoS</span>
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400">
            {totalDos.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            SYN Flood descartados
          </div>
        </div>

        {/* Brute Force / Exploits */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 flex items-center justify-between mb-1">
            <span>Fuerza Bruta & Exploits</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {totalBruteForce.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Puertos SMB (445) y RDP (3389)
          </div>
        </div>
      </div>

      {/* Firewall SPI Disabled Alert if relevant */}
      {!config.firewallSpiEnabled && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>
            <strong>¡Atención!</strong> El Firewall SPI está actualmente <strong>DESACTIVADO</strong> en el router. Las conexiones entrantes no solicitadas no están siendo filtradas y los escaneos de Internet pueden alcanzar a tus dispositivos.
          </span>
        </div>
      )}

      {/* Main Recharts Bar Chart */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dynamicData}
              margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                formatter={(value) => <span className="text-slate-300 font-sans">{value}</span>}
              />

              <Bar
                dataKey="portScans"
                name="Sondeos de Puertos (Nmap / Shodan)"
                fill="#38bdf8"
                stackId={chartMode === 'stacked' ? 'a' : undefined}
                radius={chartMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              />

              <Bar
                dataKey="dosPackets"
                name="Inundaciones DoS / SYN Flood"
                fill="#f43f5e"
                stackId={chartMode === 'stacked' ? 'a' : undefined}
                radius={chartMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              />

              <Bar
                dataKey="bruteForce"
                name="Intentos de Fuerza Bruta (SMB / RDP)"
                fill="#fbbf24"
                stackId={chartMode === 'stacked' ? 'a' : undefined}
                radius={chartMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              />

              <Bar
                dataKey="wpsProbes"
                name="Sondas WPS / Wi-Fi"
                fill="#a855f7"
                stackId={chartMode === 'stacked' ? 'a' : undefined}
                radius={chartMode === 'stacked' ? [4, 4, 0, 0] : [4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Didactic Footer Note */}
        <div className="mt-3 pt-3 border-t border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>
              <strong>¿Por qué hay ataques si nadie conoce mi IP?</strong> En Internet existen botnets y escáneres masivos que barren rangos IPv4 completos cada pocos minutos.
            </span>
          </div>
          <span className="font-mono text-slate-500 text-[10px]">
            Hora pico: 20:00 (233 amenazas)
          </span>
        </div>
      </div>
    </div>
  );
};
