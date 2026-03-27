import React, { useState } from 'react';
import { Camera, Loader2, Percent, Wand2, MapPin, Building2, Ruler } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';
import { parsearTextoWhatsApp } from '../utils/whatsappParser';

export const Formulario = ({ usuario, alTerminar, onError }) => {
  const [subiendo, setSubiendo] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [mostrarImportador, setMostrarImportador] = useState(false);
  const [textoWA, setTextoWA] = useState('');

  const [datos, setDatos] = useState({
    titulo: '',
    precio: '',
    whatsapp: usuario?.user_metadata?.telefono || '',
    zona: '',
    habitaciones: '',
    banos: '',
    comision: '5',
    tipo_inmueble: 'Apartamento',
    tipo_operacion: 'Venta',
    descripcion: '',
    metraje: '',
    mapa_url: ''
  });

  const importarDesdeWA = () => {
    const datosExtraidos = parsearTextoWhatsApp(textoWA);
    setDatos(prev => ({
      ...prev,
      ...datosExtraidos,
      whatsapp: prev.whatsapp
    }));
    setMostrarImportador(false);
  };

  const manejarFotos = (e) => {
    if (e.target.files) {
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
        galeriaUrls = await propiedadesService.subirGaleria(fotos);
        imagenPortada = galeriaUrls[0];
      }

      const datosLimpios = { ...datos };
      if (!datosLimpios.metraje) delete datosLimpios.metraje;
      if (!datosLimpios.habitaciones) delete datosLimpios.habitaciones;
      if (!datosLimpios.banos) delete datosLimpios.banos;

      await propiedadesService.crear({
        ...datosLimpios,
        imagen_url: imagenPortada,
        galeria: galeriaUrls,
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
      if (onError) onError("Error: " + err.message);
    }
    setSubiendo(false);
  };

  return (
    <form onSubmit={enviar} className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl shadow-blue-900/10 mb-10 border border-slate-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
          <Building2 size={20} />
        </div>
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Registro de Propiedad</h2>
      </div>

      {/* IMPORTADOR WA */}
      <div className="mb-8 p-1 bg-slate-50 rounded-3xl border border-slate-200">
        <button
          type="button"
          onClick={() => setMostrarImportador(!mostrarImportador)}
          className="w-full bg-white text-blue-600 font-black py-4 rounded-[22px] flex items-center justify-center gap-2 hover:bg-blue-50 transition-all uppercase text-[10px] tracking-widest border border-slate-100 shadow-sm"
        >
          <Wand2 size={18} />
          {mostrarImportador ? 'Cerrar Asistente' : '¿Importar desde WhatsApp?'}
        </button>

        {mostrarImportador && (
          <div className="p-4 pt-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <textarea
              className="w-full p-5 bg-white rounded-2xl border-2 border-slate-100 outline-none text-sm font-medium text-slate-600 placeholder:text-slate-300 focus:border-blue-400 transition-all"
              rows="6"
              placeholder="Pega aquí la descripción completa del inmueble..."
              value={textoWA}
              onChange={(e) => setTextoWA(e.target.value)}
            ></textarea>
            <button
              type="button"
              onClick={importarDesdeWA}
              className="w-full mt-3 bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 uppercase text-[10px]"
            >
              ✨ Extraer Información
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARGA FOTOS */}
        <div className="relative w-full h-56 bg-white rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden md:col-span-2 group hover:border-blue-500 hover:bg-blue-50/30 transition-all">
          {fotos.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto p-4 w-full h-full items-center scrollbar-hide">
              {fotos.map((f, i) => (
                <img key={i} src={URL.createObjectURL(f)} className="h-full w-36 object-cover rounded-2xl shadow-xl border-2 border-white flex-shrink-0" alt="Preview" />
              ))}
              <div className="h-20 flex items-center justify-center px-6 bg-blue-600/10 rounded-2xl text-[10px] font-black text-blue-600 uppercase tracking-widest min-w-[120px]">
                +{fotos.length} Fotos
              </div>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:bg-white transition-all mb-3 border border-slate-100">
                <Camera size={24} />
              </div>
              <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Subir Multimedia (Máx 10)</span>
            </>
          )}
          <input type="file" multiple accept="image/*" onChange={manejarFotos} className="absolute inset-0 opacity-0 cursor-pointer" title="Seleccionar fotos" />
        </div>

        {/* CAMPOS BASICOS */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título de la Publicación</label>
          <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:bg-white border-2 border-slate-50 focus:border-blue-500 transition-all font-bold text-slate-700" placeholder="Ej: Penthouse Lujo Las Mercedes" onChange={e => setDatos({ ...datos, titulo: e.target.value })} value={datos.titulo} required />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Operación</label>
          <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-blue-500 font-bold text-slate-700" value={datos.tipo_operacion} onChange={e => setDatos({ ...datos, tipo_operacion: e.target.value })}>
            <option value="Venta">Venta</option>
            <option value="Alquiler">Alquiler</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Inmueble</label>
          <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-blue-500 font-bold text-slate-700" value={datos.tipo_inmueble} onChange={e => setDatos({ ...datos, tipo_inmueble: e.target.value })}>
            <option value="Apartamento">Apartamento</option>
            <option value="Casa">Casa</option>
            <option value="Local">Local Comercial</option>
            <option value="Galpón">Galpón (Industrial)</option>
            <option value="Finca">Finca</option>
            <option value="Granja">Granja</option>
            <option value="Terreno">Terreno</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Precio ($)</label>
          <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-blue-500 font-bold text-slate-700" placeholder="$ 0.00" type="number" onChange={e => setDatos({ ...datos, precio: e.target.value })} value={datos.precio} required />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Comisión (%)</label>
          <div className="relative">
            <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input className="w-full p-4 pl-12 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-blue-500 font-bold text-slate-700" placeholder="5" type="number" onChange={e => setDatos({ ...datos, comision: e.target.value })} value={datos.comision} required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 md:col-span-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Habs</label>
            <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-blue-500 font-bold text-slate-700 text-center" type="number" onChange={e => setDatos({ ...datos, habitaciones: e.target.value })} value={datos.habitaciones} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Baños</label>
            <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-blue-500 font-bold text-slate-700 text-center" type="number" onChange={e => setDatos({ ...datos, banos: e.target.value })} value={datos.banos} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Zona</label>
            <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-blue-500 font-bold text-slate-700" placeholder="Ubicación" onChange={e => setDatos({ ...datos, zona: e.target.value })} value={datos.zona} required />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Metraje (m²)</label>
          <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-blue-500 font-bold text-slate-700" placeholder="Opcional" type="number" onChange={e => setDatos({ ...datos, metraje: e.target.value })} value={datos.metraje} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Link Mapa</label>
          <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-blue-500 font-bold text-slate-700" placeholder="Google Maps" onChange={e => setDatos({ ...datos, mapa_url: e.target.value })} value={datos.mapa_url} />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descripción del Inmueble</label>
          <textarea className="w-full p-5 bg-slate-50 rounded-[32px] outline-none border-2 border-slate-50 focus:border-blue-500 font-medium text-slate-600 min-h-[140px]" placeholder="Detalla las características principales..." onChange={e => setDatos({ ...datos, descripcion: e.target.value })} value={datos.descripcion} />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tu WhatsApp de Contacto</label>
          <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-blue-100 focus:border-blue-500 font-black text-blue-600" placeholder="+58..." onChange={e => setDatos({ ...datos, whatsapp: e.target.value })} value={datos.whatsapp} required />
        </div>

        <button disabled={subiendo} className="w-full bg-blue-600 text-white font-black py-5 rounded-[28px] flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all md:col-span-2 mt-4 uppercase text-xs tracking-widest">
          {subiendo ? <Loader2 className="animate-spin" /> : 'Publicar Inmueble'}
        </button>
      </div>
    </form>
  );
};