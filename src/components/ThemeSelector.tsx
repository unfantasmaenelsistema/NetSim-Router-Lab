import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check, ChevronDown } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface Props {
  themeMode: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
}

export const ThemeSelector: React.FC<Props> = ({
  themeMode,
  onThemeChange,
  resolvedTheme
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { id: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'light',
      label: 'Claro',
      icon: <Sun className="w-3.5 h-3.5 text-amber-500" />,
      desc: 'Fondo blanco y alto contraste'
    },
    {
      id: 'dark',
      label: 'Oscuro',
      icon: <Moon className="w-3.5 h-3.5 text-sky-400" />,
      desc: 'Interfaz oscura de laboratorio'
    },
    {
      id: 'system',
      label: 'Sistema',
      icon: <Monitor className="w-3.5 h-3.5 text-slate-400" />,
      desc: `Sigue las preferencias del SO (${resolvedTheme === 'dark' ? 'Oscuro' : 'Claro'})`
    }
  ];

  const currentOption = options.find(o => o.id === themeMode) || options[2];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200 transition-all cursor-pointer shadow-sm hover:border-slate-600"
        title={`Tema actual: ${currentOption.label}. Haz clic para cambiar entre Claro, Oscuro o Sistema`}
        aria-label="Selector de tema"
        aria-expanded={isOpen}
      >
        <span className="flex items-center">
          {resolvedTheme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-sky-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
        </span>
        <span className="hidden md:inline">{currentOption.label}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
            Tema de la Interfaz
          </div>
          <div className="p-1 space-y-0.5">
            {options.map((option) => {
              const isSelected = themeMode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onThemeChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-slate-800/80 border border-slate-700/50">
                      {option.icon}
                    </span>
                    <div>
                      <div className="font-medium text-xs leading-none mb-0.5">{option.label}</div>
                      <div className="text-[10px] text-slate-400 leading-tight">{option.desc}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
