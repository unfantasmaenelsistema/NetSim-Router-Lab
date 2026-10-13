import React, { useState, useRef, useEffect } from 'react';
import { RouterConfig, VirtualDevice, NetworkTelemetry } from '../types/router';
import { Terminal, Send, Trash2, HelpCircle, Laptop, Globe, Sparkles, RefreshCw } from 'lucide-react';

interface Props {
  config: RouterConfig;
  devices: VirtualDevice[];
  telemetry: NetworkTelemetry;
  onOpenTopic: (topicId: string) => void;
}

interface CommandHistoryItem {
  id: string;
  command: string;
  output: string[];
  timestamp: string;
  isError?: boolean;
}

export const NetworkCliTerminal: React.FC<Props> = ({
  config,
  devices,
  telemetry,
  onOpenTopic
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('dev-pc-gamer');
  const [inputCommand, setInputCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [terminalOutput, setTerminalOutput] = useState<CommandHistoryItem[]>([
    {
      id: 'init-1',
      command: 'system-banner',
      output: [
        '==============================================================',
        '   NETSIM INTERACTIVE NETWORK CLI - TERMINAL DE CLIENTE',
        '   Consola de diagnóstico de red y resolución de problemas.',
        '   Escribe "help" para ver la lista de comandos disponibles.',
        '=============================================================='
      ],
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  const handleExecuteCommand = (cmdToRun?: string) => {
    const rawCmd = (cmdToRun !== undefined ? cmdToRun : inputCommand).trim();
    if (!rawCmd) return;

    const parts = rawCmd.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const timeStr = new Date().toLocaleTimeString();

    // Add to history
    setCommandHistory(prev => [rawCmd, ...prev]);
    setHistoryIndex(-1);

    let outputLines: string[] = [];
    let isError = false;

    if (!selectedDevice.isOnline && command !== 'help' && command !== 'clear') {
      outputLines = [
        `error: Interfaz de red desactivada o sin conexión.`,
        `Estado actual: ${selectedDevice.statusLog}`,
        `Conecta el dispositivo a Ethernet o Wi-Fi para enviar tráfico.`
      ];
      isError = true;
    } else {
      switch (command) {
        case 'help':
          outputLines = [
            'Comandos de Red Disponibles:',
            '  ping <ip|host>         - Prueba de conectividad ICMP Echo y tiempo de ida y vuelta (RTT)',
            '  traceroute <ip|host>   - Muestra la ruta de saltos (hops) hasta el destino',
            '  nslookup <dominio>     - Consulta al servidor DNS configurado en el router',
            '  arp -a                 - Muestra la tabla ARP (correspondencia IP y MAC de la subred)',
            '  ipconfig / ifconfig    - Muestra la configuración IP, máscara, gateway y DNS del host',
            '  curl -I <url>          - Envía una petición HTTP HEAD (prueba de firewall y control parental)',
            '  speedtest              - Ejecuta una prueba de velocidad con el servidor WAN',
            '  clear                  - Limpia la pantalla de la terminal'
          ];
          break;

        case 'clear':
        case 'cls':
          setTerminalOutput([]);
          setInputCommand('');
          return;

        case 'ipconfig':
        case 'ifconfig':
          outputLines = [
            `Configuración IP de Windows/Linux para el host [${selectedDevice.name}]:`,
            ``,
            `  Adaptador de red        : ${selectedDevice.connectionType.replace('_', ' ').toUpperCase()}`,
            `  Dirección IPv4          : ${selectedDevice.ip}`,
            `  Máscara de subred       : ${config.lanSubnetMask}`,
            `  Puerta de enlace (GW)   : ${config.lanIp}`,
            `  Dirección física (MAC)  : ${selectedDevice.mac}`,
            `  Servidores DNS          : ${config.wanDnsMode === 'Custom' ? `${config.wanPrimaryDns}, ${config.wanSecondaryDns}` : config.wanPrimaryDns}`,
            `  Estado de concesión     : ${config.dhcpEnabled ? 'DHCP Automático' : 'Configuración Estática'}`,
            `  Ping de enlace local    : ${selectedDevice.currentLatencyMs} ms`
          ];
          break;

        case 'arp':
          outputLines = [
            `Tabla ARP de la interfaz (${selectedDevice.ip}):`,
            `  Dirección IP         Dirección Física (MAC)    Tipo`,
            `  -------------------------------------------------------------`,
            `  ${config.lanIp.padEnd(20)} 00:90:A9:7B:44:01          Dinámico (Gateway)`
          ];
          devices.filter(d => d.id !== selectedDevice.id && d.isOnline).forEach(d => {
            outputLines.push(`  ${d.ip.padEnd(20)} ${d.mac}          Dinámico (${d.name.slice(0, 15)})`);
          });
          break;

        case 'ping': {
          const target = args[0] || config.lanIp;
          const isGateway = target === config.lanIp || target === '192.168.1.1' || target === 'gateway';
          const isInternet = target.includes('8.8.8.8') || target.includes('1.1.1.1') || target.includes('google');

          const baseLat = isGateway ? (selectedDevice.connectionType.startsWith('ethernet') ? 1 : 12) : selectedDevice.currentLatencyMs;
          const packetLoss = selectedDevice.packetLossPercent;

          outputLines = [
            `Haciendo ping a ${target} con 32 bytes de datos:`,
            `Respuesta desde ${target}: bytes=32 tiempo=${baseLat}ms TTL=64`,
            `Respuesta desde ${target}: bytes=32 tiempo=${baseLat + 1}ms TTL=64`,
            `Respuesta desde ${target}: bytes=32 tiempo=${Math.max(1, baseLat - 1)}ms TTL=64`,
            `Respuesta desde ${target}: bytes=32 tiempo=${baseLat + 2}ms TTL=64`,
            ``,
            `Estadísticas de ping para ${target}:`,
            `    Paquetes: enviados = 4, recibidos = ${packetLoss > 20 ? 2 : 4}, perdidos = ${packetLoss > 20 ? 2 : 0} (${packetLoss}% perdidos)`,
            `Tiempos aproximados de ida y vuelta en milisegundos:`,
            `    Mínimo = ${Math.max(1, baseLat - 1)}ms, Máximo = ${baseLat + 2}ms, Media = ${baseLat}ms`
          ];

          if (baseLat > 100) {
            outputLines.push(
              `[AVISO DIDÁCTICO]: La latencia es alta (${baseLat}ms) debido a congestión de buffers (Bufferbloat). Activa QoS para reducirla.`
            );
          }
          break;
        }

        case 'traceroute':
        case 'tracert': {
          const target = args[0] || '8.8.8.8';
          const hop1 = selectedDevice.connectionType.startsWith('ethernet') ? '1 ms' : '8 ms';
          const hop2 = `${selectedDevice.currentLatencyMs - 4} ms`;
          const hop3 = `${selectedDevice.currentLatencyMs} ms`;

          outputLines = [
            `Traza a la dirección ${target} sobre un máximo de 30 saltos:`,
            ``,
            `  1    ${hop1}    ${hop1}    ${hop1}   ${config.lanIp} [Router Gateway Local]`,
            `  2    ${hop2}    ${hop2}    ${hop2}   ${config.wanGateway} [Nodo Agregador ISP Fibra]`,
            `  3    ${hop3}    ${hop3}    ${hop3}   185.220.100.254 [Backbone Red Principal]`,
            `  4    ${hop3}    ${hop3}    ${hop3}   ${target} [Destino Alcanzado]`,
            ``,
            `Traza completa con éxito.`
          ];
          break;
        }

        case 'nslookup':
        case 'dig': {
          const domain = args[0] || 'google.com';
          const isBlockedByParental = config.parentalControlEnabled && config.blockedDomains.some(d => d.enabled && domain.includes(d.domain));

          outputLines = [
            `Servidor:   ${config.wanDnsMode === 'Custom' ? config.wanPrimaryDns : config.lanIp}`,
            `Address:    ${config.wanDnsMode === 'Custom' ? config.wanPrimaryDns : config.lanIp}#53`,
            ``
          ];

          if (isBlockedByParental) {
            outputLines.push(
              `** Servidor no puede encontrar ${domain}: Dominio bloqueado por Control Parental local (NXDOMAIN)`
            );
            outputLines.push(
              `[DIDÁCTICA]: El router interceptó la consulta DNS hacia "${domain}" y devolvió respuesta de bloqueo.`
            );
          } else {
            outputLines.push(
              `Respuesta no autoritativa:`,
              `Nombre:   ${domain}`,
              `Address:  142.250.200.14`,
              `Address:  2a00:1450:4003:80d::200e`
            );
          }
          break;
        }

        case 'curl': {
          const url = args.find(a => a.startsWith('http')) || args[0] || 'http://example.com';
          const isBlocked = config.parentalControlEnabled && config.blockedDomains.some(d => d.enabled && url.includes(d.domain));

          if (isBlocked) {
            outputLines = [
              `HTTP/1.1 403 Forbidden`,
              `Server: NetSim-ParentalFilter/1.0`,
              `Content-Type: text/html`,
              ``,
              `<!DOCTYPE html><html><body><h1>Acceso Bloqueado por Control Parental</h1></body></html>`
            ];
          } else {
            outputLines = [
              `HTTP/1.1 200 OK`,
              `Date: ${new Date().toUTCString()}`,
              `Server: Apache/2.4.52`,
              `Content-Type: text/html; charset=UTF-8`,
              `Content-Length: 1256`,
              `Connection: keep-alive`
            ];
          }
          break;
        }

        case 'speedtest':
          outputLines = [
            `Iniciando prueba de velocidad hacia el servidor Speedtest más cercano...`,
            `Conectando a servidor de prueba vía WAN (${config.wanIp})...`,
            `Ping de descarga: ${selectedDevice.currentLatencyMs} ms  | Jitter: 2.4 ms`,
            `Velocidad de Bajada : ${selectedDevice.currentDownloadMbps} Mbps`,
            `Velocidad de Subida : ${selectedDevice.currentUploadMbps} Mbps`,
            `Capacidad contratada: ${config.qosTotalDownlinkMbps} Mbps Bajada / ${config.qosTotalUplinkMbps} Mbps Subida`
          ];
          break;

        default:
          outputLines = [
            `Comando no reconocido: "${command}".`,
            `Escribe "help" para ver la lista de comandos disponibles.`
          ];
          isError = true;
      }
    }

    setTerminalOutput(prev => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        command: rawCmd,
        output: outputLines,
        timestamp: timeStr,
        isError
      }
    ]);

    setInputCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleExecuteCommand();
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
              Terminal Interactiva de Red (CLI de Clientes)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Ejecuta comandos reales de diagnóstico (ping, traceroute, nslookup, arp, curl) desde cualquier dispositivo de la casa.
          </p>
        </div>

        {/* Device selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Dispositivo Activo:</span>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="bg-slate-950 border border-slate-750 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
          >
            {devices.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.isOnline ? d.ip : 'Offline'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Action Commands Strip */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs bg-slate-950 p-2 rounded-lg border border-slate-800">
        <span className="text-slate-400 font-mono text-[11px] mr-1">Comandos Rápidos:</span>
        <button
          type="button"
          onClick={() => handleExecuteCommand('ping 192.168.1.1')}
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-sky-300 font-mono text-[11px] cursor-pointer"
        >
          ping 192.168.1.1
        </button>
        <button
          type="button"
          onClick={() => handleExecuteCommand('ping 8.8.8.8')}
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-sky-300 font-mono text-[11px] cursor-pointer"
        >
          ping 8.8.8.8
        </button>
        <button
          type="button"
          onClick={() => handleExecuteCommand('traceroute 8.8.8.8')}
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-indigo-300 font-mono text-[11px] cursor-pointer"
        >
          traceroute 8.8.8.8
        </button>
        <button
          type="button"
          onClick={() => handleExecuteCommand('nslookup google.com')}
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-emerald-300 font-mono text-[11px] cursor-pointer"
        >
          nslookup google.com
        </button>
        <button
          type="button"
          onClick={() => handleExecuteCommand('nslookup tiktok.com')}
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-amber-300 font-mono text-[11px] cursor-pointer"
          title="Prueba de Control Parental"
        >
          nslookup tiktok.com (Parental)
        </button>
        <button
          type="button"
          onClick={() => handleExecuteCommand('arp -a')}
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-purple-300 font-mono text-[11px] cursor-pointer"
        >
          arp -a
        </button>
        <button
          type="button"
          onClick={() => handleExecuteCommand('ipconfig')}
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-mono text-[11px] cursor-pointer"
        >
          ipconfig
        </button>
      </div>

      {/* Terminal Screen */}
      <div
        className="bg-black/95 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 h-96 overflow-y-auto space-y-3 shadow-inner selection:bg-sky-500 selection:text-black"
        onClick={() => inputRef.current?.focus()}
      >
        {terminalOutput.map(item => (
          <div key={item.id} className="space-y-1">
            {item.command !== 'system-banner' && (
              <div className="flex items-center gap-2 text-sky-400">
                <span className="text-emerald-400 font-bold">
                  root@{selectedDevice.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}:~#
                </span>
                <span className="text-white font-bold">{item.command}</span>
                <span className="text-[10px] text-slate-600 ml-auto">{item.timestamp}</span>
              </div>
            )}
            <div className={`space-y-0.5 leading-relaxed pl-1 ${item.isError ? 'text-rose-400' : 'text-slate-300'}`}>
              {item.output.map((line, lIdx) => (
                <div key={lIdx} className={line.includes('**') ? 'text-rose-400 font-bold' : ''}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Input Prompt Box */}
      <div className="flex items-center gap-2 bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 shadow-inner focus-within:border-sky-500 transition-colors">
        <span className="font-mono text-xs text-emerald-400 font-bold shrink-0">
          root@{selectedDevice.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}:~#
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un comando (ej. ping 8.8.8.8, nslookup google.com, arp -a)..."
          className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none"
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
