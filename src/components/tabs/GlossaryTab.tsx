import React, { useState } from 'react';
import { GLOSSARY_TERMS, GlossaryTerm } from '../../data/glossary';
import { BookOpen, Search, Lightbulb, Compass } from 'lucide-react';

export const GlossaryTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const categories = ['Todos', 'Redes Básicas', 'Wi-Fi', 'Seguridad', 'Protocolos', 'Rendimiento'];

  const filteredTerms = GLOSSARY_TERMS.filter((term) => {
    const matchesCategory = selectedCategory === 'Todos' || term.category === selectedCategory;
    const matchesSearch =
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.shortDef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Glosario Didáctico de Redes y Telecomunicaciones
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Aprende los conceptos clave de redes explicados con analogías cotidianas y fundamentos técnicos sólidos.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar término (ej. NAT, DMZ, Bufferbloat)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-750 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-sky-600 text-white font-semibold shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Glossary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTerms.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3"
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 px-2 py-0.5 rounded bg-sky-950 border border-sky-800">
                  {item.category}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">{item.term}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {item.shortDef}
            </p>

            <p className="text-xs text-slate-400 leading-relaxed">
              {item.explanation}
            </p>

            {/* Analogy Box */}
            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/30 text-xs text-amber-300 space-y-1">
              <span className="font-semibold flex items-center gap-1.5 text-amber-400">
                <Lightbulb className="w-3.5 h-3.5" /> Analogía de la vida real:
              </span>
              <p className="text-[11px] leading-relaxed text-amber-200/90">{item.analogy}</p>
            </div>
          </div>
        ))}

        {filteredTerms.length === 0 && (
          <div className="col-span-2 py-12 text-center text-slate-500 italic bg-slate-900 border border-slate-800 rounded-xl">
            No se encontraron términos que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  );
};
