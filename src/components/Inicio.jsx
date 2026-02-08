import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Navbar from './Navbar.jsx';
import { Formulario } from './Formulario.jsx';
import CardPropiedad from './CardPropiedad.jsx';
import { PlusCircle, X, Filter, SlidersHorizontal, ArrowUpDown, Trash2, Bed, Bath, Ruler, DollarSign, TrendingUp } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';

function Inicio({ session, onNotificar }) {
  const [propiedades, setPropiedades] = useState([]);
  const [tasaBCV, setTasaBCV] = useState(() => {
    const cache = localStorage.getItem('tasa_bcv_cache');
    return cache ? parseFloat(cache) : 38.50;
  });
  
  // ESTADOS DE FILTROS INTELIGENTES
  const [filtros, setFiltros] = useState({
    texto: '',
    tipo: '',
    operacion: '',
    precioMin: '',
    precioMax: '',
    habitaciones: '',
    banos: '',
    metrajeMin: '',
    estado: 'disponible', // disponible, vendido, alquilado, todos
    modoMLS: 'todos' // todos, mi_agencia, solo_mias
  });

  const [mostrarVentas, setMostrarVentas] = useState(false);
  const [registroVentas, setRegistroVentas] = useState([]);
  const [orden, setOrden] = useState('recientes'); // recientes, precio-asc, precio-desc, metraje-desc

  const esAdmin = session.user.user_metadata?.rol === 'admin';

  const cargarVentas = async () => {
    try {
      const data = await propiedadesService.obtenerVentasAgencia(session.user);
      setRegistroVentas(data);
      setMostrarVentas(true);
    } catch (e) {
      onNotificar && onNotificar("Error al cargar contabilidad: " + e.message, "error");
    }
  };
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const limpiarFiltros = () => {
    setFiltros({
      texto: '',
      tipo: '',
      operacion: '',
      precioMin: '',
      precioMax: '',
      habitaciones: '',
      banos: '',
      metrajeMin: '',
      estado: 'disponible',
      modoMLS: 'todos'
    });
  };

  const setFiltro = (valor) => setFiltros(prev => ({ ...prev, texto: valor }));

  useEffect(() => {
    fetchPropiedades();
    cargarTasaInicial();
  }, []);

  async function cargarTasaInicial() {
    try {
      const tasa = await propiedadesService.obtenerTasa();
      setTasaBCV(tasa);
    } catch (e) {
      console.error("Error cargando tasa inicial:", e);
    }
  }

  async function fetchPropiedades() {
    try {
      const data = await propiedadesService.obtenerTodas();
      setPropiedades(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      onNotificar('Error al cargar las propiedades', 'error');
    }
  }

  // Lógica de Filtros Profesional (Versión Mejorada)
  const propiedadesFiltradas = propiedades
    .filter(p => {
      const cumpleTexto = filtros.texto === '' ||
                          p.titulo?.toLowerCase().includes(filtros.texto.toLowerCase()) ||
                          p.zona?.toLowerCase().includes(filtros.texto.toLowerCase()) ||
                          p.agente_nombre?.toLowerCase().includes(filtros.texto.toLowerCase());
      
      const cumpleTipo = filtros.tipo ? p.tipo_inmueble === filtros.tipo : true;
      const cumpleOperacion = filtros.operacion ? p.tipo_operacion === filtros.operacion : true;
      
      const precio = Number(p.precio);
      const cumplePrecioMin = filtros.precioMin ? precio >= Number(filtros.precioMin) : true;
      const cumplePrecioMax = filtros.precioMax ? precio <= Number(filtros.precioMax) : true;
      
      const cumpleHabs = filtros.habitaciones ? Number(p.habitaciones) >= Number(filtros.habitaciones) : true;
      const cumpleBanos = filtros.banos ? Number(p.banos) >= Number(filtros.banos) : true;
      const cumpleMetraje = filtros.metrajeMin ? Number(p.metraje) >= Number(filtros.metrajeMin) : true;

      const cumpleEstado = filtros.estado === 'todos' ? true :
                           filtros.estado === 'disponible' ? (p.estado !== 'vendido' && p.estado !== 'alquilado') :
                           p.estado === filtros.estado;

      const cumpleMLS = filtros.modoMLS === 'todos' ? true :
                        filtros.modoMLS === 'solo_mias' ? p.agente_id === session.user.id :
                        filtros.modoMLS === 'mi_agencia' ? p.organizacion_id === session.user.user_metadata?.organizacion_id : true;

      return cumpleTexto && cumpleTipo && cumpleOperacion && cumplePrecioMin && cumplePrecioMax && cumpleHabs && cumpleBanos && cumpleMetraje && cumpleEstado && cumpleMLS;
    })
    .sort((a, b) => {
      if (orden === 'recientes') return new Date(b.created_at) - new Date(a.created_at);
      if (orden === 'precio-asc') return Number(a.precio) - Number(b.precio);
      if (orden === 'precio-desc') return Number(b.precio) - Number(a.precio);
      if (orden === 'metraje-desc') return (Number(b.metraje) || 0) - (Number(a.metraje) || 0);
      return 0;
    });

  // Reporte de Mercado
  const generarReporte = () => {
    const ventas = propiedades.filter(p => p.estado === 'vendido' && p.precio_cierre && p.metraje);
    const zonas = [...new Set(ventas.map(v => v.zona))];
    return zonas.map(zona => {
      const propsZona = ventas.filter(v => v.zona === zona);
      const precioPromedioM2 = propsZona.reduce((acc, curr) => acc + (curr.precio_cierre / curr.metraje), 0) / propsZona.length;
      return { zona, precioPromedioM2, cantidad: propsZona.length };
    });
  };

  const reporteMercado = generarReporte();

  // Cálculos de Estadísticas Profesionales
  const orgId = session.user.user_metadata?.organizacion_id;
  const misVentas = propiedades.filter(p => p.estado === 'vendido' && p.agente_id === session.user.id).reduce((acc, curr) => acc + Number(curr.precio_cierre || 0), 0);
  const ventasAgencia = propiedades.filter(p => p.estado === 'vendido' && p.organizacion_id === orgId).reduce((acc, curr) => acc + Number(curr.precio_cierre || 0), 0);
  const totalMercado = propiedades.filter(p => p.estado === 'vendido').reduce((acc, curr) => acc + Number(curr.precio_cierre || 0), 0);
  
  const totalAlquileres = propiedades.filter(p => p.estado === 'alquilado' && (p.organizacion_id === orgId || !orgId)).length;
  const misPropiedades = propiedades.filter(p => p.agente_id === session.user.id).length;

  const activeFiltersCount = Object.values(filtros).filter(v => v !== '' && v !== 'disponible' && v !== 'todos' && v !== null && v !== undefined).length;

  return (
    <>
      <Navbar 
        alBuscar={setFiltro} 
        usuario={session.user} 
        tasaBCV={tasaBCV} 
        setTasaBCV={setTasaBCV}
        onNotificar={onNotificar}
      />
      
      {/* BARRA DE FILTROS INTELIGENTE */}
      <div className="bg-white border-b border-slate-200 py-3 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Controles Principales */}
            <div className="w-full md:w-auto flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                <select 
                  className="bg-transparent text-xs font-bold px-3 py-1.5 outline-none text-slate-600 cursor-pointer"
                  value={filtros.operacion}
                  onChange={e => setFiltros({...filtros, operacion: e.target.value})}
                >
                  <option value="">Operación</option>
                  <option value="Venta">Venta</option>
                  <option value="Alquiler">Alquiler</option>
                </select>
                <div className="w-px h-4 bg-slate-200"></div>
                <select 
                  className="bg-transparent text-xs font-bold px-3 py-1.5 outline-none text-slate-600 cursor-pointer"
                  value={filtros.tipo}
                  onChange={e => setFiltros({...filtros, tipo: e.target.value})}
                >
                  <option value="">Tipo Inmueble</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Habitación">Habitación</option>
                  <option value="Estudio">Estudio</option>
                  <option value="Finca">Finca</option>
                  <option value="Granja">Granja</option>
                  <option value="Terreno">Terreno</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${mostrarFiltrosAvanzados || activeFiltersCount > 0 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-white text-slate-600 border-slate-200'} border relative`}
                >
                  <SlidersHorizontal size={14} />
                  Filtros {mostrarFiltrosAvanzados ? 'Ocultar' : 'Avanzados'}
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                  <Filter size={14} className="text-slate-400" />
                  <select 
                    className="bg-transparent text-xs font-bold outline-none text-slate-600 cursor-pointer"
                    value={filtros.modoMLS}
                    onChange={e => setFiltros({...filtros, modoMLS: e.target.value})}
                  >
                    <option value="todos">Red MLS (Global)</option>
                    <option value="mi_agencia">Mi Agencia</option>
                    <option value="solo_mias">Mis Propiedades</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                  <ArrowUpDown size={14} className="text-slate-400" />
                  <select 
                    className="bg-transparent text-xs font-bold outline-none text-slate-600 cursor-pointer"
                    value={orden}
                    onChange={e => setOrden(e.target.value)}
                  >
                    <option value="recientes">Más recientes</option>
                    <option value="precio-asc">Menor Precio</option>
                    <option value="precio-desc">Mayor Precio</option>
                    <option value="metraje-desc">Mayor Metraje</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex w-full md:w-auto gap-2">
              <button onClick={() => setMostrarFormulario(!mostrarFormulario)} className="flex-1 md:flex-none bg-[#0056b3] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                {mostrarFormulario ? <><X size={16}/> Cancelar</> : <><PlusCircle size={16}/> Publicar Propiedad</>}
              </button>
              <button onClick={() => setMostrarReporte(!mostrarReporte)} className="flex-1 md:flex-none bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                {mostrarReporte ? 'Ver Catálogo' : 'Reporte de Mercado'}
              </button>
            </div>
          </div>

          {/* PANEL DE FILTROS AVANZADOS (COLAPSABLE) */}
          {mostrarFiltrosAvanzados && (
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-5 gap-3 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Rango de Precio ($)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-blue-300"
                    value={filtros.precioMin}
                    onChange={e => setFiltros({...filtros, precioMin: e.target.value})}
                  />
                  <input 
                    type="number" 
                    placeholder="Max" 
                    className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-blue-300"
                    value={filtros.precioMax}
                    onChange={e => setFiltros({...filtros, precioMax: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Habitaciones (+)</label>
                <div className="relative">
                  <Bed size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select 
                    className="w-full p-2 pl-9 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none appearance-none"
                    value={filtros.habitaciones}
                    onChange={e => setFiltros({...filtros, habitaciones: e.target.value})}
                  >
                    <option value="">Cualquiera</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Baños (+)</label>
                <div className="relative">
                  <Bath size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select 
                    className="w-full p-2 pl-9 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none appearance-none"
                    value={filtros.banos}
                    onChange={e => setFiltros({...filtros, banos: e.target.value})}
                  >
                    <option value="">Cualquiera</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Metraje Min (m²)</label>
                <div className="relative">
                  <Ruler size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number" 
                    placeholder="0 m²" 
                    className="w-full p-2 pl-9 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-blue-300"
                    value={filtros.metrajeMin}
                    onChange={e => setFiltros({...filtros, metrajeMin: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1 flex flex-col justify-end">
                <button 
                  onClick={limpiarFiltros}
                  className="w-full flex items-center justify-center gap-2 p-2 text-red-500 hover:bg-red-50 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-colors border border-transparent hover:border-red-100"
                >
                  <Trash2 size={12} /> Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        
        {mostrarReporte ? (
             <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-xl">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-6 uppercase italic border-b pb-4">Reporte de Valor de Mercado (Real)</h2>
                {reporteMercado.length === 0 ? (
                    <p className="text-slate-500">No hay suficientes datos de cierres verificados para generar reporte.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {reporteMercado.map((zona, i) => (
                            <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-700">{zona.zona}</h3>
                                <p className="text-3xl font-black text-[#0056b3] mt-2">${Math.round(zona.precioPromedioM2).toLocaleString()}<span className="text-sm text-slate-400 font-medium">/m²</span></p>
                                <p className="text-xs text-slate-500 mt-2 font-medium">{zona.cantidad} Cierres Analizados</p>
                            </div>
                        ))}
                    </div>
                )}
             </div>
        ) : (
            <>
                {/* DASHBOARD RESUMEN - Versión Profesional */}
                <div className="flex overflow-x-auto gap-4 mb-8 pb-2 md:pb-0 scrollbar-hide snap-x md:justify-center -mx-4 px-4 md:mx-0 md:px-0">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center min-w-[200px] md:w-64 snap-center flex-1 md:flex-none relative group">
                        {esAdmin && (
                          <button 
                            onClick={cargarVentas}
                            className="absolute top-2 right-2 p-2 text-slate-300 hover:text-blue-500 transition-colors"
                            title="Ver Contabilidad"
                          >
                            <TrendingUp size={16} />
                          </button>
                        )}
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Volumen Agencia</p>
                        <p className="text-2xl font-black text-slate-800">${ventasAgencia.toLocaleString()}</p>
                        <div className="mt-2 flex items-center justify-center gap-1">
                          <span className="text-[10px] font-bold text-green-500">Mío: ${misVentas.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center min-w-[200px] md:w-64 snap-center flex-1 md:flex-none">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Mercado Global</p>
                        <p className="text-2xl font-black text-[#0056b3]">${totalMercado.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 italic">Participación: {totalMercado > 0 ? ((ventasAgencia/totalMercado)*100).toFixed(1) : 0}%</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center min-w-[200px] md:w-64 snap-center flex-1 md:flex-none">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Mis Propiedades</p>
                        <p className="text-2xl font-black text-green-500">{misPropiedades}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Alquileres: {totalAlquileres}</p>
                    </div>
                </div>

                {/* FORMULARIO FLOTANTE */}
                {mostrarFormulario && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] scrollbar-hide">
                            <button 
                                onClick={() => setMostrarFormulario(false)}
                                className="absolute top-6 right-6 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-slate-100"
                            >
                                <X size={24} />
                            </button>
                            <Formulario 
                                usuario={session.user} 
                                alTerminar={() => {
                                    setMostrarFormulario(false);
                                    fetchPropiedades();
                                    onNotificar('Propiedad registrada exitosamente en la Red MLS');
                                }} 
                                onError={(msg) => onNotificar(msg, 'error')}
                            />
                        </div>
                    </div>
                )}
                
                <div className="mt-4 md:mt-12">
                  <div className="flex justify-between items-end mb-4 md:mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase italic">Catálogo Inmobiliario</h2>
              <p className="text-slate-500 text-xs font-bold">{propiedadesFiltradas.length} Propiedades encontradas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-8 justify-items-center">
            {propiedadesFiltradas.map((p) => (
              <CardPropiedad 
                key={p.id} 
                propiedad={p} 
                usuarioActual={session?.user} 
                alActualizar={fetchPropiedades}
                onNotificar={onNotificar}
                tasaBCV={tasaBCV}
              />
            ))}
          </div>
        </div>
        </>
        )}
      </main>
    {/* MODAL CONTABILIDAD PRIVADA (Admin Only) */}
      {mostrarVentas && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Panel de Contabilidad</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Control de Ingresos y Comisiones</p>
              </div>
              <button onClick={() => setMostrarVentas(false)} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              {registroVentas.length === 0 ? (
                <div className="text-center py-20">
                  <TrendingUp size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay cierres registrados aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 mb-4 px-4">
                    <span className="text-[10px] font-black uppercase text-slate-400">Propiedad / Fecha</span>
                    <span className="text-[10px] font-black uppercase text-slate-400 text-center">Venta Total</span>
                    <span className="text-[10px] font-black uppercase text-slate-400 text-center">Comisión 50/50</span>
                    <span className="text-[10px] font-black uppercase text-slate-400 text-right">Agente</span>
                  </div>
                  {registroVentas.map((venta) => (
                    <div key={venta.id} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center justify-between hover:border-blue-200 transition-all">
                      <div className="w-1/4">
                        <p className="text-sm font-black text-slate-800 truncate">{venta.propiedades?.titulo}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{new Date(venta.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="w-1/4 text-center">
                        <p className="text-sm font-black text-slate-700">${Number(venta.monto_venta).toLocaleString()}</p>
                      </div>
                      <div className="w-1/4 flex justify-center gap-4">
                        <div className="text-center">
                          <p className="text-[8px] font-black text-blue-500 uppercase">Agencia</p>
                          <p className="text-xs font-black text-slate-800">${Number(venta.comision_agencia).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] font-black text-green-500 uppercase">Agente</p>
                          <p className="text-xs font-black text-slate-800">${Number(venta.comision_agente).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="w-1/4 text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase">{venta.notas || 'Sin notas'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingreso Total Agencia</p>
                  <p className="text-3xl font-black text-slate-900">
                    ${registroVentas.reduce((acc, v) => acc + Number(v.comision_agencia), 0).toLocaleString()}
                  </p>
               </div>
               <button 
                onClick={() => window.print()} 
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 hover:scale-105 transition-all"
               >
                 Exportar Reporte
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Inicio;
