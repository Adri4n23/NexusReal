import React, { useState } from 'react';
import { Camera, Loader2, Percent, Wand2 } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';
import { parsearTextoWhatsApp } from '../utils/whatsappParser';

export const Formulario = ({ usuario, alTerminar, onError }) => {
  const [subiendo, setSubiendo] = useState(false);
  const [fotos, setFotos] = useState([]); // Ahora es un array de fotos
  const [mostrarImportador, setMostrarImportador] = useState(false);
  const [textoWA, setTextoWA] = useState('');
  
  const [datos, setDatos] = useState({
    titulo: '', precio: '', whatsapp: '', zona: '', 
    habitaciones: '', banos: '', comision: '5',
    tipo_inmueble: 'Apartamento', tipo_operacion: 'Venta', descripcion: '',
    metraje: '', mapa_url: ''
  });

  const importarDesdeWA = () => {
    const datosExtraidos = parsearTextoWhatsApp(textoWA);
    setDatos(prev => ({
        ...prev,
        ...datosExtraidos,
        // Preservamos el whatsapp del agente si ya lo puso, sino lo dejamos vacío
        whatsapp: prev.whatsapp 
    }));
    setMostrarImportador(false);
  };

  const manejarFotos = (e) => {
    if (e.target.files) {
        // Convertimos FileList a Array y lo sumamos a lo que ya haya (máximo 10)
        const nuevasFotos = Array.from(e.target.files);
        setFotos(prev => [...prev, ...nuevasFotos].slice(0, 10));
    }
  };

  const enviar = async (e) => {
    e.preventDefault();
    setSubiendo(true);
    try {
      let galeriaUrls = [];
      let imagenPortada = null;

      if (fotos.length > 0) {
        // Subimos todas las fotos
        galeriaUrls = await propiedadesService.subirGaleria(fotos);
        imagenPortada = galeriaUrls[0]; // La primera es la portada
      }
      
      // Se guarda el estado inicial como 'disponible'
      // Limpieza de datos antes de enviar
      const datosLimpios = { ...datos };
      if (!datosLimpios.metraje) delete datosLimpios.metraje;
      if (!datosLimpios.habitaciones) delete datosLimpios.habitaciones;
      if (!datosLimpios.banos) delete datosLimpios.banos;

      await propiedadesService.crear({
          ...datosLimpios, 
          imagen_url: imagenPortada, 
          galeria: galeriaUrls, // Guardamos todas las URLs
          estado: 'disponible'
      }, usuario);
      
      setFotos([]);
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
      if (onError) {
        onError("Error: " + (err.message || "Error desconocido al guardar."));
      } else {
        alert("Error: " + (err.message || "Error desconocido al guardar."));
      }
    }
    setSubiendo(false);
  };

  return (
    <form onSubmit={enviar} className="bg-white p-6 md:p-8 rounded-[40px] shadow-2xl mb-10 border border-slate-100">
      <h2 className="text-xl font-black text-slate-800 mb-6 uppercase italic">REGISTRO MLS</h2>
      
      {/* BOTÓN MÁGICO DE IMPORTACIÓN */}
      <div className="mb-6">
        <button 
            type="button"
            onClick={() => setMostrarImportador(!mostrarImportador)}
            className="w-full bg-green-50 text-green-700 border border-green-200 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
        >
            <Wand2 size={20} />
            {mostrarImportador ? 'Ocultar Importador' : '¿Copiar desde WhatsApp?'}
        </button>

        {mostrarImportador && (
            <div className="mt-4 animate-in slide-in-from-top-2">
                <textarea 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-green-100 outline-none text-xs"
                    rows="5"
                    placeholder="Pega aquí el mensaje completo de WhatsApp con la descripción de la casa..."
                    value={textoWA}
                    onChange={(e) => setTextoWA(e.target.value)}
                ></textarea>
                <button 
                    type="button"
                    onClick={importarDesdeWA}
                    className="w-full mt-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors"
                >
                    ✨ Extraer Datos Automáticamente
                </button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative w-full h-48 bg-slate-50 rounded-[30px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden md:col-span-2 group hover:border-blue-400 transition-colors">
          {fotos.length > 0 ? (
             <div className="flex gap-2 overflow-x-auto p-2 w-full h-full items-center">
                {fotos.map((f, i) => (
                    <img key={i} src={URL.createObjectURL(f)} className="h-full w-32 object-cover rounded-xl shadow-md flex-shrink-0" alt="Preview" />
                ))}
                <div className="h-full flex items-center justify-center px-4 bg-slate-100 rounded-xl text-xs font-bold text-slate-400 min-w-[100px]">
                    +{fotos.length} Fotos
                </div>
             </div>
          ) : (
             <>
                <Camera className="text-slate-300 mb-2 group-hover:text-blue-400 transition-colors" size={40} />
                <span className="text-slate-400 text-sm font-medium">Toca para subir fotos (Máx 10)</span>
             </>
          )}
          <input type="file" multiple accept="image/*" onChange={manejarFotos} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>

        <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none md:col-span-2" placeholder="Nombre de la propiedad" onChange={e => setDatos({...datos, titulo: e.target.value})} value={datos.titulo} required />
        
        <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-slate-600" value={datos.tipo_operacion} onChange={e => setDatos({...datos, tipo_operacion: e.target.value})}>
            <option value="Venta">Venta</option>
            <option value="Alquiler">Alquiler</option>
        </select>
        <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-slate-600" value={datos.tipo_inmueble} onChange={e => setDatos({...datos, tipo_inmueble: e.target.value})}>
            <option value="Apartamento">Apartamento</option>
            <option value="Casa">Casa</option>
            <option value="Habitación">Habitación</option>
            <option value="Estudio">Estudio</option>
            <option value="Finca">Finca</option>
            <option value="Granja">Granja</option>
            <option value="Terreno">Terreno</option>
        </select>

        <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="$ Precio" type="number" onChange={e => setDatos({...datos, precio: e.target.value})} value={datos.precio} required />
        
        <div className="relative w-full">
            <Percent className="absolute left-4 top-4 text-slate-400" size={18} />
            <input className="w-full p-4 pl-12 bg-slate-50 rounded-2xl outline-none" placeholder="Comisión %" type="number" onChange={e => setDatos({...datos, comision: e.target.value})} value={datos.comision} required />
        </div>

        <div className="grid grid-cols-3 gap-2 md:col-span-2">
          <input className="w-full p-3 bg-slate-50 rounded-2xl outline-none text-sm text-center" placeholder="Habs" type="number" onChange={e => setDatos({...datos, habitaciones: e.target.value})} value={datos.habitaciones} />
          <input className="w-full p-3 bg-slate-50 rounded-2xl outline-none text-sm text-center" placeholder="Baños" type="number" onChange={e => setDatos({...datos, banos: e.target.value})} value={datos.banos} />
          <input className="w-full p-3 bg-slate-50 rounded-2xl outline-none text-sm text-center" placeholder="Zona" onChange={e => setDatos({...datos, zona: e.target.value})} value={datos.zona} required />
        </div>

        <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Metraje (m²) - Opcional" type="number" onChange={e => setDatos({...datos, metraje: e.target.value})} value={datos.metraje} />
        <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Link Google Maps - Opcional" onChange={e => setDatos({...datos, mapa_url: e.target.value})} value={datos.mapa_url} />

        <textarea className="w-full p-4 bg-slate-50 rounded-2xl outline-none min-h-[100px] md:col-span-2" placeholder="Descripción detallada: características, ubicación exacta, etc." onChange={e => setDatos({...datos, descripcion: e.target.value})} value={datos.descripcion} />

        <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-green-100 md:col-span-2" placeholder="Tu WhatsApp (Agente)" onChange={e => setDatos({...datos, whatsapp: e.target.value})} value={datos.whatsapp} required />

        <button disabled={subiendo} className="w-full bg-[#0056b3] text-white font-black py-5 rounded-[25px] flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all md:col-span-2">
          {subiendo ? <Loader2 className="animate-spin" /> : 'PUBLICAR EN RED MLS'}
        </button>
      </div>
    </form>
  );
};