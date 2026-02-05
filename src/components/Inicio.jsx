import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Navbar from './Navbar.jsx';
import { Formulario } from './Formulario.jsx';
import CardPropiedad from './CardPropiedad.jsx';
import { PlusCircle, X } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';

function Inicio({ session, onNotificar }) {
  const [propiedades, setPropiedades] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroOperacion, setFiltroOperacion] = useState('');
  const [filtroPrecioMax, setFiltroPrecioMax] = useState('');
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tasaBCV, setTasaBCV] = useState(null);

  useEffect(() => {
    fetchPropiedades();
    fetchTasaBCV();
  }, []);

  async function fetchPropiedades() {
    try {
      const data = await propiedadesService.obtenerTodas();
      setPropiedades(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      onNotificar('Error al cargar las propiedades', 'error');
    }
  }

  async function fetchTasaBCV() {
    try {
      const tasa = await propiedadesService.obtenerTasaBCV();
      setTasaBCV(tasa);
    } catch (error) {
      console.error('Error fetching BCV rate:', error);
    }
  }

  // Lógica de Filtros Profesional
  const propiedadesFiltradas = propiedades.filter(p => {
    const cumpleTexto = p.titulo?.toLowerCase().includes(filtro.toLowerCase()) ||
                        p.zona?.toLowerCase().includes(filtro.toLowerCase()) ||
                        p.agente_nombre?.toLowerCase().includes(filtro.toLowerCase());
    
    const cumpleTipo = filtroTipo ? p.tipo_inmueble === filtroTipo : true;
    const cumpleOperacion = filtroOperacion ? p.tipo_operacion === filtroOperacion : true;
    const cumplePrecio = filtroPrecioMax ? Number(p.precio) <= Number(filtroPrecioMax) : true;

    return cumpleTexto && cumpleTipo && cumpleOperacion && cumplePrecio;
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

  // Cálculos de Estadísticas
  const totalVentas = propiedades.filter(p => p.estado === 'vendido').reduce((acc, curr) => acc + Number(curr.precio_cierre || 0), 0);
  const totalAlquileres = propiedades.filter(p => p.estado === 'alquilado').length;
  const misPropiedades = propiedades.filter(p => p.agente_id === session.user.id).length;

  return (
    <>
      <Navbar alBuscar={setFiltro} usuario={session.user} tasaBCV={tasaBCV} />
      
      {/* FILTROS AVANZADOS (BUSCADOR INTER-EMPRESARIAL) */}
      <div className="bg-white border-b border-slate-200 py-3 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="w-full md:w-auto flex flex-nowrap overflow-x-auto gap-3 items-center pb-1 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <select className="p-2 rounded-xl border border-slate-300 text-xs md:text-sm outline-none bg-white min-w-[100px]" onChange={e => setFiltroOperacion(e.target.value)}>
                    <option value="">Operación</option>
                    <option value="Venta">Venta</option>
                    <option value="Alquiler">Alquiler</option>
                </select>
                <select className="p-2 rounded-xl border border-slate-300 text-xs md:text-sm outline-none bg-white min-w-[100px]" onChange={e => setFiltroTipo(e.target.value)}>
                    <option value="">Tipo</option>
                    <option value="Apartamento">Apartamento</option>
                    <option value="Casa">Casa</option>
                    <option value="Habitación">Habitación</option>
                    <option value="Estudio">Estudio</option>
                    <option value="Finca">Finca</option>
                    <option value="Granja">Granja</option>
                    <option value="Terreno">Terreno</option>
                </select>
                <input 
                    type="number" 
                    placeholder="Max $" 
                    className="p-2 rounded-xl border border-slate-300 text-xs md:text-sm outline-none w-24 md:w-32"
                    onChange={e => setFiltroPrecioMax(e.target.value)}
                />
            </div>
            <div className="flex w-full md:w-auto gap-2">
                <button onClick={() => setMostrarFormulario(!mostrarFormulario)} className="flex-1 md:flex-none bg-[#0056b3] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-1">
                    {mostrarFormulario ? <><X size={14}/> Cancelar</> : <><PlusCircle size={14}/> Publicar</>}
                </button>
                <button onClick={() => setMostrarReporte(!mostrarReporte)} className="flex-1 md:flex-none bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors">
                    {mostrarReporte ? 'Ver Catálogo' : 'Reporte Mercado'}
                </button>
            </div>
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
                {/* DASHBOARD RESUMEN - Ahora scrollable en móvil */}
                <div className="flex overflow-x-auto gap-4 mb-8 pb-2 md:pb-0 scrollbar-hide snap-x md:justify-center -mx-4 px-4 md:mx-0 md:px-0">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center min-w-[160px] md:w-64 snap-center flex-1 md:flex-none">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Volumen Ventas</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">${totalVentas.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center min-w-[160px] md:w-64 snap-center flex-1 md:flex-none">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Alquileres</p>
                        <p className="text-2xl font-black text-[#0056b3] mt-1">{totalAlquileres}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center min-w-[160px] md:w-64 snap-center flex-1 md:flex-none">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Mis Propiedades</p>
                        <p className="text-2xl font-black text-green-500 mt-1">{misPropiedades}</p>
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
    </>
  );
}

export default Inicio;
