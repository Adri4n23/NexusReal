import React, { useState } from 'react';
import { Home, MapPin, Bed, Bath, Trash2, Share2, MessageCircle, PlayCircle, Calculator, Info, UserCheck, Percent } from 'lucide-react';

export const CardPropiedad = ({ casa, alEliminar, alCompartir, rolUsuario }) => {
  const [verCalculadora, setVerCalculadora] = useState(false);

  const calcularCuota = () => {
    const monto = casa.precio * 0.8;
    const interesMensual = (0.05 / 12);
    const meses = 20 * 12;
    const cuota = (monto * interesMensual) / (1 - Math.pow(1 + interesMensual, -meses));
    return Math.round(cuota);
  };

  return (
    <div className="bg-white rounded-[45px] overflow-hidden shadow-2xl border border-slate-100 mb-8 animate-in fade-in zoom-in duration-500">
      {/* HEADER IMAGEN */}
      <div className="h-64 bg-slate-200 relative">
        <img src={casa.imagen_url} className="w-full h-full object-cover" alt={casa.titulo} />
        
        {/* ETIQUETA DE COMISIÓN (Sello MLS) */}
        <div className="absolute top-6 left-6 bg-yellow-400 text-slate-900 font-black px-4 py-2 rounded-full flex items-center gap-1 shadow-lg text-[10px] italic">
          <Percent size={14} /> {casa.comision || '5'}% COMPARTIDO
        </div>

        {rolUsuario === 'Jefe' && (
          <button onClick={() => alEliminar(casa.id)} className="absolute top-6 right-6 bg-red-500 text-white p-2.5 rounded-full shadow-xl">
            <Trash2 size={18} />
          </button>
        )}

        <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur px-6 py-3 rounded-2xl shadow-2xl text-[#0056b3] font-black text-2xl italic">
          ${casa.precio?.toLocaleString()}
        </div>
      </div>

      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter leading-tight">{casa.titulo}</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="bg-blue-50 text-[#0056b3] p-1.5 rounded-lg"><UserCheck size={14}/></div>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Captador: {casa.agente_nombre || 'Nexus Real'}</p>
            </div>
          </div>
          <button onClick={() => alCompartir(casa)} className="bg-slate-100 p-3 rounded-2xl text-slate-600 active:scale-90 transition-all">
            <Share2 size={20} />
          </button>
        </div>

        {/* DATOS TÉCNICOS */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-slate-50 p-4 rounded-3xl text-center border border-slate-100">
            <Bed className="mx-auto mb-1 text-[#0056b3]" size={18} />
            <p className="text-[9px] font-black text-slate-400 uppercase">Habitaciones</p>
            <p className="font-bold text-slate-800">{casa.habitaciones}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-3xl text-center border border-slate-100">
            <Bath className="mx-auto mb-1 text-[#0056b3]" size={18} />
            <p className="text-[9px] font-black text-slate-400 uppercase">Baños</p>
            <p className="font-bold text-slate-800">{casa.banos}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-3xl text-center border border-slate-100">
            <Info className="mx-auto mb-1 text-[#0056b3]" size={18} />
            <p className="text-[9px] font-black text-slate-400 uppercase">Certificado</p>
            <p className="font-bold text-slate-800">{casa.eficiencia || 'A+'}</p>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="space-y-4">
          <button 
            onClick={() => setVerCalculadora(!verCalculadora)}
            className="w-full bg-slate-800 text-white py-4 rounded-[22px] font-black text-xs flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
          >
            <Calculator size={18} /> {verCalculadora ? 'OCULTAR CALCULADORA' : 'PLAN DE FINANCIAMIENTO'}
          </button>

          {verCalculadora && (
            <div className="bg-blue-50 p-6 rounded-[30px] border-2 border-dashed border-blue-200 animate-in slide-in-from-top-4">
              <p className="text-[10px] font-black text-[#0056b3] uppercase mb-1 text-center italic tracking-widest">Estimación Bancaria</p>
              <p className="text-3xl font-black text-center text-slate-800">${calcularCuota().toLocaleString()}<span className="text-xs font-normal opacity-50">/mes</span></p>
            </div>
          )}

          <a 
            href={`https://wa.me/${casa.whatsapp}`} 
            target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-green-500 text-white py-5 rounded-[22px] font-black shadow-lg hover:bg-green-600 transition-all active:scale-95"
          >
            <MessageCircle size={24} /> CONTACTAR AL AGENTE
          </a>
        </div>
      </div>
    </div>
  );
};