import React from 'react';
import { RouterConfig } from '../types/router';
import { SecurityAuditReport } from '../simulation/networkEngine';
import { 
  ExternalLink, 
  ShieldCheck, 
  GraduationCap, 
  Globe, 
  CheckCircle2, 
  ScrollText, 
  FileCheck, 
  Terminal, 
  Layers, 
  Wrench,
  Cpu,
  Wifi,
  Network,
  Shield,
  ArrowLeftRight,
  Gauge,
  Laptop,
  Flame,
  Award,
  BookOpen
} from 'lucide-react';

import { ThemeSelector, ThemeMode } from './ThemeSelector';

export type ActiveTab =
  | 'dashboard'
  | 'wireless'
  | 'lan'
  | 'security'
  | 'portforward'
  | 'qos'
  | 'devices'
  | 'cyberlab'
  | 'terminal'
  | 'sniffer'
  | 'troubleshooting'
  | 'missions'
  | 'glossary';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  config: RouterConfig;
  securityAudit: SecurityAuditReport;
  educationalMode: boolean;
  setEducationalMode: (val: boolean) => void;
  completedMissionsCount: number;
  totalMissionsCount: number;
  onOpenActivityLog: () => void;
  unreadLogsCount: number;
  onOpenAuditReport?: () => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  config,
  securityAudit,
  educationalMode,
  setEducationalMode,
  completedMissionsCount,
  totalMissionsCount,
  onOpenActivityLog,
  unreadLogsCount,
  onOpenAuditReport,
  themeMode,
  setThemeMode,
  resolvedTheme
}) => {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'B':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'C':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  interface NavItem {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    isNew?: boolean;
  }

  // Fila 1: Configuración & Servicios de Red del Router
  const routerNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard & Hardware', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'wireless', label: 'Wi-Fi & Espectro', icon: <Wifi className="w-3.5 h-3.5" /> },
    { id: 'lan', label: 'Red LAN & DHCP', icon: <Network className="w-3.5 h-3.5" /> },
    { id: 'security', label: 'Seguridad & Firewall', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'portforward', label: 'Port Forwarding (NAT)', icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
    { id: 'qos', label: 'QoS & Tráfico', icon: <Gauge className="w-3.5 h-3.5" /> },
    { id: 'devices', label: 'Dispositivos', icon: <Laptop className="w-3.5 h-3.5" /> },
  ];

  // Fila 2: Laboratorio Ciberseguridad, Diagnóstico y Taller Didáctico
  const labNavItems: NavItem[] = [
    { id: 'cyberlab', label: 'Lab Ciberseguridad', icon: <Flame className="w-3.5 h-3.5 text-rose-400" /> },
    { id: 'terminal', label: 'Terminal CLI', icon: <Terminal className="w-3.5 h-3.5 text-sky-400" />, badge: 'PRO', isNew: true },
    { id: 'sniffer', label: 'Sniffer Paquetes', icon: <Layers className="w-3.5 h-3.5 text-indigo-400" />, badge: 'Wireshark', isNew: true },
    { id: 'troubleshooting', label: 'Taller de Averías', icon: <Wrench className="w-3.5 h-3.5 text-amber-400" />, badge: '5 Casos', isNew: true },
    { id: 'missions', label: 'Misiones Didácticas', icon: <Award className="w-3.5 h-3.5 text-emerald-400" />, badge: `${completedMissionsCount}/${totalMissionsCount}` },
    { id: 'glossary', label: 'Glosario de Redes', icon: <BookOpen className="w-3.5 h-3.5 text-slate-400" /> },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top tier brand bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Brand Link */}
        <a
          href="https://www.unfantasmaenelsistema.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 group transition-transform hover:scale-[1.01]"
          title="Visitar Un Fantasma en el Sistema (unfantasmaenelsistema.com)"
        >
          <div className="relative w-11 h-11 shrink-0 rounded-xl bg-slate-950 border border-slate-750 flex items-center justify-center p-1 shadow-inner overflow-hidden group-hover:border-sky-500/60 transition-colors">
            <img
              src="/icono.png"
              alt="Logo Un Fantasma en el Sistema"
              className="w-full h-full object-contain aspect-square"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors">
                NetSim Router Lab
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                Simulador Didáctico
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Por</span>
              <span className="text-sky-400 font-semibold group-hover:underline">
                Un Fantasma en el Sistema
              </span>
              <ExternalLink className="w-3 h-3 text-sky-400 opacity-70 group-hover:opacity-100" />
            </div>
          </div>
        </a>

        {/* Action badges and controls */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* External website link button */}
          <a
            href="https://www.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
            title="Ir a unfantasmaenelsistema.com"
          >
            <img
              src="/icono.png"
              alt="Icono"
              className="w-4 h-4 object-contain aspect-square shrink-0"
              referrerPolicy="no-referrer"
            />
            <span className="font-medium font-mono text-[11px]">unfantasmaenelsistema.com</span>
            <ExternalLink className="w-3 h-3 text-sky-400" />
          </a>
          {/* WAN IP */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-500">WAN IP:</span>
            <span className="text-sky-300">{config.wanIp}</span>
          </div>

          {/* Security Score Badge */}
          <button
            type="button"
            onClick={() => setActiveTab('cyberlab')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${getGradeColor(
              securityAudit.grade
            )}`}
            title="Ver auditoría de seguridad completa"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Auditoría: {securityAudit.score}/100</span>
            <span className="px-1 py-0.2 rounded font-mono text-[10px] bg-slate-900 border border-current">
              {securityAudit.grade}
            </span>
          </button>

          {/* Executive Audit Report Button */}
          {onOpenAuditReport && (
            <button
              type="button"
              onClick={onOpenAuditReport}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-700/50 text-emerald-300 transition-all cursor-pointer shadow-sm hover:border-emerald-400"
              title="Generar e imprimir informe ejecutivo de auditoría"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Informe Oficial</span>
            </button>
          )}

          {/* Activity Log Drawer trigger */}
          <button
            type="button"
            onClick={onOpenActivityLog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200 transition-all cursor-pointer shadow-sm hover:border-sky-500/50"
            title="Abrir Log de Actividad del Router"
          >
            <ScrollText className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Log de Actividad</span>
            <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-sky-950 text-sky-400 border border-sky-800">
              {unreadLogsCount}
            </span>
          </button>

          {/* Educational Inspector switch */}
          <button
            type="button"
            onClick={() => setEducationalMode(!educationalMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              educationalMode
                ? 'bg-sky-600/20 border-sky-500/50 text-sky-300 shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${educationalMode ? 'text-sky-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Modo Didáctico: {educationalMode ? 'Activado' : 'Mínimo'}</span>
            <span className="sm:hidden">{educationalMode ? 'Didáctico' : 'Mínimo'}</span>
          </button>

          {/* Theme Selector (Claro / Oscuro / Sistema) */}
          <ThemeSelector
            themeMode={themeMode}
            onThemeChange={setThemeMode}
            resolvedTheme={resolvedTheme}
          />
        </div>
      </div>

      {/* Navigation tabs in two distinct, responsive rows without horizontal scroll */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 space-y-1.5 border-t border-slate-800/80 bg-slate-900/90">
        {/* Fila 1: Configuración de Red & Router */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/90 border border-slate-700/60 text-[10px] font-mono font-semibold uppercase text-slate-300 shrink-0 mr-1 shadow-sm">
            <Cpu className="w-3 h-3 text-sky-400" />
            <span className="tracking-wide">Router & Red:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {routerNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className={isActive ? 'text-sky-400' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fila 2: Laboratorio Ciberseguridad, Diagnóstico y Taller Didáctico */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/50">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-950/70 border border-indigo-800/60 text-[10px] font-mono font-semibold uppercase text-indigo-300 shrink-0 mr-1 shadow-sm">
            <Flame className="w-3 h-3 text-amber-400" />
            <span className="tracking-wide">Lab Didáctico:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {labNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/60 shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className={isActive ? 'text-indigo-300' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-semibold flex items-center gap-1 ${
                        item.badge === 'PRO'
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : item.badge === 'Wireshark'
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                          : item.badge === '5 Casos'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : completedMissionsCount === totalMissionsCount
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-sky-950 text-sky-400 border border-sky-800'
                      }`}
                    >
                      {item.id === 'missions' && completedMissionsCount === totalMissionsCount && (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      )}
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
