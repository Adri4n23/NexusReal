import React from 'react';
import { Search, Settings2 } from 'lucide-react';

export const Navbar = ({ busqueda, setBusqueda, precioMax, setPrecioMax, mostrarFiltros, setMostrarFiltros, total }) => {
  return (
    <nav className="bg-[#0056b3] text-white p-6 sticky top-0 z-50 shadow-xl rounded-b-[40px]">
      <div className="max-w-md mx-auto flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">Nexus Real</h1>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
              {total} Propiedades Disponibles
            </p>
          </div>
          <button 
            onClick={() => setMostrarFiltros(!mostrarFiltros)} 
            className={`p-2.5 rounded-2xl transition-all duration-300 ${mostrarFiltros ? 'bg-white text-[#0056b3] rotate-90' : 'bg-white/10 text-white'}`}
          >
            <Settings2 size={20} />
          </button>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar por zona o nombre..." 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
            className="w-full bg-white text-slate-800 rounded-2xl py-3 px-11 text-sm outline-none shadow-inner" 
          />
          <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
        </div>

        <div className={`grid transition-all duration-500 ease-in-out ${mostrarFiltros ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}>
          <div className="overflow-hidden">
            <div className="pt-2 pb-1">
              <div className="h-[1px] bg-white/20 w-full mb-3"></div>
              <div className="flex justify-between text-[10px] font-bold mb-2 uppercase text-blue-100">
                <span>Presupuesto Máximo</span>
                <span className="text-green-400 font-black">${precioMax.toLocaleString()}</span>
              </div>
              <input 
                type="range" min="0" max="1000000" step="10000" 
                value={precioMax} onChange={(e) => setPrecioMax(parseInt(e.target.value))} 
                className="w-full h-2 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-green-400" 
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};