import React, { useState, useEffect } from 'react';
import { supabase } from './supabase'; 
import Login from './components/Login';
import Navbar from './components/Navbar';
import { Formulario } from './components/Formulario';
import CardPropiedad from './components/CardPropiedad';

function App() {
  const [session, setSession] = useState(null);
  const [propiedades, setPropiedades] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroOperacion, setFiltroOperacion] = useState('');
  const [filtroPrecioMax, setFiltroPrecioMax] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    fetchPropiedades();
    return () => subscription.unsubscribe();
  }, []);

  async function fetchPropiedades() {
    const { data } = await supabase.from('propiedades').select('*').order('created_at', { ascending: false });
    if (data) setPropiedades(data);
  }

  const [mostrarReporte, setMostrarReporte] = useState(false);

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

  if (!session) return <Login />;

  const esAdmin = session.user.email === 'admin@nexusreal.com' || true; // Temporal para ver estadísticas

  // Cálculos de Estadísticas
  const totalVentas = propiedades.filter(p => p.estado === 'vendido').reduce((acc, curr) => acc + Number(curr.precio_cierre || 0), 0);
  const totalAlquileres = propiedades.filter(p => p.estado === 'alquilado').length;
  const misPropiedades = propiedades.filter(p => p.agente_id === session.user.id).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar alBuscar={setFiltro} usuario={session.user} />
      
      {/* FILTROS AVANZADOS (BUSCADOR INTER-EMPRESARIAL) */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-20 shadow-sm flex justify-between items-center">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center justify-center flex-grow">
            <select className="p-2 rounded-xl border border-slate-300 text-sm outline-none" onChange={e => setFiltroOperacion(e.target.value)}>
                <option value="">Todas las Operaciones</option>
                <option value="Venta">Venta</option>
                <option value="Alquiler">Alquiler</option>
            </select>
            <select className="p-2 rounded-xl border border-slate-300 text-sm outline-none" onChange={e => setFiltroTipo(e.target.value)}>
                <option value="">Todos los Tipos</option>
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
                placeholder="Precio Máximo" 
                className="p-2 rounded-xl border border-slate-300 text-sm outline-none w-32"
                onChange={e => setFiltroPrecioMax(e.target.value)}
            />
        </div>
        <button onClick={() => setMostrarReporte(!mostrarReporte)} className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl ml-4 hover:bg-slate-700 transition-colors">
            {mostrarReporte ? 'Ver Catálogo' : 'Reporte Mercado'}
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {mostrarReporte ? (
             <div className="bg-white p-8 rounded-[40px] shadow-xl">
                <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase italic border-b pb-4">Reporte de Valor de Mercado (Real)</h2>
                {reporteMercado.length === 0 ? (
                    <p className="text-slate-500">No hay suficientes datos de cierres verificados para generar reporte.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                {/* DASHBOARD RESUMEN */}
        <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 text-center">
                <p className="text-slate-400 text-[10px] font-black uppercase">Volumen Ventas</p>
                <p className="text-xl font-black text-slate-800">${totalVentas.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 text-center">
                <p className="text-slate-400 text-[10px] font-black uppercase">Alquileres</p>
                <p className="text-xl font-black text-[#0056b3]">{totalAlquileres}</p>
            </div>
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 text-center">
                <p className="text-slate-400 text-[10px] font-black uppercase">Mis Propiedades</p>
                <p className="text-xl font-black text-green-500">{misPropiedades}</p>
            </div>
        </div>

        {/* El Formulario ahora recibe el usuario para saber quién hace la venta */}
        <Formulario 
          usuario={session.user} 
          alTerminar={() => {
            alert("Propiedad registrada exitosamente en la Red MLS");
            fetchPropiedades();
          }} 
        />
        
        <div className="mt-12">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase italic">Catálogo Inmobiliario</h2>
              <p className="text-slate-500 text-xs font-bold">{propiedadesFiltradas.length} Propiedades encontradas</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
            {propiedadesFiltradas.map((p) => (
              <CardPropiedad key={p.id} propiedad={p} usuarioActual={session?.user} alActualizar={fetchPropiedades} />
            ))}
          </div>
        </div>
        </>
        )}
      </main>
    </div>
  );
}

export default App;