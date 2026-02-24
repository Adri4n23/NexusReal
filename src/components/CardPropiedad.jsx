import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, MapPin, User, CheckCircle, Info, Home, Map, Share2, Trash2, ChevronLeft, ChevronRight, Image, Banknote, Tag, Percent, DollarSign, Ruler, Bath, Bed, Calendar, X, Star, ArrowRight, TrendingUp } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';

function CardPropiedad({ propiedad, usuarioActual, alActualizar, onNotificar, tasaBCV }) {
  const navigate = useNavigate();
  const [expandido, setExpandido] = useState(false);
  const [indiceFoto, setIndiceFoto] = useState(0); 
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [agentesDisponibles, setAgentesDisponibles] = useState([]);
  const [datosCierre, setDatosCierre] = useState({ 
    precio: propiedad.precio, 
    agentes_comision: [], // Array to hold selected agents and their commission
    comision_porcentaje_total_venta: 5, // Total commission percentage for the sale (fixed at 5%)
    nota_cierre: "" // New field for notes
  });

  // Calculate total commission amount based on sale price and fixed total commission percentage
  const comisionTotalVentaMonto = (Number(datosCierre.precio) * (datosCierre.comision_porcentaje_total_venta / 100)).toFixed(2);

  // Calculate the sum of percentages assigned to agents for distribution
  const totalComisionAgentesAsignada = datosCierre.agentes_comision.reduce((sum, agente) => sum + Number(agente.comision_porcentaje), 0);

  useEffect(() => {
    const cargarAgentes = async () => {
      if (usuarioActual?.user_metadata?.organizacion_id) {
        const agentes = await propiedadesService.obtenerAgentesPorOrganizacion(usuarioActual.user_metadata.organizacion_id);
        setAgentesDisponibles(agentes);
      }
    };
    cargarAgentes();
  }, [usuarioActual]); // Reload agents if the current user changes

  const actualizarPrecioCierre = (valor) => {
    setDatosCierre({ ...datosCierre, precio: valor });
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
  const numeroWA = String(propiedad.whatsapp || '').replace(/\D/g, '');
  const urlWA = `https://wa.me/${numeroWA}?text=${encodeURIComponent(mensajeWA)}`;

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
    const agentesComision = Array.isArray(datosCierre.agentes_comision) ? datosCierre.agentes_comision : [];

    if (!datosCierre.precio || agentesComision.length === 0) {
      onNotificar && onNotificar("Por favor completa todos los campos y asigna al menos un agente", "error");
      return;
    }
                
    if (totalComisionAgentesAsignada !== 100) {
      onNotificar && onNotificar("La suma de los porcentajes de comisión de los agentes debe ser exactamente 100%.", "error");
      return;
    }

    try {
      await propiedadesService.cerrarVenta(propiedad.id, {
        precio_cierre: datosCierre.precio,
        comision_total: comisionTotalVentaMonto, // Use the dynamically calculated total commission amount
        comision_porcentaje_total: datosCierre.comision_porcentaje_total_venta, // Use the fixed total commission percentage
        agentes_comision: agentesComision, // Use agentesComision here
        nota_cierre: datosCierre.nota_cierre,
        titulo_propiedad: propiedad.titulo, // Pass for notification
        zona_propiedad: propiedad.zona // Pass for notification
      }, usuarioActual);
      
      onNotificar && onNotificar("¡Felicidades! Operación registrada con éxito 🚀", "success");
      setMostrarModalCierre(false);
      alActualizar && alActualizar();
    } catch (e) {
      onNotificar && onNotificar("Error al cerrar: " + e.message, 'error');
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/5 hover:border-amber-500/30 transition-all duration-500 shadow-2xl">
      
      {/* MODAL DE CIERRE PERSONALIZADO */}
      {mostrarModalCierre && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
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
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Comisión Total de Venta (%)</label>
                            <div className="relative">
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                <input 
                                    type="number"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-4 pr-10 outline-none focus:border-blue-500 transition-all font-bold text-slate-700"
                                    value={datosCierre.comision_porcentaje_total_venta}
                                    readOnly // Make it read-only as it's fixed at 5%
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Monto Total Comisión:</span>
                        <span className="text-xl font-black text-blue-700">${Number(comisionTotalVentaMonto).toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Agentes y Comisiones</label>
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-blue-500 transition-all font-bold text-slate-700"
                                        onChange={(e) => {
                                            const agenteId = e.target.value;
                                            const agenteExistente = datosCierre.agentes_comision.find(a => a.id === agenteId);
                                            if (agenteId && !agenteExistente) {
                                                const agenteSeleccionado = agentesDisponibles.find(a => a.id === agenteId);
                                                setDatosCierre({
                                                    ...datosCierre,
                                                    agentes_comision: [...datosCierre.agentes_comision, { ...agenteSeleccionado, comision_porcentaje: 0 }]
                                                });
                                            }
                                        }}
                                        value=""
                                    >
                                        <option value="" disabled>Selecciona un agente</option>
                                        {agentesDisponibles.map(agente => (
                                            <option key={agente.id} value={agente.id} disabled={datosCierre.agentes_comision.some(a => a.id === agente.id)}>
                                                {agente.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {datosCierre.agentes_comision.map((agente, index) => {
                                    const montoComisionAgente = (comisionTotalVentaMonto * (Number(agente.comision_porcentaje) / 100)).toFixed(2);
                                    const montoComisionAgencia = (montoComisionAgente * 0.30).toFixed(2); // 30% para la agencia
                                    const montoNetoAgente = (montoComisionAgente * 0.70).toFixed(2); // 70% para el agente

                                    return (
                                        <div key={agente.id} className="flex flex-col gap-1 mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <span className="flex-1 text-sm font-bold text-slate-700">{agente.nombre}</span>
                                                <div className="relative w-24">
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white border-2 border-slate-100 rounded-lg py-1 pl-3 pr-7 outline-none focus:border-blue-500 transition-all font-bold text-slate-700 text-sm"
                                                        value={agente.comision_porcentaje}
                                                        onChange={(e) => {
                                                            const newComision = Number(e.target.value);
                                                            const updatedAgentes = datosCierre.agentes_comision.map((a, i) =>
                                                                i === index ? { ...a, comision_porcentaje: newComision } : a
                                                            );
                                                            setDatosCierre({ ...datosCierre, agentes_comision: updatedAgentes });
                                                        }}
                                                        min="0"
                                                        max="100"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const updatedAgentes = datosCierre.agentes_comision.filter(a => a.id !== agente.id);
                                                        setDatosCierre({ ...datosCierre, agentes_comision: updatedAgentes });
                                                    }}
                                                    className="text-red-500 hover:text-red-700 ml-2"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 font-medium">
                                                <span className="col-span-1">Comisión: ${Number(montoComisionAgente).toLocaleString()}</span>
                                                <span className="col-span-1">Agencia (30%): ${Number(montoComisionAgencia).toLocaleString()}</span>
                                                <span className="col-span-1">Neto Agente (70%): ${Number(montoNetoAgente).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 flex justify-between items-center mt-4">
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Comisión restante por asignar:</span>
                                    <span className={`text-lg font-black ${totalComisionAgentesAsignada > 100 ? 'text-red-500' : 'text-blue-700'}`}>
                                        {(100 - totalComisionAgentesAsignada).toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Notas de Cierre (Opcional)</label>
                                <textarea
                                    placeholder="Detalles adicionales sobre el cierre..."
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-blue-500 transition-all font-bold text-slate-700 h-full resize-none"
                                    value={datosCierre.nota_cierre}
                                    onChange={(e) => setDatosCierre({...datosCierre, nota_cierre: e.target.value})}
                                ></textarea>
                            </div>
                        </div>
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

      {/* Imagen con Overlay */}
      <div className="relative h-72 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
        <img 
          src={fotoActual}
          alt={propiedad.titulo}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-amber-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
            {propiedad.tipo_operacion || 'Exclusivo'}
          </span>
        </div>
        <div className="absolute top-4 right-4 z-20">
          <button className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-amber-500 transition-colors">
            <Star size={16} />
          </button>
        </div>
      </div>
      
      {/* Contenido */}
      <div className="p-6">
        <div className="flex items-center gap-2 text-amber-500/80 text-xs mb-2">
          <MapPin size={12} />
          <span className="uppercase tracking-widest">{propiedad.zona}</span>
        </div>
        
        <h3 className="text-xl font-serif text-white mb-4 group-hover:text-amber-500 transition-colors">
          {propiedad.titulo}
        </h3>

        {/* Detalles Técnicos */}
        <div className="grid grid-cols-3 gap-4 border-y border-white/5 py-4 mb-4">
          <div className="flex flex-col items-center">
            <Bed size={18} className="text-gray-500 mb-1" />
            <span className="text-sm text-gray-300">{propiedad.habitaciones} Hab</span>
          </div>
          <div className="flex flex-col items-center border-x border-white/5">
            <Bath size={18} className="text-gray-500 mb-1" />
            <span className="text-sm text-gray-300">{propiedad.banos} Baños</span>
          </div>
          <div className="flex flex-col items-center">
            <Ruler size={18} className="text-gray-500 mb-1" />
            <span className="text-sm text-gray-300">{propiedad.metraje} m²</span>
          </div>
        </div>

        {/* Precios */}
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">
              ${precioUSD.toLocaleString('en-US')}
            </span>
            {precioBS && (
              <div className="flex items-center text-amber-500 font-mono text-sm">
                <TrendingUp size={14} className="mr-1" />
                <span>Bs. {precioBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
        </div>

        <button onClick={() => navigate(`/propiedad/${propiedad.id}`)} className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all duration-300 font-bold text-sm uppercase tracking-widest">
          Ver Detalles <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default CardPropiedad;