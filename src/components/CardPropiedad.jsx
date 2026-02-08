import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, MapPin, User, CheckCircle, Info, Home, Map, Share2, Trash2, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';

function CardPropiedad({ propiedad, usuarioActual, alActualizar, onNotificar, tasaBCV }) {
  const navigate = useNavigate();
  const [expandido, setExpandido] = useState(false);
  const [indiceFoto, setIndiceFoto] = useState(0); 
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [datosCierre, setDatosCierre] = useState({ 
    precio: propiedad.precio, 
    agente: usuarioActual?.user_metadata?.nombre || "",
    comision_porcentaje: 5,
    comision_monto: (Number(propiedad.precio) * 0.05).toFixed(2)
  });

  const actualizarPrecioCierre = (valor) => {
    const precio = Number(valor);
    const monto = (precio * (Number(datosCierre.comision_porcentaje) / 100)).toFixed(2);
    setDatosCierre({ ...datosCierre, precio: valor, comision_monto: monto });
  };

  const actualizarComisionPorcentaje = (valor) => {
    const porcentaje = Number(valor);
    const monto = (Number(datosCierre.precio) * (porcentaje / 100)).toFixed(2);
    setDatosCierre({ ...datosCierre, comision_porcentaje: valor, comision_monto: monto });
  };
  
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

  const esDeMiAgencia = usuarioActual?.user_metadata?.organizacion_id === propiedad.organizacion_id;
  const esPropiedadMia = usuarioActual?.id === propiedad.agente_id;

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

  const confirmarCierre = async () => {
    if (!datosCierre.precio || !datosCierre.agente) {
        onNotificar && onNotificar("Por favor completa todos los campos", "error");
        return;
    }

    try {
      await propiedadesService.actualizar(propiedad.id, {
        estado: propiedad.tipo_operacion === 'Alquiler' ? 'alquilado' : 'vendido',
        precio_cierre: datosCierre.precio,
        fecha_cierre: new Date().toISOString(),
        agente_cierre: datosCierre.agente,
        comision_monto: datosCierre.comision_monto,
        comision_porcentaje: datosCierre.comision_porcentaje
      });
      
      onNotificar && onNotificar("¡Felicidades! Operación registrada con éxito 🚀", "success");
      setMostrarModalCierre(false);
      alActualizar && alActualizar();
    } catch (e) {
      onNotificar && onNotificar("Error al cerrar: " + e.message, 'error');
    }
  };

  return (
    <div className="bg-white rounded-[25px] shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden relative group">
      
      {/* MODAL DE CIERRE PERSONALIZADO */}
      {mostrarModalCierre && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-center text-white relative">
                    <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl"></div>
                    
                    <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                        <CheckCircle size={40} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tight">¡Cerrar Operación!</h3>
                    <p className="text-blue-100 text-sm mt-1 font-medium">Registra el éxito de esta propiedad</p>
                </div>

                <div className="p-8 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Precio Final ($)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input 
                                    type="number"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-8 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-slate-700"
                                    value={datosCierre.precio}
                                    onChange={(e) => actualizarPrecioCierre(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Comisión (%)</label>
                            <div className="relative">
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                <input 
                                    type="number"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-4 pr-10 outline-none focus:border-blue-500 transition-all font-bold text-slate-700"
                                    value={datosCierre.comision_porcentaje}
                                    onChange={(e) => actualizarComisionPorcentaje(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Comisión:</span>
                        <span className="text-xl font-black text-blue-700">${Number(datosCierre.comision_monto).toLocaleString()}</span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Agente que Cerró</label>
                        <input 
                            type="text"
                            placeholder="Nombre del agente"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-blue-500 transition-all font-bold text-slate-700"
                            value={datosCierre.agente}
                            onChange={(e) => setDatosCierre({...datosCierre, agente: e.target.value})}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                            onClick={() => setMostrarModalCierre(false)}
                            className="flex-1 bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
                        >
                            No, cancelar
                        </button>
                        <button 
                            onClick={confirmarCierre}
                            className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 uppercase text-xs tracking-widest"
                        >
                            Sí, cerrar ya
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

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

        {/* Badge de Red MLS / Agencia */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
            <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-lg backdrop-blur-md flex items-center gap-1.5 ${
                esPropiedadMia 
                ? 'bg-green-500/90 text-white border border-green-400/50' 
                : esDeMiAgencia 
                ? 'bg-blue-500/90 text-white border border-blue-400/50'
                : 'bg-slate-900/80 text-white border border-slate-700/50'
            }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${esPropiedadMia || esDeMiAgencia ? 'bg-white animate-pulse' : 'bg-blue-400'}`}></div>
                {esPropiedadMia ? 'Mi Propiedad' : propiedad.organizacion_nombre || 'Red MLS'}
            </div>
        </div>

        {vendido && (
             <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4 text-center backdrop-blur-[3px] z-20">
                <div className="bg-green-500 p-2 rounded-full mb-2 shadow-lg shadow-green-500/50">
                    <CheckCircle size={32} className="text-white" />
                </div>
                <span className="text-xl font-black uppercase tracking-[0.2em] mb-1">{propiedad.estado}</span>
                <div className="h-[2px] w-12 bg-green-500 mb-2"></div>
                <span className="text-[10px] font-medium opacity-80">Cerrado por:</span>
                <span className="text-xs font-black mb-2">{propiedad.agente_cierre || 'Agente Nexus'}</span>
                
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold uppercase text-green-400">Precio Final</span>
                    <span className="text-lg font-black">${Number(propiedad.precio_cierre || propiedad.precio).toLocaleString()}</span>
                    {propiedad.comision_monto && (
                        <>
                            <div className="h-[1px] w-full bg-white/10 my-1"></div>
                            <span className="text-[9px] font-bold uppercase text-blue-300">Comisión ({propiedad.comision_porcentaje}%)</span>
                            <span className="text-sm font-black text-blue-200">${Number(propiedad.comision_monto).toLocaleString()}</span>
                        </>
                    )}
                </div>
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
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setMostrarModalCierre(true);
                }} 
                className="w-full mt-1 border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 text-[10px] font-bold py-2 rounded-xl transition-all"
             >
                Cerrar Operación
            </button>
        )}
      </div>
    </div>
  );
}

export default CardPropiedad;