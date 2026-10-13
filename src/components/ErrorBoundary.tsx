import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

const RELOAD_FLAG = 'netsim-chunk-reload';

function isChunkLoadError(error: Error): boolean {
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(error.message);
}

/**
 * Evita la pantalla en blanco: si tras un nuevo despliegue en GitHub Pages ya no existe el
 * fichero de una pestaña cargada bajo demanda, recarga la página una vez para obtener la versión nueva.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (!isChunkLoadError(error)) return;
    try {
      // Una sola recarga automática por minuto: si el fichero sigue sin existir, se muestra el aviso
      const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
      if (Date.now() - last > 60_000) {
        sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
        window.location.reload();
      }
    } catch {
      // sessionStorage no disponible: se muestra el aviso con el botón de recarga
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    const chunk = isChunkLoadError(this.state.error);
    return (
      <div role="alert" className="max-w-xl mx-auto my-16 bg-slate-900 border border-rose-800/60 rounded-xl p-6 text-sm text-slate-300 space-y-3 text-center">
        <h2 className="text-base font-bold text-white">
          {chunk ? 'Hay una versión nueva del simulador' : 'Algo ha fallado en este módulo'}
        </h2>
        <p className="text-xs text-slate-400">
          {chunk
            ? 'La aplicación se ha actualizado mientras la tenías abierta. Recarga para continuar.'
            : this.state.error.message}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer"
        >
          Recargar la página
        </button>
      </div>
    );
  }
}
