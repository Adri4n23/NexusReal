import React, { useState } from 'react';
import { Camera, Loader2, Percent, MapPin, Type } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';

export const Formulario = ({ usuario, alTerminar }) => {
  const [subiendo, setSubiendo] = useState(false);
  const [foto, setFoto] = useState(null);
  const [datos, setDatos] = useState({
    titulo: '', precio: '', whatsapp: '', zona: '', 
    tipo: 'Venta', habitaciones: '', banos: '',
    comision: '5', video_url: '', eficiencia: 'A'
  });

  const enviar = async (e) => {
    e.preventDefault();
    setSubiendo(true);
    try {
      let url = null;
      if (foto) url = await propiedadesService.subirFoto(foto);
      await propiedadesService.crear({...datos, imagen_url: url}, usuario);
      alTerminar();
    } catch (err) { alert("Error al subir."); }
    setSubiendo(false);
  };

  return (
    <form onSubmit={enviar} className="bg-white p-8 rounded-[40px] shadow-2xl mb-10 border border-slate-100 animate-in slide-in-from-top">
      <h2 className="text-xl font-black text-slate-800 mb-6 uppercase italic">Registro MLS</h2>
      
      <div className="space-y-4">
        <div className="relative w-full h-48 bg-slate-50 rounded-[30px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden">
          {foto ? <img src={URL.createObjectURL(foto)} className="w-full h-full object-cover" alt="Preview" /> : <Camera className="text-slate-300" size={40} />}
          <input type="file" capture="environment" onChange={(e) => setFoto(e.target.files[0])} className="absolute inset-0 opacity-0" />
        </div>

        <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Nombre de la propiedad" onChange={e => setDatos({...datos, titulo: e.target.value})} required />
        
        <div className="flex gap-2">
          <div className="relative w-1/2">
            <span className="absolute left-4 top-4 text-slate-400 font-bold">$</span>
            <input className="w-full p-4 pl-8 bg-slate-50 rounded-2xl outline-none" placeholder="Precio" type="number" onChange={e => setDatos({...datos, precio: e.target.value})} required />
          </div>
          <div className="relative w-1/2">
            <Percent className="absolute left-4 top-4 text-slate-400" size={18} />
            <input className="w-full p-4 pl-12 bg-slate-50 rounded-2xl outline-none" placeholder="% Comisión" type="number" onChange={e => setDatos({...datos, comision: e.target.value})} required />
          </div>
        </div>

        <div className="flex gap-2">
          <input className="w-1/3 p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Habs" type="number" onChange={e => setDatos({...datos, habitaciones: e.target.value})} />
          <input className="w-1/3 p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Baños" type="number" onChange={e => setDatos({...datos, banos: e.target.value})} />
          <input className="w-1/3 p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Zona" onChange={e => setDatos({...datos, zona: e.target.value})} required />
        </div>

        <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-green-100" placeholder="Tu WhatsApp (Agente)" onChange={e => setDatos({...datos, whatsapp: e.target.value})} required />

        <button disabled={subiendo} className="w-full bg-[#0056b3] text-white font-black py-5 rounded-[25px] flex items-center justify-center gap-3">
          {subiendo ? <Loader2 className="animate-spin" /> : 'PUBLICAR EN RED MLS'}
        </button>
      </div>
    </form>
  );
};