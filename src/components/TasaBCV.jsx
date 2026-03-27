import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';

const TasaBCV = ({ tasa, setTasa, onNotificar }) => {
  const [refrescando, setRefrescando] = useState(false);

  const handleRefresh = async () => {
    setRefrescando(true);
    try {
      const nuevaTasa = await propiedadesService.obtenerTasa();
      if (nuevaTasa) {
        setTasa(nuevaTasa);
        localStorage.setItem('tasa_bcv_cache', nuevaTasa.toString());
        onNotificar?.('Tasa del BCV actualizada', 'success');
      } else {
        onNotificar?.('No se pudo obtener la tasa actualizada', 'error');
      }
    } catch (error) {
      onNotificar?.('Error al conectar con el servicio de tasas', 'error');
    } finally {
      setRefrescando(false);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-white rounded-xl pl-4 pr-2 py-1.5 shadow-sm border border-blue-100">
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
      <button onClick={handleRefresh} disabled={refrescando} className="p-1 text-blue-500 hover:bg-blue-50 rounded-md transition-colors">
        <RefreshCw size={14} className={refrescando ? 'animate-spin' : ''} />
      </button>
    </div>
  );
};

export default TasaBCV;
