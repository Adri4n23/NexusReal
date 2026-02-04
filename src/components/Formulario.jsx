import React, { useState } from 'react';
import { Camera, Loader2, Percent } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';

export const Formulario = ({ usuario, alTerminar }) => {
  const [subiendo, setSubiendo] = useState(false);
  const [foto, setFoto] = useState(null);
  const [datos, setDatos] = useState({
    titulo: '', precio: '', whatsapp: '', zona: '', 
    habitaciones: '', banos: '', comision: '5',
    tipo_inmueble: 'Apartamento', tipo_operacion: 'Venta', descripcion: '',
    metraje: '', mapa_url: ''
  });

  const enviar = async (e) => {
    e.preventDefault();
    setSubiendo(true);
    try {
      let url = null;
      if (foto) {
        url = await propiedadesService.subirFoto(foto);
      }
      // Se guarda el estado inicial como 'disponible'
      await propiedadesService.crear({...datos, imagen_url: url, estado: 'disponible'}, usuario);
      setFoto(null);
      setDatos({
        titulo: '', precio: '', whatsapp: '', zona: '', 
        habitaciones: '', banos: '', comision: '5',
        tipo_inmueble: 'Apartamento', tipo_operacion: 'Venta', descripcion: '',
        metraje: '', mapa_url: ''
      });
      e.target.reset();
      alTerminar();
    } catch (err) { 
      console.error(err);
      alert("Error: " + (err.message || "Error desconocido al guardar."));
    }
    setSubiendo(false);
  };

  return (
    <form onSubmit={enviar} className="bg-white p-8 rounded-[40px] shadow-2xl mb-10 border border-slate-100">
      <h2 className="text-xl font-black text-slate-800 mb-6 uppercase italic">REGISTRO MLS</h2>
      
      <div className="space-y-4">
        <div className="relative w-full h-48 bg-slate-50 rounded-[30px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden">
          {foto ? <img src={URL.createObjectURL(foto)} className="w-full h-full object-cover" alt="Preview" /> : <Camera className="text-slate-300" size={40} />}
          <input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>

        <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Nombre de la propiedad" onChange={e => setDatos({...datos, titulo: e.target.value})} value={datos.titulo} required />
        
        <div className="flex gap-2">
          <select className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none text-slate-600" value={datos.tipo_operacion} onChange={e => setDatos({...datos, tipo_operacion: e.target.value})}>
            <option value="Venta">Venta</option>
            <option value="Alquiler">Alquiler</option>
          </select>
          <select className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none text-slate-600" value={datos.tipo_inmueble} onChange={e => setDatos({...datos, tipo_inmueble: e.target.value})}>
            <option value="Apartamento">Apartamento</option>
            <option value="Casa">Casa</option>
            <option value="Habitación">Habitación</option>
            <option value="Estudio">Estudio</option>
            <option value="Finca">Finca</option>
            <option value="Granja">Granja</option>
            <option value="Terreno">Terreno</option>
          </select>
        </div>

        <div className="flex gap-2">
          <input className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none" placeholder="$ Precio" type="number" onChange={e => setDatos({...datos, precio: e.target.value})} value={datos.precio} required />
          <div className="relative w-1/2">
            <Percent className="absolute left-4 top-4 text-slate-400" size={18} />
            <input className="w-full p-4 pl-12 bg-slate-50 rounded-2xl outline-none" placeholder="Comisión %" type="number" onChange={e => setDatos({...datos, comision: e.target.value})} value={datos.comision} required />
          </div>
        </div>

        <div className="flex gap-2">
          <input className="w-1/3 p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Habs" type="number" onChange={e => setDatos({...datos, habitaciones: e.target.value})} value={datos.habitaciones} />
          <input className="w-1/3 p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Baños" type="number" onChange={e => setDatos({...datos, banos: e.target.value})} value={datos.banos} />
          <input className="w-1/3 p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Zona" onChange={e => setDatos({...datos, zona: e.target.value})} value={datos.zona} required />
        </div>

        <div className="flex gap-2">
            <input className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Metraje (m²)" type="number" onChange={e => setDatos({...datos, metraje: e.target.value})} value={datos.metraje} required />
            <input className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Link Google Maps" onChange={e => setDatos({...datos, mapa_url: e.target.value})} value={datos.mapa_url} />
        </div>

        <textarea className="w-full p-4 bg-slate-50 rounded-2xl outline-none min-h-[100px]" placeholder="Descripción detallada: características, ubicación exacta, etc." onChange={e => setDatos({...datos, descripcion: e.target.value})} value={datos.descripcion} />

        <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-green-100" placeholder="Tu WhatsApp (Agente)" onChange={e => setDatos({...datos, whatsapp: e.target.value})} value={datos.whatsapp} required />

        <button disabled={subiendo} className="w-full bg-[#0056b3] text-white font-black py-5 rounded-[25px] flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all">
          {subiendo ? <Loader2 className="animate-spin" /> : 'PUBLICAR EN RED MLS'}
        </button>
      </div>
    </form>
  );
};