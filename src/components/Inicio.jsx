import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Navbar from './Navbar.jsx';
import { Formulario } from './Formulario.jsx';
import CardPropiedad from './CardPropiedad.jsx';
import ImportadorMasivo from './ImportadorMasivo.jsx';
import {
  PlusCircle,
  ChevronRight,
  Search,
  Building2,
  LayoutDashboard,
  Filter,
  Home,
  Tag,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { propiedadesService } from '../propiedadesService';

function Inicio({ session, onNotificar, tasaBCV, setTasaBCV }) {
  const [propiedades, setPropiedades] = useState([]);
  const [mostrarModalPublicar, setMostrarModalPublicar] = useState(false);
  const [mostrarImportadorMasivo, setMostrarImportadorMasivo] = useState(false);

  const [filtros, setFiltros] = useState({
    texto: '',
    zona: '',
    tipo: '',
    operacion: '',
    estado: 'disponible'
  });

  useEffect(() => {
    fetchPropiedades();
  }, [filtros]);

  async function fetchPropiedades() {
    try {
      const data = await propiedadesService.obtenerPropiedades(session?.user, filtros);
      setPropiedades(data || []);
    } catch (error) {
      onNotificar?.('Error al cargar propiedades', 'error');
    }
  }

  const setFiltroTexto = (texto) => {
    setFiltros(prev => ({ ...prev, texto }));
  };

  const setFiltroZona = (zona) => {
    setFiltros(prev => ({ ...prev, zona }));
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar
        usuario={session?.user}
        tasaBCV={tasaBCV}
        setTasaBCV={setTasaBCV}
        onNotificar={onNotificar}
        alBuscar={setFiltroTexto}
        alBuscarZona={setFiltroZona}
        onPublicar={() => setMostrarModalPublicar(true)}
      />

      {/* Main Content Area */}
      <main className="pt-48 pb-20 px-6">
        <div className="container mx-auto">

          {/* QUICK FILTERS BAR */}
          <div className="flex flex-wrap items-center gap-4 mb-12 pb-8 border-b border-slate-100">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
              {['', 'Venta', 'Alquiler'].map((op) => (
                <button
                  key={op}
                  onClick={() => setFiltros(prev => ({ ...prev, operacion: op }))}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${(filtros.operacion === op) || (!op && !filtros.operacion)
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {op || 'Todo'}
                </button>
              ))}
            </div>

            <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

            <div className="flex flex-wrap items-center gap-2">
              {['', 'Apartamento', 'Casa', 'Local', 'Terreno'].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltros(prev => ({ ...prev, tipo }))}
                  className={`px-5 py-2.5 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${(filtros.tipo === tipo) || (!tipo && !filtros.tipo)
                    ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm'
                    : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                    }`}
                >
                  {tipo || 'Todos los Tipos'}
                </button>
              ))}
            </div>

            <div className="ml-auto">
              <button
                onClick={() => setMostrarImportadorMasivo(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#00429d] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
              >
                <FileSpreadsheet size={16} />
                Importar Excel
              </button>
            </div>
          </div>

          {/* Grid de Propiedades */}
          {propiedades.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {propiedades.map(prop => (
                <CardPropiedad
                  key={prop.id}
                  propiedad={prop}
                  tasaBCV={tasaBCV}
                  usuarioActual={session?.user}
                  onNotificar={onNotificar}
                  alActualizar={fetchPropiedades}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-40 border-2 border-dashed border-slate-100 rounded-[50px]">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="text-slate-200" size={40} />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No se encontraron resultados</p>
            </div>
          )}
        </div>
      </main>

      {/* BOTÓN FLOTANTE: PUBLICAR */}
      <button
        onClick={() => setMostrarModalPublicar(true)}
        className="fixed bottom-10 right-10 bg-blue-600 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-2xl shadow-blue-600/40 hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all z-[100] group"
        title="Publicar Propiedad"
      >
        <PlusCircle size={32} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>

      {/* MODAL DE PUBLICACIÓN */}
      {mostrarModalPublicar && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-transparent w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setMostrarModalPublicar(false)}
              className="absolute top-6 right-8 text-slate-400 hover:text-slate-800 p-2 z-10"
            >
              <X size={24} />
            </button>
            <Formulario
              usuario={session?.user}
              alTerminar={() => {
                setMostrarModalPublicar(false);
                fetchPropiedades();
              }}
              onError={(msg) => onNotificar?.(msg, 'error')}
            />
          </div>
        </div>
      )}

      {/* Modal Importador Masivo */}
      {mostrarImportadorMasivo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-12">
          <div className="bg-transparent w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setMostrarImportadorMasivo(false)}
              className="absolute top-6 right-8 text-slate-400 hover:text-slate-800 p-2 z-10"
            >
              <X size={24} />
            </button>
            <ImportadorMasivo
              session={session}
              onNotificar={onNotificar}
              onImportSuccess={() => {
                setMostrarImportadorMasivo(false);
                fetchPropiedades();
              }}
            />
          </div>
        </div>
      )}

      {/* Footer minimalista */}
      <footer className="py-12 border-t border-slate-50 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-30">
          <Building2 size={24} className="text-blue-600" />
          <span className="font-serif uppercase tracking-[0.3em] font-black text-xs text-slate-800">NexusReal</span>
        </div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">© 2024 Blue Edition</p>
      </footer>
    </div>
  );
}

export default Inicio;