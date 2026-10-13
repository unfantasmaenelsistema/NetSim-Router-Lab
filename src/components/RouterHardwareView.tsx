import React from 'react';
import { RouterConfig, VirtualDevice, NetworkTelemetry } from '../types/router';
import { Radio, Cpu, Network } from 'lucide-react';

interface Props {
  config: RouterConfig;
  devices: VirtualDevice[];
  telemetry: NetworkTelemetry;
  onReboot: () => void;
  onFactoryReset: () => void;
  isRebooting: boolean;
}

export const RouterHardwareView: React.FC<Props> = ({
  config,
  devices,
  telemetry,
  onReboot,
  onFactoryReset,
  isRebooting
}) => {
  const lan1Device = devices.find(d => d.connectionType === 'ethernet_lan1' && d.isOnline);
  const lan2Device = devices.find(d => d.connectionType === 'ethernet_lan2' && d.isOnline);
  const lan3Device = devices.find(d => d.connectionType === 'ethernet_lan3' && d.isOnline);
  const lan4Device = devices.find(d => d.connectionType === 'ethernet_lan4' && d.isOnline);

  const isTrafficActive = telemetry.totalDownloadMbps > 1 || telemetry.totalUploadMbps > 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg shadow-inner">
            <Radio className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-sky-400 uppercase tracking-wider">
                Unidad de Hardware Físico
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                {isRebooting ? 'REINICIANDO...' : 'EN LÍNEA (ONLINE)'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">{config.modelName}</h3>
            <p className="text-xs text-slate-400 font-mono">
              Firmware: {config.firmwareVersion} · MAC WAN: 00:90:A9:7B:44:01 · Gateway: {config.lanIp}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReboot}
            disabled={isRebooting}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {isRebooting ? 'Reiniciando...' : 'Reiniciar Router'}
          </button>
          <button
            type="button"
            onClick={onFactoryReset}
            disabled={isRebooting}
            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Restablecer de Fábrica
          </button>
        </div>
      </div>

      {/* Router Physical Chassis Render */}
      <div data-hardware-chassis="true" className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-black border-2 border-slate-800 rounded-2xl p-5 shadow-2xl overflow-hidden">
        {/* Antennas illustration */}
        <div className="flex justify-between px-8 mb-2">
          <div className="w-2.5 h-7 bg-slate-700 rounded-t-sm shadow-md border-t border-sky-500/50" />
          <div className="w-2.5 h-9 bg-slate-700 rounded-t-sm shadow-md border-t border-sky-500/50" />
          <div className="w-2.5 h-9 bg-slate-700 rounded-t-sm shadow-md border-t border-sky-500/50" />
          <div className="w-2.5 h-7 bg-slate-700 rounded-t-sm shadow-md border-t border-sky-500/50" />
        </div>

        {/* Chassis Top/Front Face */}
        <div className="bg-slate-900/90 border border-slate-750 rounded-xl p-4 shadow-inner">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400">
              <Network className="w-4 h-4 text-sky-400" />
              <span>NETSIM GIGABIT FIBER ARCHITECTURE</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              TEMP: 38°C · CPU: {telemetry.routerCpuPercent}% · RAM: {telemetry.routerRamPercent}%
            </div>
          </div>

          {/* LED Indicators Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 bg-black/40 p-3 rounded-lg border border-slate-800">
            {/* Power LED */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={`w-3 h-3 rounded-full shadow-lg ${
                  isRebooting
                    ? 'bg-amber-400 animate-pulse ring-4 ring-amber-400/20'
                    : 'bg-emerald-400 ring-4 ring-emerald-400/20'
                }`}
              />
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">Power</span>
            </div>

            {/* Internet / WAN LED */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={`w-3 h-3 rounded-full shadow-lg ${
                  isRebooting
                    ? 'bg-slate-600'
                    : isTrafficActive
                    ? 'bg-emerald-400 animate-ping'
                    : 'bg-emerald-400 ring-4 ring-emerald-400/20'
                }`}
              />
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">Internet</span>
            </div>

            {/* 2.4G Wi-Fi LED */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={`w-3 h-3 rounded-full shadow-lg ${
                  config.wifi24Enabled && !isRebooting
                    ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                    : 'bg-slate-700'
                }`}
              />
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">2.4G Wi-Fi</span>
            </div>

            {/* 5G Wi-Fi LED */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={`w-3 h-3 rounded-full shadow-lg ${
                  config.wifi5Enabled && !isRebooting
                    ? 'bg-sky-400 ring-4 ring-sky-400/20'
                    : 'bg-slate-700'
                }`}
              />
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">5G Wi-Fi</span>
            </div>

            {/* LAN 1 LED */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={`w-3 h-3 rounded-full shadow-lg ${
                  lan1Device && !isRebooting
                    ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                    : 'bg-slate-700'
                }`}
              />
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">LAN 1</span>
            </div>

            {/* LAN 2 LED */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={`w-3 h-3 rounded-full shadow-lg ${
                  lan2Device && !isRebooting
                    ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                    : 'bg-slate-700'
                }`}
              />
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">LAN 2</span>
            </div>

            {/* LAN 3 LED */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={`w-3 h-3 rounded-full shadow-lg ${
                  lan3Device && !isRebooting
                    ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                    : 'bg-slate-700'
                }`}
              />
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">LAN 3</span>
            </div>

            {/* WPS / Security LED */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={`w-3 h-3 rounded-full shadow-lg ${
                  config.wpsEnabled && !isRebooting
                    ? 'bg-amber-400 ring-4 ring-amber-400/20 animate-pulse'
                    : 'bg-slate-700'
                }`}
              />
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">WPS</span>
            </div>
          </div>
        </div>

        {/* Rear Panel / Ports Preview */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-mono text-[11px]">Panel Posterior (Puertos Físicos):</span>
            
            {/* WAN Port */}
            <div className="flex items-center gap-1.5 bg-blue-950/40 border border-blue-800/60 px-2 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="font-mono text-blue-300 font-semibold text-[11px]">WAN (ONT Fibra)</span>
              <span className="text-[10px] text-blue-400/80">1 Gbps</span>
            </div>

            {/* LAN Ports */}
            <div className="flex items-center gap-1.5">
              {[
                { port: 1, dev: lan1Device },
                { port: 2, dev: lan2Device },
                { port: 3, dev: lan3Device },
                { port: 4, dev: lan4Device }
              ].map(({ port, dev }) => (
                <div
                  key={port}
                  className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-mono ${
                    dev
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title={dev ? `Conectado: ${dev.name} (${dev.ip})` : `Puerto LAN ${port} libre`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dev ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span>LAN {port}</span>
                  {dev && <span className="text-[9px] text-emerald-400 hidden md:inline">({dev.name.slice(0, 8)})</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>CPU: {telemetry.routerCpuPercent}%</span>
            </div>
            <div>
              <span>RAM: {telemetry.routerRamPercent}%</span>
            </div>
            <div>
              <span>Sesiones NAT: {telemetry.activeSessionsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
