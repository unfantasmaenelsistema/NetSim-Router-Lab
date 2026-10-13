import React, { useState } from 'react';
import { Mission, RouterConfig, VirtualDevice, NetworkTelemetry } from '../../types/router';
import { MISSIONS } from '../../data/missions';
import { ActiveTab } from '../Header';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, ChevronRight, HelpCircle, ArrowRight, Sparkles, Wrench } from 'lucide-react';

interface Props {
  config: RouterConfig;
  devices: VirtualDevice[];
  telemetry: NetworkTelemetry;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const MissionsTab: React.FC<Props> = ({ config, devices, telemetry, onNavigateTab }) => {
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [celebratedMissions, setCelebratedMissions] = useState<Record<string, boolean>>({});

  const checkCompletion = (m: Mission) => {
    try {
      const done = m.isCompleted(config, devices, telemetry);
      if (done && !celebratedMissions[m.id]) {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.7 }
        });
        setCelebratedMissions(prev => ({ ...prev, [m.id]: true }));
      }
      return done;
    } catch {
      return false;
    }
  };

  const toggleHint = (missionId: string) => {
    setRevealedHints(prev => ({ ...prev, [missionId]: !prev[missionId] }));
  };

  const getTargetTab = (missionId: string): ActiveTab => {
    switch (missionId) {
      case 'mission-bufferbloat-qos':
        return 'qos';
      case 'mission-port-forward':
        return 'portforward';
      case 'mission-wifi-hardening':
        return 'wireless';
      case 'mission-parental-control':
      case 'mission-dos-defense':
        return 'security';
      default:
        return 'dashboard';
    }
  };

  const totalDone = MISSIONS.filter(m => m.isCompleted(config, devices, telemetry)).length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Misiones Didácticas & Retos Prácticos de Red
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Aprende a resolver problemas reales de hogares: lag en videojuegos, servidores inaccesibles, ataques Wi-Fi y filtrado web.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-slate-400">Progreso Total</div>
            <div className="text-base font-bold font-mono text-emerald-400">
              {totalDone} de {MISSIONS.length} Completadas
            </div>
          </div>
          {totalDone === MISSIONS.length && (
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Switch to Helpdesk Break & Fix Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-800/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-700/60">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              ¿Quieres un reto más avanzado? Prueba el Taller de Averías (Helpdesk)
            </h3>
            <p className="text-xs text-slate-300">
              5 incidencias de clientes reales (pool DHCP agotado, fallo DNS, desalineación de puertos NAT...). Inyecta averías y repara el sistema.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('troubleshooting')}
          className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <span>Ir al Taller de Averías</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Missions List */}
      <div className="space-y-4">
        {MISSIONS.map((mission) => {
          const isDone = checkCompletion(mission);
          const isHintOpen = revealedHints[mission.id];

          return (
            <div
              key={mission.id}
              className={`bg-slate-900 border rounded-xl p-5 shadow-xl space-y-4 transition-all ${
                isDone
                  ? 'border-emerald-600/40 bg-gradient-to-r from-slate-900 to-emerald-950/20'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 font-mono text-xs'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-950" /> : '•'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{mission.title}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {mission.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{mission.problemScenario}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onNavigateTab(getTargetTab(mission.id))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Configurar en Router</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Objective & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="font-semibold text-sky-400 uppercase tracking-wider text-[11px] block">
                    Objetivo Didáctico:
                  </span>
                  <p className="leading-relaxed">{mission.objective}</p>
                </div>

                <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] block">
                    Pasos a seguir:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {mission.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Status and Hint */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/80 text-xs">
                <div>
                  {isDone ? (
                    <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{mission.solutionSummary}</span>
                    </div>
                  ) : (
                    <span className="text-amber-400/90 font-medium">
                      Estado: Pendiente de configurar en el router.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleHint(mission.id)}
                  className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer text-xs self-start sm:self-auto"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isHintOpen ? 'Ocultar Pista' : 'Ver Pista'}</span>
                </button>
              </div>

              {/* Hint Content */}
              {isHintOpen && (
                <div className="p-3 bg-sky-950/30 border border-sky-800/40 rounded-lg text-xs text-sky-300 animate-in fade-in">
                  <span className="font-bold">Pista: </span> {mission.hint}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
