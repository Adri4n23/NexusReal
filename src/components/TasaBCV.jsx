import React from 'react';
import { RefreshCw } from 'lucide-react';

const TasaBCV = ({ tasa }) => {
  return (
    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-2xl">
      <div className="flex flex-col">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tasa del Día</span>
        <div className="flex items-center gap-2">
          {!tasa ? (
            <div className="flex items-center gap-1">
              <RefreshCw size={12} className="animate-spin text-amber-400" />
              <span className="text-xs font-bold text-slate-300">Cargando...</span>
            </div>
          ) : (
            <span className="text-sm font-black text-amber-400">
              Bs. {tasa?.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasaBCV;
