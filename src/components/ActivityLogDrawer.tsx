import React, { useState } from 'react';
import { SystemLogEntry } from '../types/router';
import {
  X,
  ScrollText,
  ShieldAlert,
  Settings,
  Network,
  AlertTriangle,
  Info,
  Search,
  Trash2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logs: SystemLogEntry[];
  onClearLogs: () => void;
  onSimulateEvent: (type: 'attack' | 'dhcp' | 'parental' | 'qos') => void;
}

export const ActivityLogDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  onSimulateEvent
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesFilter =
      filterLevel === 'all' ||
      (filterLevel === 'security' && log.level === 'security') ||
      (filterLevel === 'config' && log.level === 'config') ||
      (filterLevel === 'network' && (log.level === 'network' || log.level === 'info')) ||
      (filterLevel === 'warning' && log.level === 'warning');

    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.technicalDetails && log.technicalDetails.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.didacticExplanation && log.didacticExplanation.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const getLevelBadge = (level: SystemLogEntry['level']) => {
    switch (level) {
      case 'security':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/70 text-rose-400 border border-rose-800">
            <ShieldAlert className="w-3 h-3" /> SEGURIDAD
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-400 border border-amber-800">
            <AlertTriangle className="w-3 h-3" /> AVISO
          </span>
        );
      case 'config':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/70 text-sky-400 border border-sky-800">
            <Settings className="w-3 h-3" /> CONFIG
          </span>
        );
      case 'network':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800">
            <Network className="w-3 h-3" /> RED LAN/WIFI
          </span>
        );
      case 'info':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            <Info className="w-3 h-3" /> INFO
          </span>
        );
    }
  };

  const handleCopyAll = () => {
    const text = logs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] [${l.source}]: ${l.message} | ${l.technicalDetails || ''}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl text-slate-200 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-950 border border-sky-800 text-sky-400">
                <ScrollText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">Log de Actividad del Sistema</h2>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {logs.length} eventos
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Trazabilidad didáctica de cambios de configuración, eventos de red y amenazas detectadas
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copiar logs al portapapeles"
            >
              {copiedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClearLogs}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Vaciar log de eventos"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Simulator Simulator Action Strip */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-slate-400 font-mono text-[11px] shrink-0">Simular Evento:</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onSimulateEvent('attack')}
              className="px-2.5 py-1 rounded bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <ShieldAlert className="w-3 h-3" /> Intrusión WAN
            </button>
            <button
              type="button"
              onClick={() => onSimulateEvent('dhcp')}
              className="px-2.5 py-1 rounded bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <Network className="w-3 h-3" /> Handshake DHCP
            </button>
            <button
              type="button"
              onClick={() => onSimulateEvent('parental')}
              className="px-2.5 py-1 rounded bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <AlertTriangle className="w-3 h-3" /> Bloqueo Web
            </button>
            <button
              type="button"
              onClick={() => onSimulateEvent('qos')}
              className="px-2.5 py-1 rounded bg-sky-950/50 hover:bg-sky-900/60 border border-sky-800/60 text-sky-300 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Prioridad QoS
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/90">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por mensaje, IP, demonio o concepto didáctico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-750 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'security', label: 'Seguridad' },
              { id: 'config', label: 'Configuración' },
              { id: 'network', label: 'Red & Clientes' },
              { id: 'warning', label: 'Avisos' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterLevel(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filterLevel === f.id
                    ? 'bg-sky-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Feed List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-850">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const timeStr = new Date(log.timestamp).toLocaleTimeString();

            return (
              <div
                key={log.id}
                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                className={`pt-2.5 first:pt-0 p-3 rounded-xl transition-all cursor-pointer ${
                  isExpanded
                    ? 'bg-slate-950 border border-sky-800/50 shadow-md'
                    : 'hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                {/* Log Header Row */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {getLevelBadge(log.level)}
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">{log.source}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                    <span>{timeStr}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Log Message */}
                <p className="text-xs font-medium text-slate-200 leading-snug">{log.message}</p>

                {/* Expanded Details / Didactic Breakdown */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 text-xs animate-in fade-in duration-150">
                    {/* Technical details (syslog / iptables / dnsmasq line) */}
                    {log.technicalDetails && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                          Detalle Técnico de Bajo Nivel (Kernel / Demonio):
                        </span>
                        <div className="p-2 rounded bg-black/80 font-mono text-[11px] text-sky-300 border border-slate-800 break-all select-all">
                          {log.technicalDetails}
                        </div>
                      </div>
                    )}

                    {/* Didactic Explanation */}
                    {log.didacticExplanation && (
                      <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-800/40 text-slate-300 space-y-1">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Explicación Didáctica de Red:
                        </span>
                        <p className="text-[11px] leading-relaxed text-slate-300">
                          {log.didacticExplanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="py-16 text-center text-slate-500 italic">
              No se encontraron registros que coincidan con el filtro actual.
            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 text-center text-[11px] text-slate-500 font-mono">
          Haz clic en cualquier registro para inspeccionar su significado didáctico y trazas de red.
        </div>
      </div>
    </div>
  );
};
