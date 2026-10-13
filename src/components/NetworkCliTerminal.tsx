import React, { useState, useRef, useEffect } from 'react';
import { RouterConfig, VirtualDevice, NetworkTelemetry } from '../types/router';
import { Terminal, Send } from 'lucide-react';
import { autocomplete, executeCli, ROUTER_CONSOLE_ID } from '../simulation/cliEngine';

interface Props {
  config: RouterConfig;
  devices: VirtualDevice[];
  telemetry: NetworkTelemetry;
  isRebooting: boolean;
  onReboot: () => void;
  onOpenTopic: (topicId: string) => void;
}

interface CommandHistoryItem {
  id: string;
  command: string;
  prompt: string;
  output: string[];
  timestamp: string;
  isError?: boolean;
}

interface QuickCommand {
  cmd: string;
  color: string;
  title?: string;
}

const CLIENT_QUICK_COMMANDS: QuickCommand[] = [
  { cmd: 'ping gateway', color: 'text-sky-300' },
  { cmd: 'ping 8.8.8.8', color: 'text-sky-300' },
  { cmd: 'traceroute 8.8.8.8', color: 'text-indigo-300' },
  { cmd: 'nslookup google.com', color: 'text-emerald-300' },
  { cmd: 'nslookup tiktok.com', color: 'text-amber-300', title: 'Prueba de Control Parental' },
  { cmd: 'arp -a', color: 'text-purple-300' },
  { cmd: 'ipconfig', color: 'text-slate-300' }
];

const ROUTER_QUICK_COMMANDS: QuickCommand[] = [
  { cmd: 'show ip interface brief', color: 'text-sky-300' },
  { cmd: 'show dhcp leases', color: 'text-emerald-300' },
  { cmd: 'iptables -L -n -v', color: 'text-rose-300' },
  { cmd: 'iptables -t nat -L -n -v', color: 'text-amber-300' },
  { cmd: 'netstat -tuln', color: 'text-indigo-300' },
  { cmd: 'wifi-status', color: 'text-purple-300' },
  { cmd: 'show arp', color: 'text-slate-300' }
];

function promptFor(device: VirtualDevice | null, config: RouterConfig): string {
  if (!device) return `${config.modelName.split(' ').slice(0, 2).join('-')}#`;
  return `usuario@${device.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}:~$`;
}

export const NetworkCliTerminal: React.FC<Props> = ({
  config,
  devices,
  telemetry,
  isRebooting,
  onReboot
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('dev-pc-gamer');
  const [inputCommand, setInputCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [terminalOutput, setTerminalOutput] = useState<CommandHistoryItem[]>([
    {
      id: 'init-1',
      command: 'system-banner',
      prompt: '',
      output: [
        '==============================================================',
        '   NETSIM INTERACTIVE NETWORK CLI',
        '   Consola de diagnóstico de red y resolución de problemas.',
        '   Escribe "help" para ver los comandos disponibles.',
        '   Elige "Consola del Router" para comandos de administración.',
        '=============================================================='
      ],
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isRouterConsole = selectedDeviceId === ROUTER_CONSOLE_ID;
  // Si el equipo seleccionado se elimina del laboratorio, volvemos a la consola del router
  const selectedDevice = isRouterConsole ? null : devices.find(d => d.id === selectedDeviceId) || null;
  const effectiveRouter = isRouterConsole || !selectedDevice;
  const prompt = promptFor(effectiveRouter ? null : selectedDevice, config);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [terminalOutput]);

  const appendOutput = (command: string, output: string[], isError?: boolean) => {
    setTerminalOutput(prev => [
      ...prev,
      {
        id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        command,
        prompt,
        output,
        timestamp: new Date().toLocaleTimeString(),
        isError
      }
    ]);
  };

  const handleExecuteCommand = (cmdToRun?: string) => {
    const rawCmd = (cmdToRun !== undefined ? cmdToRun : inputCommand).trim();
    if (!rawCmd) return;

    setCommandHistory(prev => [rawCmd, ...prev]);
    setHistoryIndex(-1);
    setInputCommand('');

    const result = executeCli(rawCmd, {
      config,
      devices,
      telemetry,
      isRebooting,
      source: effectiveRouter ? null : selectedDevice
    });

    if (result.action === 'clear') {
      setTerminalOutput([]);
      return;
    }
    appendOutput(rawCmd, result.lines, result.isError);
    if (result.action === 'reboot') onReboot();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleExecuteCommand();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const { completed, candidates } = autocomplete(inputCommand, effectiveRouter);
      if (completed) setInputCommand(completed);
      if (!completed && candidates.length > 1) appendOutput(inputCommand, [candidates.join('    ')]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = Math.min(commandHistory.length - 1, historyIndex + 1);
        setHistoryIndex(nextIdx);
        setInputCommand(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputCommand(commandHistory[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputCommand('');
      }
    }
  };

  const quickCommands = effectiveRouter ? ROUTER_QUICK_COMMANDS : CLIENT_QUICK_COMMANDS;

  return (
    <div data-terminal-container="true" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header and Device Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-sky-950/70 border border-sky-800/60 text-sky-400">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Terminal Interactiva de Red
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Diagnostica desde cualquier equipo de la casa (ping, traceroute, nslookup, arp, curl) o administra el router desde su consola (show, iptables, netstat).
          </p>
        </div>

        {/* Device selector */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline shrink-0">Ejecutar en:</span>
          <select
            value={effectiveRouter ? ROUTER_CONSOLE_ID : selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="min-w-0 max-w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
          >
            <option value={ROUTER_CONSOLE_ID}>Consola del Router ({config.lanIp})</option>
            {devices.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.isOnline ? d.ip : 'sin conexión'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Action Commands Strip */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs bg-slate-950 p-2 rounded-lg border border-slate-800">
        <span className="text-slate-400 font-mono text-[11px] mr-1">Comandos Rápidos:</span>
        {quickCommands.map(q => (
          <button
            key={q.cmd}
            type="button"
            onClick={() => handleExecuteCommand(q.cmd)}
            title={q.title}
            className={`px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 ${q.color} font-mono text-[11px] cursor-pointer`}
          >
            {q.cmd}
          </button>
        ))}
      </div>

      {/* Terminal Screen */}
      <div
        className="bg-black/95 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 h-96 overflow-y-auto space-y-3 shadow-inner selection:bg-sky-500 selection:text-black"
        onClick={() => inputRef.current?.focus()}
      >
        {terminalOutput.map(item => (
          <div key={item.id} className="space-y-1">
            {item.command !== 'system-banner' && (
              <div className="flex items-center gap-2 text-sky-400 min-w-0">
                <span className="text-emerald-400 font-bold shrink-0">{item.prompt}</span>
                <span className="text-white font-bold break-all">{item.command}</span>
                <span className="text-[10px] text-slate-600 ml-auto shrink-0">{item.timestamp}</span>
              </div>
            )}
            <div className={`space-y-0.5 leading-relaxed pl-1 overflow-x-auto ${item.isError ? 'text-rose-400' : 'text-slate-300'}`}>
              {item.output.map((line, lIdx) => (
                <div
                  key={lIdx}
                  className={`whitespace-pre ${
                    line.startsWith('**') || line.startsWith('[AVISO')
                      ? 'text-amber-300 font-semibold'
                      : line.startsWith('[DIDÁCTICA]')
                      ? 'text-sky-300'
                      : ''
                  }`}
                >
                  {line || ' '}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Input Prompt Box */}
      <div className="flex items-center gap-2 bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 shadow-inner focus-within:border-sky-500 transition-colors min-w-0">
        <span className="font-mono text-xs text-emerald-400 font-bold shrink-0 max-w-[45%] truncate">{prompt}</span>
        <input
          ref={inputRef}
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Comando"
          autoComplete="off"
          spellCheck={false}
          placeholder={effectiveRouter ? 'ej. show ip interface brief, iptables -L -n -v (Tab autocompleta)' : 'ej. ping 8.8.8.8, nslookup google.com (Tab autocompleta)'}
          className="flex-1 min-w-0 bg-transparent text-xs text-white font-mono focus:outline-none"
        />
        <button
          type="button"
          onClick={() => handleExecuteCommand()}
          className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white cursor-pointer transition-colors shrink-0"
          title="Ejecutar comando"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
