import React from 'react';
import { supabase } from '../supabase';
import { Search, LogOut, Building2 } from 'lucide-react';

function Navbar({ alBuscar, usuario }) {
  return (
    <nav className="bg-slate-900 pt-6 pb-16 px-6 rounded-b-[45px] shadow-2xl text-white relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#0056b3] rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0056b3] rounded-xl flex items-center justify-center shadow-lg">
                <Building2 size={20} className="text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-black tracking-tighter italic leading-none">NexusReal</h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Red Inmobiliaria</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-[11px] font-bold text-slate-200">{usuario?.user_metadata?.nombre || usuario?.email}</p>
                <p className="text-[9px] text-green-400 font-black uppercase">Agente Verificado</p>
             </div>
             <button onClick={() => supabase.auth.signOut()} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">
                <LogOut size={18} />
             </button>
          </div>
        </div>
        
        <div className="relative max-w-2xl mx-auto transform translate-y-4">
          <Search className="absolute left-5 top-4 text-slate-400" size={20} />
          <input 
            type="text" 
            onChange={(e) => alBuscar(e.target.value)}
            className="w-full bg-white rounded-3xl py-4 pl-14 pr-6 outline-none text-slate-800 text-sm font-medium shadow-2xl placeholder:text-slate-300"
            placeholder="Buscar propiedad, zona o código..."
          />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;