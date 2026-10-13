import React from 'react';
import { HelpCircle, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { EDUCATIONAL_TOPICS } from '../data/educationalInfo';

interface Props {
  topicId: string;
  onOpenTopic: (topicId: string) => void;
  inlineLabel?: string;
  compact?: boolean;
}

export const EducationalBadge: React.FC<Props> = ({
  topicId,
  onOpenTopic,
  inlineLabel,
  compact = false
}) => {
  const topic = EDUCATIONAL_TOPICS[topicId];
  if (!topic) return null;

  const getSecurityIcon = () => {
    switch (topic.securityLevel) {
      case 'danger':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case 'caution':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 'safe':
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpenTopic(topicId);
      }}
      className={`inline-flex items-center gap-1.5 transition-all cursor-pointer font-medium text-xs rounded-md ${
        compact
          ? 'px-1.5 py-0.5 text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 border border-sky-800/40'
          : 'px-2 py-1 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 shadow-sm'
      }`}
      title={`Aprender: ${topic.title} (¿Qué hace y qué impacto tiene?)`}
    >
      <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
      <span>{inlineLabel || '¿Qué hace?'}</span>
      {getSecurityIcon()}
    </button>
  );
};
