import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, DollarSign, Ruler, Bath, Bed, X, Star, ArrowRight, Building2, Users } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';
import { FavoritosService } from '../services/FavoritosService';
import BlurUpImage from './BlurUpImage';

/**
 * Tarjeta de Propiedad Premium de NexusReal.
 * Incluye gestión de favoritos, cierre de ventas y visualización de metadatos.
 */
function CardPropiedad({ propiedad, usuarioActual, alActualizar, onNotificar, tasaBCV, favoritoInicial = false }) {
  const navigate = useNavigate();
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [isFav, setIsFav] = useState(favoritoInicial);
  const [cargandoFav, setCargandoFav] = useState(false);
  const [agentesDisponibles, setAgentesDisponibles] = useState([]);
  const [datosCierre, setDatosCierre] = useState({
    precio: propiedad.precio,
    agentes_comision: [],
    nota_cierre: ""
  });

  // Cálculos de comisión (30/70)
  const comisionTotalCalculada = (Number(datosCierre.precio || 0) * 0.05).toFixed(2);
  const tajoCasa30 = (Number(comisionTotalCalculada) * 0.30).toFixed(2);
  const poolAgentes70 = (Number(comisionTotalCalculada) * 0.70).toFixed(2);
  const totalComisionAgentesAsignada = datosCierre.agentes_comision.reduce((sum, agente) => sum + Number(agente.comision_porcentaje || 0), 0);

  // Sincronizar favorito si cambia desde el padre
  useEffect(() => {
    setIsFav(favoritoInicial);
  }, [favoritoInicial]);

  // Cargar agentes al abrir modal de cierre
  useEffect(() => {
    const cargarAgentes = async () => {
      if (usuarioActual?.user_metadata?.organizacion_id) {
        const agents = await propiedadesService.obtenerAgentesPorOrganizacion(usuarioActual.user_metadata.organizacion_id);
        setAgentesDisponibles(agents || []);
      }
    };
    if (mostrarModalCierre) cargarAgentes();
  }, [mostrarModalCierre, usuarioActual]);

  const fotoActual = propiedad.imagen_url || (propiedad.galeria && propiedad.galeria[0]) || 'https://via.placeholder.com/300';
  const precioUSD = Number(propiedad.precio);

  /**
   * Ejecuta el cierre definitivo de la venta.
   */
  const confirmarCierre = async () => {
    if (totalComisionAgentesAsignada !== 100) {
      onNotificar && onNotificar("El reparto entre agentes debe sumar 100%", "error");
      return;
    }
    try {
      await propiedadesService.cerrarVenta(propiedad.id, {
        precio_cierre: datosCierre.precio,
        agentes_comision: datosCierre.agentes_comision,
        nota_cierre: datosCierre.nota_cierre,
        titulo_propiedad: propiedad.titulo,
        zona_propiedad: propiedad.zona
      }, usuarioActual);
      onNotificar && onNotificar("¡Venta cerrada con éxito!", "success");
      setMostrarModalCierre(false);
      alActualizar && alActualizar();
    } catch (e) {
      onNotificar && onNotificar("Error: " + e.message, "error");
    }
  };

  /**
   * Alterna el estado de favorito con UI optimista.
   */
  const handleToggleFavorito = async (e) => {
    e.stopPropagation();
    if (!usuarioActual) return;
    
    const nuevoEstado = !isFav;
    setIsFav(nuevoEstado);
    setCargandoFav(true);

    try {
      await FavoritosService.toggleFavorito(usuarioActual.id, propiedad.id, isFav);
      onNotificar && onNotificar(nuevoEstado ? "Añadido a favoritos ✨" : "Eliminado de favoritos 🗑️", "success");
    } catch (e) {
      setIsFav(!nuevoEstado); // Revertir
      onNotificar && onNotificar("Error al actualizar favoritos", "error");
    } finally {
      setCargandoFav(false);
    }
  };

  return (
    <div
      className="group relative transition-all duration-500 hover:-translate-y-3 cursor-pointer w-full max-w-[320px] mx-auto"
      onClick={() => navigate(`/propiedad/${propiedad.id}`)}
    >
      {/* MODAL CIERRE PROFESIONAL */}
      {mostrarModalCierre && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-blue-600 p-8 text-center text-white">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                <DollarSign size={32} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Finalizar Venta</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 opacity-80 mt-1">Regla 30/70 Automática (5%)</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Precio Real ($)</label>
                  <input
                    type="number"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all text-slate-800"
                    value={datosCierre.precio}
                    onChange={e => setDatosCierre({ ...datosCierre, precio: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comisión Total</label>
                  <div className="w-full p-4 bg-slate-100 border-2 border-slate-100 rounded-2xl font-black text-slate-800">
                    ${Number(comisionTotalCalculada).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Agencia (30%)</span>
                  <span className="text-lg font-black text-blue-600">${Number(tajoCasa30).toLocaleString()}</span>
                </div>
                <div className="bg-blue-600 p-4 rounded-2xl border border-blue-600 shadow-lg shadow-blue-600/20">
                  <span className="text-[9px] font-black text-white/80 uppercase block mb-1">Pool Agentes (70%)</span>
                  <span className="text-lg font-black text-white">${Number(poolAgentes70).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400">Reparto Pool agentes</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${totalComisionAgentesAsignada === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {totalComisionAgentesAsignada}%
                  </span>
                </div>
                <select
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:border-blue-500"
                  onChange={e => {
                    const agent = agentesDisponibles.find(a => a.id === e.target.value);
                    if (agent && !datosCierre.agentes_comision.find(a => a.id === agent.id)) {
                      setDatosCierre({ ...datosCierre, agentes_comision: [...datosCierre.agentes_comision, { ...agent, comision_porcentaje: 0 }] });
                    }
                  }}
                  value=""
                >
                  <option value="" disabled>Añadir Agente...</option>
                  {agentesDisponibles.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>

                <div className="max-h-24 overflow-y-auto space-y-2 pr-1">
                  {datosCierre.agentes_comision.map((agente, index) => (
                    <div key={agente.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-800 uppercase flex-1 truncate">{agente.nombre}</span>
                      <input
                        type="number"
                        className="w-16 bg-white border border-slate-200 rounded-lg py-1 px-2 text-center font-bold text-sm"
                        value={agente.comision_porcentaje}
                        onChange={(e) => {
                          const updated = datosCierre.agentes_comision.map((a, i) => i === index ? { ...a, comision_porcentaje: e.target.value } : a);
                          setDatosCierre({ ...datosCierre, agentes_comision: updated });
                        }}
                      />
                      <button onClick={() => setDatosCierre({ ...datosCierre, agentes_comision: datosCierre.agentes_comision.filter(a => a.id !== agente.id) })} className="text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button onClick={() => setMostrarModalCierre(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cancelar</button>
                <button
                  onClick={confirmarCierre}
                  disabled={totalComisionAgentesAsignada !== 100}
                  className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all ${totalComisionAgentesAsignada === 100 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cuerpo de la Tarjeta */}
      <div className="relative overflow-hidden rounded-[40px] shadow-2xl flex flex-col h-[500px] bg-white border border-slate-100 transition-all duration-500 group-hover:ring-4 group-hover:ring-blue-400/30 group-hover:shadow-[0_20px_50px_rgba(0,66,157,0.1)]">
        {/* Parte Superior: Imagen */}
        <div className="relative h-1/2 overflow-hidden">
          <BlurUpImage
            src={fotoActual}
            alt={propiedad.titulo}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          
          {/* Botón Favorito (Premium Star) */}
          <button 
            onClick={handleToggleFavorito}
            disabled={cargandoFav}
            className={`absolute top-6 left-6 z-10 p-3 rounded-full backdrop-blur-md transition-all duration-300 border ${
              isFav 
              ? 'bg-yellow-400 text-white border-yellow-300 shadow-lg shadow-yellow-400/30 scale-110' 
              : 'bg-black/20 text-white/70 border-white/20 hover:bg-white/40 hover:text-white'
            }`}
          >
            <Star size={20} fill={isFav ? "white" : "none"} strokeWidth={2.5} />
          </button>

          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all"></div>

          {/* Marca de Agua Premium */}
          <div className="absolute bottom-6 right-8 pointer-events-none opacity-15">
            <span className="text-white text-2xl font-black tracking-[0.4em] uppercase leading-none drop-shadow-2xl">
              NEXUSREAL
            </span>
          </div>

          {/* Ondas Decorativas */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[15px] fill-[#7da62e] opacity-90">
              <path d="M0,0 C150,90 400,0 600,60 C800,120 1050,30 1200,90 L1200,120 L0,120 Z"></path>
            </svg>
          </div>
        </div>

        {/* Cuerpo de la Tarjeta */}
        <div className="flex-1 bg-[#00429d] p-6 flex flex-col justify-between items-center text-center">
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight">
              {propiedad.titulo}
            </h3>

            <div className="flex items-center justify-center gap-1.5 text-blue-50 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">
              <MapPin size={12} className="text-white" />
              <span>{propiedad.zona}</span>
            </div>

            <div className="flex justify-center gap-6 py-4 border-y border-white/20 w-full bg-white/5 rounded-2xl backdrop-blur-sm">
              <div className="text-white flex flex-col items-center group/icon">
                <Bed size={20} className="text-white mb-1 group-hover/icon:scale-110 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-widest">{propiedad.habitaciones}</span>
              </div>
              <div className="text-white flex flex-col items-center group/icon">
                <Bath size={20} className="text-white mb-1 group-hover/icon:scale-110 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-widest">{propiedad.banos}</span>
              </div>
              <div className="text-white flex flex-col items-center group/icon">
                <Ruler size={20} className="text-white mb-1 group-hover/icon:scale-110 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-widest">{propiedad.metraje}m²</span>
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="mb-4">
              <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1 opacity-70">Precio Listado</p>
              <p className="text-3xl font-black text-white tracking-tighter">${precioUSD.toLocaleString()}</p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/propiedad/${propiedad.id}`); }}
                className="flex-1 bg-green-500 text-white rounded-2xl py-3 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 group/btn"
              >
                Detalles <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
              {propiedad.agente_id === usuarioActual?.id && propiedad.estado !== 'vendido' && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMostrarModalCierre(true); }}
                  className="bg-green-500 text-white p-3 rounded-2xl hover:bg-green-600 transition-all shadow-lg"
                >
                  <CheckCircle size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardPropiedad;