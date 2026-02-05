import React, { useState } from 'react';
import { MessageCircle, MapPin, User, CheckCircle, Info, Home, Map, Share2, Trash2 } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';

function CardPropiedad({ propiedad, usuarioActual, alActualizar }) {
  const [expandido, setExpandido] = useState(false);
  const esPropietario = usuarioActual?.id === propiedad.agente_id;
  const vendido = propiedad.estado === 'vendido' || propiedad.estado === 'alquilado';

  const mensajeWA = `Hola, solicito información de: ${propiedad.titulo} (${propiedad.zona})`;
  const urlWA = `https://wa.me/${propiedad.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(mensajeWA)}`;

  const compartirFicha = () => {
    const texto = `🏡 *NUEVO INGRESO - NEXUSREAL*\n\n` +
                  `✨ *${propiedad.titulo}*\n` +
                  `📍 Zona: ${propiedad.zona}\n` +
                  `💰 Precio: $${Number(propiedad.precio).toLocaleString()}\n` +
                  `📐 Metraje: ${propiedad.metraje || '?'} m²\n` +
                  `🛏 Habitaciones: ${propiedad.habitaciones}\n` +
                  `🚿 Baños: ${propiedad.banos}\n\n` +
                  `ℹ *Más detalles y fotos aquí:* 👇\n` +
                  `https://nexusreal.vercel.app`; 
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const eliminarPropiedad = async () => {
    if (!window.confirm("¿Estás seguro de ELIMINAR esta propiedad? No se puede deshacer.")) return;
    try {
        await propiedadesService.eliminar(propiedad.id);
        alActualizar && alActualizar();
    } catch (e) {
        alert("Error al eliminar: " + e.message);
    }
  };

  const cerrarOperacion = async () => {
    if (!window.confirm("¿Confirmar cierre de operación?")) return;
    
    const precioFinal = prompt("Precio final de cierre:", propiedad.precio);
    if (!precioFinal) return;
    
    const agenteCierre = prompt("Nombre del Agente que cerró (o Inmobiliaria):", usuarioActual?.user_metadata?.nombre || "Yo");
    
    try {
      await propiedadesService.actualizar(propiedad.id, {
        estado: propiedad.tipo_operacion === 'Alquiler' ? 'alquilado' : 'vendido',
        precio_cierre: precioFinal,
        fecha_cierre: new Date().toISOString(),
        agente_cierre: agenteCierre
      });
      alert("¡Felicidades! Operación registrada.");
      alActualizar && alActualizar();
    } catch (e) {
      alert("Error al cerrar: " + e.message);
    }
  };

  return (
    <div className={`w-full md:max-w-[240px] bg-white rounded-[30px] overflow-hidden shadow-xl border border-slate-100 flex flex-col transition-all duration-300 ${vendido ? 'opacity-75 grayscale-[0.5]' : ''}`}>
      <div className="h-40 bg-slate-200 relative">
        <img src={propiedad.imagen_url || 'https://via.placeholder.com/300'} className="w-full h-full object-cover" alt="Propiedad" />
        
        {/* Badges Superiores */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg shadow-sm w-max ${propiedad.tipo_operacion === 'Alquiler' ? 'bg-purple-500 text-white' : 'bg-blue-600 text-white'}`}>
                {propiedad.tipo_operacion?.toUpperCase() || 'VENTA'}
            </span>
             <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] px-2 py-1 rounded-lg font-bold flex items-center gap-1 shadow-sm w-max">
                <Home size={10} /> {propiedad.tipo_inmueble || 'Inmueble'}
            </span>
        </div>

        {vendido && (
             <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4 text-center backdrop-blur-[2px]">
                <CheckCircle size={32} className="mb-1 text-green-400" />
                <span className="text-lg font-black uppercase tracking-widest">{propiedad.estado}</span>
                <span className="text-[10px] mt-1 font-medium">por {propiedad.agente_cierre}</span>
                <span className="text-[10px] font-bold text-green-300">${Number(propiedad.precio_cierre).toLocaleString()}</span>
             </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col gap-2">
        <div>
            <h3 className="text-slate-800 font-bold text-sm leading-tight truncate">{propiedad.titulo}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={10} /> {propiedad.zona}</p>
        </div>

        <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-[#0056b3]">${Number(propiedad.precio).toLocaleString()}</span>
            {propiedad.tipo_operacion === 'Alquiler' && <span className="text-xs text-slate-400">/mes</span>}
        </div>
        
        <div className="flex justify-between text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-2">
          <span>{propiedad.habitaciones} Habs</span>
          <span>{propiedad.banos} Baños</span>
          <span>{propiedad.metraje} m²</span>
        </div>

        {expandido && (
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl mt-1 leading-relaxed">
                {propiedad.descripcion || "Sin descripción detallada."}
                <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col gap-1 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><User size={10} /> Captado por: {propiedad.agente_nombre}</span>
                    {propiedad.mapa_url && (
                        <a href={propiedad.mapa_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                            <Map size={10} /> Ver Ubicación en Mapa
                        </a>
                    )}
                </div>
            </div>
        )}

        <div className="mt-2 flex gap-2">
            <a href={urlWA} target="_blank" rel="noreferrer" className="flex-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 transition-colors shadow-sm">
            <MessageCircle size={14} /> Contactar
            </a>
            <button onClick={compartirFicha} className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100">
                <Share2 size={16} />
            </button>
            <button onClick={() => setExpandido(!expandido)} className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                <Info size={16} />
            </button>
        </div>

        {esPropietario && !vendido && (
             <button onClick={cerrarOperacion} className="w-full mt-1 border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 text-[10px] font-bold py-2 rounded-xl transition-all">
                Cerrar Operación
            </button>
        )}
      </div>
    </div>
  );
}

export default CardPropiedad;
