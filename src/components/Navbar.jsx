import React from 'react';
import { supabase } from '../supabase';
import { Search, LogOut, Building2 } from 'lucide-react';

function Navbar({ alBuscar, usuario, tasaBCV }) {
  return (
    <nav className="bg-slate-900 pt-4 pb-12 md:pt-6 md:pb-16 px-4 md:px-6 rounded-b-[45px] shadow-2xl text-white relative overflow-hidden mb-6">
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#0056b3] rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0056b3] rounded-xl flex items-center justify-center shadow-lg">
                <Building2 size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-tighter italic leading-none">NexusReal</h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Red Inmobiliaria</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end px-3 py-1.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                 <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Tasa BCV</p>
                 <p className="text-xs font-black text-amber-400">Bs. {tasaBCV ? tasaBCV.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 'Cargando...'}</p>
             </div>
             <div className="text-right hidden md:block">
                <p className="text-[11px] font-bold text-slate-200">{usuario?.user_metadata?.nombre || usuario?.email}</p>
                <p className="text-[9px] text-green-400 font-black uppercase">Agente Verificado</p>
             </div>
             <button onClick={() => supabase.auth.signOut()} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">
                <LogOut size={18} />
             </button>
          </div>
        </div>
        
        {/* Tasa BCV para móvil (visible solo en móviles debajo del logo o en una línea aparte) */}
        {tasaBCV && (
            <div className="sm:hidden flex justify-center mb-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Tasa BCV:</span>
                    <span className="text-[11px] font-black text-amber-400">Bs. {tasaBCV.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
            </div>
        )}
        
        <div className="relative max-w-4xl mx-auto transform translate-y-6 text-center">
          <div className="mb-8 flex flex-col items-center">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic leading-none mb-3 drop-shadow-xl">
              NexusReal
            </h1>
            <p className="text-xs md:text-base text-[#0056b3] font-black uppercase tracking-[0.4em] opacity-90">
              Red Inmobiliaria
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="mb-3 px-4 flex items-center justify-between">
              <h2 className="text-base md:text-lg font-bold text-slate-200">
                Hola, <span className="text-white">{usuario?.user_metadata?.nombre || usuario?.email?.split('@')[0]}</span> 👋
              </h2>
              <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider hidden sm:block">
                ¿Qué propiedad buscas hoy?
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
              <input 
                type="text" 
                onChange={(e) => alBuscar(e.target.value)}
                className="w-full bg-white rounded-full py-5 pl-14 pr-8 outline-none text-slate-800 text-base font-medium shadow-2xl placeholder:text-slate-300 ring-8 ring-black/5"
                placeholder="Buscar propiedad, zona o código..."
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;