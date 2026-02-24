import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Navbar from './Navbar.jsx';
import { Formulario } from './Formulario.jsx';
import CardPropiedad from './CardPropiedad.jsx';
import { 
  PlusCircle, X, Filter, SlidersHorizontal, ArrowUpDown, 
  Search, Home, ChevronRight, Briefcase, TrendingUp 
} from 'lucide-react';
import { propiedadesService } from '../propiedadesService';

function Inicio({ session, onNotificar }) {
  const [propiedades, setPropiedades] = useState([]);
  const [estadisticas, setEstadisticas] = useState({ totalProspectos: 0, ventasMes: 0 });
  const [tasaBCV, setTasaBCV] = useState(() => {
    const cache = localStorage.getItem('tasa_bcv_cache');
    return cache ? parseFloat(cache) : 38.50;
  });
  
  const [filtros, setFiltros] = useState({
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

  const [orden, setOrden] = useState('recientes');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // --- Carga de datos ---
  useEffect(() => {
    fetchPropiedades();
    fetchEstadisticas();
    cargarTasaInicial();
  }, []);

  async function fetchPropiedades() {
    try {
      const data = await propiedadesService.obtenerPropiedades(session?.user, filtros);
      setPropiedades(data || []);
    } catch (error) {
      onNotificar?.('Error al cargar las propiedades', 'error');
    }
  }

  async function fetchEstadisticas() {
    try {
      const stats = await propiedadesService.obtenerEstadisticasAgencia(session?.user);
      setEstadisticas(stats);
    } catch (error) {
      console.error(error);
    }
  }

  async function cargarTasaInicial() {
    try {
      const tasa = await propiedadesService.obtenerTasa();
      if (tasa) {
        setTasaBCV(tasa);
        localStorage.setItem('tasa_bcv_cache', tasa.toString());
      }
    } catch (error) {
      onNotificar?.('Error al obtener la tasa del BCV', 'error');
    }
  }

  // --- Manejadores ---
  const setFiltroTexto = (texto) => {
    setFiltros(prev => ({ ...prev, texto }));
  };

  const handleTipoChange = (e) => {
    setFiltros(prev => ({ ...prev, tipo: e.target.value }));
  };

  // --- Lógica de Filtrado en Cliente ---
  const propiedadesFiltradas = propiedades
    .filter(p => {
      const cumpleTexto = !filtros.texto || 
        [p.titulo, p.zona, p.agente_nombre].some(field => 
          field?.toLowerCase().includes(filtros.texto.toLowerCase())
        );
      
      const cumpleTipo = !filtros.tipo || p.tipo_inmueble === filtros.tipo;
      
      const cumpleEstado = filtros.estado === 'todos' ? true :
                           filtros.estado === 'disponible' ? (p.estado !== 'vendido' && p.estado !== 'alquilado') :
                           p.estado === filtros.estado;

      return cumpleTexto && cumpleTipo && cumpleEstado;
    })
    .sort((a, b) => {
      if (orden === 'recientes') return new Date(b.created_at) - new Date(a.created_at);
      if (orden === 'precio-asc') return Number(a.precio) - Number(b.precio);
      if (orden === 'precio-desc') return Number(b.precio) - Number(a.precio);
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500 selection:text-black">
      <Navbar 
        usuario={session?.user} 
        tasaBCV={tasaBCV} 
        setTasaBCV={setTasaBCV}
        onNotificar={onNotificar}
        alBuscar={setFiltroTexto}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] bg-amber-500/5 blur-[120px] rounded-full -z-10" />
        
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">
            Encuentra la Residencia de <span className="text-amber-500 italic">Tus Sueños</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-12 font-light max-w-2xl mx-auto">
            Curaduría exclusiva de propiedades de alto nivel en las zonas más privilegiadas de Venezuela.
          </p>

          {/* Buscador de Lujo */}
          <div className="relative max-w-3xl mx-auto p-2 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-2xl flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 gap-3 border-b md:border-b-0 md:border-r border-white/5 py-3 md:py-0">
              <Search className="text-amber-500" size={20} />
              <input 
                type="text" 
                placeholder="¿Dónde deseas vivir?"
                className="bg-transparent border-none outline-none w-full text-white placeholder:text-gray-600"
                value={filtros.texto}
                onChange={(e) => setFiltroTexto(e.target.value)}
              />
            </div>
            <div className="flex-1 flex items-center px-4 gap-3 py-3 md:py-0">
              <Home className="text-amber-500" size={20} />
              <select 
                className="bg-transparent border-none outline-none w-full text-white cursor-pointer appearance-none"
                value={filtros.tipo}
                onChange={handleTipoChange}
              >
                <option value="" className="bg-black">Tipo de Propiedad</option>
                <option value="Apartamento" className="bg-black">Apartamento</option>
                <option value="Casa" className="bg-black">Casa / Villa</option>
                <option value="Local" className="bg-black">Local Comercial</option>
              </select>
            </div>
            <button 
              className="bg-amber-500 text-black font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform active:scale-95"
              onClick={fetchPropiedades}
            >
              Buscar Ahora
            </button>
          </div>
        </div>
      </section>

      {/* Grid de Propiedades */}
      <section className="container mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-serif mb-2">Propiedades Destacadas</h2>
            <div className="h-1 w-20 bg-amber-500" />
          </div>
          <button className="text-amber-500 text-sm font-bold uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
            Ver todas <ChevronRight size={16} />
          </button>
        </div>

        {propiedadesFiltradas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {propiedadesFiltradas.map(prop => (
              <CardPropiedad key={prop.id} propiedad={prop} tasa={tasaBCV} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No se encontraron propiedades que coincidan con tu búsqueda.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default Inicio;