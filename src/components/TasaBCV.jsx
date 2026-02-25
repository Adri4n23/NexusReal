import React from 'react';
import { RefreshCw } from 'lucide-react';

const TasaBCV = ({ tasa }) => {
  return (
    <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-1.5 shadow-sm border border-blue-100">
      <div className="flex flex-col">
        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Tasa Oficial</span>
        <div className="flex items-center gap-2">
          {!tasa ? (
            <div className="flex items-center gap-1">
              <RefreshCw size={10} className="animate-spin text-blue-600" />
              <span className="text-[9px] font-bold text-slate-400 uppercase">Sincronizando...</span>
            </div>
          ) : (
            <span className="text-xs font-black text-blue-700">
              Bs. {tasa?.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasaBCV;
