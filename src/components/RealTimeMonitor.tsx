import React, { useState } from 'react';
import { NetworkTelemetry, VirtualDevice, RouterConfig } from '../types/router';
import { Activity, ArrowDown, ArrowUp, Clock, AlertOctagon } from 'lucide-react';

interface Props {
  telemetryHistory: NetworkTelemetry[];
  currentTelemetry: NetworkTelemetry;
  devices: VirtualDevice[];
  config: RouterConfig;
}

export const RealTimeMonitor: React.FC<Props> = ({
  telemetryHistory,
  currentTelemetry,
  devices,
  config
}) => {
  const [activeMetricTab, setActiveMetricTab] = useState<'bandwidth' | 'latency' | 'devices'>('bandwidth');

  // Chart dimensions
  const chartHeight = 140;
  const chartWidth = 520;
  const historySlice = telemetryHistory.slice(-25);

  // Bandwidth calculation
  const maxDown = Math.max(10, ...historySlice.map(h => h.totalDownloadMbps), config.qosTotalDownlinkMbps * 0.5);
  const maxLat = Math.max(50, ...historySlice.map(h => h.averageLatencyMs));

  const generatePoints = (getter: (t: NetworkTelemetry) => number, maxVal: number) => {
    if (historySlice.length === 0) return '';
    return historySlice
      .map((item, idx) => {
        const x = (idx / (Math.max(1, historySlice.length - 1))) * chartWidth;
        const val = getter(item);
        const y = chartHeight - (val / (maxVal || 1)) * (chartHeight - 16);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const downPoints = generatePoints(t => t.totalDownloadMbps, maxDown);
  const upPoints = generatePoints(t => t.totalUploadMbps, maxDown);
  const latPoints = generatePoints(t => t.averageLatencyMs, maxLat);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-200 space-y-4">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-sky-400 animate-pulse" />
          <h3 className="text-base font-bold text-white tracking-tight">
            Telemetría y Monitor en Tiempo Real
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-mono">
            Muestreo 800ms
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveMetricTab('bandwidth')}
            className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
              activeMetricTab === 'bandwidth'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ancho de Banda (Mbps)
          </button>
          <button
            type="button"
            onClick={() => setActiveMetricTab('latency')}
            className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
              activeMetricTab === 'latency'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Latencia / Ping (ms)
          </button>
          <button
            type="button"
            onClick={() => setActiveMetricTab('devices')}
            className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
              activeMetricTab === 'devices'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Consumo por Dispositivo
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Download */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <ArrowDown className="w-3.5 h-3.5 text-emerald-400" /> Tráfico Bajada
            </span>
            <span className="text-[10px] font-mono text-emerald-400/80">WAN</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {currentTelemetry.totalDownloadMbps} <span className="text-xs text-slate-400">Mbps</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Límite: {config.qosTotalDownlinkMbps} Mbps
          </div>
        </div>

        {/* Upload */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3.5 h-3.5 text-sky-400" /> Tráfico Subida
            </span>
            <span className="text-[10px] font-mono text-sky-400/80">WAN</span>
          </div>
          <div className="text-xl font-bold font-mono text-sky-400">
            {currentTelemetry.totalUploadMbps} <span className="text-xs text-slate-400">Mbps</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Límite: {config.qosTotalUplinkMbps} Mbps
          </div>
        </div>

        {/* Latency */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Ping Promedio
            </span>
            <span className={`text-[10px] font-mono ${
              currentTelemetry.averageLatencyMs > 100 ? 'text-rose-400' : 'text-slate-400'
            }`}>
              {currentTelemetry.averageLatencyMs > 100 ? '¡LAG / BUFFERBLOAT!' : 'Óptimo'}
            </span>
          </div>
          <div className={`text-xl font-bold font-mono ${
            currentTelemetry.averageLatencyMs > 100 ? 'text-rose-400' : 'text-amber-400'
          }`}>
            {currentTelemetry.averageLatencyMs} <span className="text-xs text-slate-400">ms</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Pico máx: {currentTelemetry.maxLatencyMs} ms
          </div>
        </div>

        {/* Packet loss / Health */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5 text-indigo-400" /> Pérdida Paquetes
            </span>
            <span className="text-[10px] font-mono text-slate-400">Buffer state</span>
          </div>
          <div className={`text-xl font-bold font-mono ${
            currentTelemetry.packetLossPercent > 5 ? 'text-rose-400' : 'text-indigo-400'
          }`}>
            {currentTelemetry.packetLossPercent}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Sesiones activas: {currentTelemetry.activeSessionsCount}
          </div>
        </div>
      </div>

      {/* Main Graph Area */}
      {activeMetricTab === 'bandwidth' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs mb-3 font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
                <span className="text-emerald-400">Descarga ({currentTelemetry.totalDownloadMbps} Mbps)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-sky-400 inline-block" />
                <span className="text-sky-400">Subida ({currentTelemetry.totalUploadMbps} Mbps)</span>
              </div>
            </div>
            <span>Escala máx: {Math.round(maxDown)} Mbps</span>
          </div>

          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-36 bg-slate-900/50 rounded-lg"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              <line x1="0" y1="35" x2={chartWidth} y2="35" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2={chartWidth} y2="70" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="105" x2={chartWidth} y2="105" stroke="#1e293b" strokeDasharray="3 3" />

              {/* Download line */}
              {downPoints && (
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={downPoints}
                />
              )}

              {/* Upload line */}
              {upPoints && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 2"
                  points={upPoints}
                />
              )}
            </svg>
          </div>
        </div>
      )}

      {activeMetricTab === 'latency' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs mb-3 font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-amber-400 inline-block" />
              <span className="text-amber-400">Ping RTT Promedio ({currentTelemetry.averageLatencyMs} ms)</span>
            </div>
            <span>Escala máx: {Math.round(maxLat)} ms</span>
          </div>

          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-36 bg-slate-900/50 rounded-lg"
              preserveAspectRatio="none"
            >
              {/* Lag threshold line at 100ms */}
              <line x1="0" y1="50" x2={chartWidth} y2="50" stroke="#ef4444" strokeDasharray="2 2" strokeOpacity="0.4" />
              <text x="6" y="46" fill="#ef4444" fontSize="9" opacity="0.7" fontFamily="monospace">
                Zona de Bufferbloat / Lag (&gt;100ms)
              </text>

              {/* Latency line */}
              {latPoints && (
                <polyline
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={latPoints}
                />
              )}
            </svg>
          </div>
        </div>
      )}

      {activeMetricTab === 'devices' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Dispositivos Conectados y Demanda Actual</span>
            <span>Total: {devices.filter(d => d.isOnline).length} en línea</span>
          </div>

          <div className="space-y-2.5">
            {devices.map(device => {
              const downPercent = Math.min(100, (device.currentDownloadMbps / (config.qosTotalDownlinkMbps || 300)) * 100);
              return (
                <div key={device.id} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${device.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <span className="font-semibold text-white">{device.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{device.ip}</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300">
                      <span className="text-emerald-400">{device.currentDownloadMbps} Mbps ↓</span> ·{' '}
                      <span className="text-sky-400">{device.currentUploadMbps} Mbps ↑</span> ·{' '}
                      <span className={device.currentLatencyMs > 80 ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                        {device.currentLatencyMs} ms
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(2, downPercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
