import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, MapPin, User, CheckCircle, Info, Home, Map, Share2, Trash2, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';

function CardPropiedad({ propiedad, usuarioActual, alActualizar, onNotificar, tasaBCV }) {
  const navigate = useNavigate();
  const [expandido, setExpandido] = useState(false);
  const [indiceFoto, setIndiceFoto] = useState(0); // Para el carrusel
  const esPropietario = usuarioActual?.id === propiedad.agente_id;
  const esAdmin = usuarioActual?.user_metadata?.rol === 'admin';
  const puedeEliminar = esPropietario || esAdmin;
  const vendido = propiedad.estado === 'vendido' || propiedad.estado === 'alquilado';

  // Combinamos la foto de portada con la galería (si existe) para tener todas las fotos disponibles
  const galeria = propiedad.galeria && propiedad.galeria.length > 0 
                  ? propiedad.galeria 
                  : (propiedad.imagen_url ? [propiedad.imagen_url] : []);
  
  const fotoActual = galeria.length > 0 ? galeria[indiceFoto] : 'https://via.placeholder.com/300';

  const precioUSD = Number(propiedad.precio);
  const precioBS = tasaBCV ? (precioUSD * tasaBCV) : null;

  const siguienteFoto = (e) => {
    e.stopPropagation();
    setIndiceFoto((prev) => (prev + 1) % galeria.length);
  };

  const anteriorFoto = (e) => {
    e.stopPropagation();
    setIndiceFoto((prev) => (prev - 1 + galeria.length) % galeria.length);
  };

  const mensajeWA = `Hola, solicito información de: ${propiedad.titulo} (${propiedad.zona})`;
  const urlWA = `https://wa.me/${propiedad.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(mensajeWA)}`;

  const compartirFicha = (e) => {
    e.stopPropagation();
    const texto = `🏡 *NUEVO INGRESO - NEXUSREAL*\n\n` +
                  `✨ *${propiedad.titulo}*\n` +
                  `📍 Zona: ${propiedad.zona}\n` +
                  `💰 Precio: $${Number(propiedad.precio).toLocaleString()}\n` +
                  `📐 Metraje: ${propiedad.metraje || '?'} m²\n` +
                  `🛏 Habitaciones: ${propiedad.habitaciones}\n` +
                  `🚿 Baños: ${propiedad.banos}\n\n` +
                  `ℹ *Más detalles y fotos aquí:* 👇\n` +
                  `${window.location.origin}/propiedad/${propiedad.id}`; 
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const eliminarPropiedad = async (e) => {
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de ELIMINAR esta propiedad? No se puede deshacer.")) return;
    try {
        await propiedadesService.eliminar(propiedad.id);
        alActualizar && alActualizar();
        onNotificar && onNotificar("Propiedad eliminada correctamente");
    } catch (e) {
        if (onNotificar) onNotificar("Error al eliminar: " + e.message, 'error');
        else alert("Error al eliminar: " + e.message);
    }
  };

  const cerrarOperacion = async (e) => {
    e.stopPropagation();
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
      if (onNotificar) onNotificar("¡Felicidades! Operación registrada.");
      else alert("¡Felicidades! Operación registrada.");
      
      alActualizar && alActualizar();
    } catch (e) {
      if (onNotificar) onNotificar("Error al cerrar: " + e.message, 'error');
      else alert("Error al cerrar: " + e.message);
    }
  };

  return (
    <div className="bg-white rounded-[25px] shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden relative group">
      
      <div className="relative h-48 cursor-pointer" onClick={() => navigate(`/propiedad/${propiedad.id}`)}>
        {/* Carrusel de Fotos */}
        <img 
            src={fotoActual} 
            alt={propiedad.titulo} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Controles del Carrusel (Solo si hay más de 1 foto) */}
        {galeria.length > 1 && (
            <>
                <button onClick={anteriorFoto} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full transition-opacity backdrop-blur-sm z-10">
                    <ChevronLeft size={20} />
                </button>
                <button onClick={siguienteFoto} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full transition-opacity backdrop-blur-sm z-10">
                    <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm z-10">
                    <Image size={10} /> {indiceFoto + 1}/{galeria.length}
                </div>
            </>
        )}

        {/* Badges Superiores */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg shadow-sm w-max ${propiedad.tipo_operacion === 'Alquiler' ? 'bg-purple-500 text-white' : 'bg-blue-600 text-white'}`}>
                {propiedad.tipo_operacion?.toUpperCase() || 'VENTA'}
            </span>
             <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] px-2 py-1 rounded-lg font-bold flex items-center gap-1 shadow-sm w-max">
                <Home size={10} /> {propiedad.tipo_inmueble || 'Inmueble'}
            </span>
        </div>

        {vendido && (
             <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4 text-center backdrop-blur-[2px] z-20">
                <CheckCircle size={32} className="mb-1 text-green-400" />
                <span className="text-lg font-black uppercase tracking-widest">{propiedad.estado}</span>
                <span className="text-[10px] mt-1 font-medium">por {propiedad.agente_cierre}</span>
                <span className="text-[10px] font-bold text-green-300">${Number(propiedad.precio_cierre).toLocaleString()}</span>
             </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col gap-2">
        <div onClick={() => navigate(`/propiedad/${propiedad.id}`)} className="cursor-pointer">
            <h3 className="text-slate-800 font-bold text-sm leading-tight truncate hover:text-blue-600 transition-colors">{propiedad.titulo}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate"><MapPin size={10} className="flex-shrink-0" /> <span className="truncate">{propiedad.zona}</span></p>
        </div>

        <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-[#0056b3]">${precioUSD.toLocaleString()}</span>
            {propiedad.tipo_operacion === 'Alquiler' && <span className="text-xs text-slate-400">/mes</span>}
            {precioBS && <span className="text-xs text-slate-500 ml-2">~ Bs. {precioBS.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>}
        </div>
        
        <div className="flex justify-between text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-2">
          <span>{propiedad.habitaciones} Habs</span>
          <span>{propiedad.banos} Baños</span>
          <span>{propiedad.metraje} m²</span>
        </div>

        {propiedad.agente_nombre && propiedad.whatsapp && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1 font-bold"><User size={12} /> {propiedad.agente_nombre}</span>
            <a href={urlWA} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors font-bold" onClick={e => e.stopPropagation()}>
              <MessageCircle size={14} /> Contactar
            </a>
          </div>
        )}

        {expandido && (
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl mt-1 leading-relaxed">
                {propiedad.descripcion || "Sin descripción detallada."}
                <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col gap-1 text-[10px] text-slate-400">
                    {propiedad.mapa_url && (
                        <a href={propiedad.mapa_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline" onClick={e => e.stopPropagation()}>
                            <Map size={10} /> Ver Ubicación en Mapa
                        </a>
                    )}
                </div>
            </div>
        )}

        <div className="mt-2 flex gap-2">
            <a href={urlWA} target="_blank" rel="noreferrer" className="flex-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 transition-colors shadow-sm" onClick={e => e.stopPropagation()}>
            <MessageCircle size={14} /> Contactar
            </a>
            <button onClick={compartirFicha} className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100">
                <Share2 size={16} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setExpandido(!expandido); }} className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                <Info size={16} />
            </button>
            {puedeEliminar && (
                <button onClick={eliminarPropiedad} className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100">
                    <Trash2 size={16} />
                </button>
            )}
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