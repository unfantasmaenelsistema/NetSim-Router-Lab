import React from 'react';
import { X, BookOpen, CheckCircle2, XCircle, Zap, Shield, Sparkles, AlertTriangle } from 'lucide-react';
import { EDUCATIONAL_TOPICS } from '../data/educationalInfo';

interface Props {
  topicId: string | null;
  onClose: () => void;
}

export const EducationalModal: React.FC<Props> = ({ topicId, onClose }) => {
  if (!topicId) return null;
  const topic = EDUCATIONAL_TOPICS[topicId];
  if (!topic) return null;

  const getSecurityBadge = () => {
    switch (topic.securityLevel) {
      case 'danger':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Nivel de Riesgo: Crítico
          </span>
        );
      case 'caution':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Nivel de Riesgo: Precaución
          </span>
        );
      case 'safe':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" /> Nivel de Riesgo: Seguro / Estándar
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl text-slate-200 p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-sky-950 text-sky-400 border border-sky-800">
                Inspector Didáctico de Redes
              </span>
              {getSecurityBadge()}
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-400" />
              {topic.title}
            </h2>
            <p className="text-sm text-slate-400">{topic.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* What is it */}
        <div className="space-y-2 bg-slate-800/50 p-4 rounded-lg border border-slate-750">
          <h3 className="text-sm font-semibold text-sky-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" /> ¿Qué es y cuál es su función en el router?
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">{topic.whatIsIt}</p>
        </div>

        {/* Enabled vs Disabled Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> ¿Qué repercusión tiene si está ACTIVADO?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{topic.whenEnabled}</p>
          </div>

          <div className="bg-rose-950/20 border border-rose-800/30 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
              <XCircle className="w-4 h-4" /> ¿Qué repercusión tiene si está DESACTIVADO?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{topic.whenDisabled}</p>
          </div>
        </div>

        {/* Performance & Security Impact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Impacto en Rendimiento & Velocidad
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{topic.performanceImpact}</p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Impacto en Ciberseguridad & Vulnerabilidades
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{topic.securityImpact}</p>
          </div>
        </div>

        {/* Recommended & Real-World */}
        <div className="bg-sky-950/20 border border-sky-800/40 rounded-lg p-4 space-y-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 block mb-1">
              Configuración recomendada para hogares:
            </span>
            <p className="text-sm font-medium text-slate-200">{topic.recommendedSetting}</p>
          </div>
          <div className="border-t border-sky-900/40 pt-2">
            <span className="text-xs text-slate-400 italic">
              Ejemplo práctico real: <span className="text-slate-300">{topic.realWorldExample}</span>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg shadow transition-colors cursor-pointer"
          >
            Entendido, volver a la configuración
          </button>
        </div>
      </div>
    </div>
  );
};
