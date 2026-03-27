import React, { useState, useEffect } from 'react';
import { Star, Loader2, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FavoritosService } from '../services/FavoritosService';
import CardPropiedad from './CardPropiedad';

/**
 * Vista de 'Mi Cartera' (Favoritos del Agente).
 * Muestra exclusivamente las propiedades que el agente ha marcado para seguimiento.
 */
export function Favoritos({ session, onNotificar, tasaBCV }) {
  const navigate = useNavigate();
  const [propiedades, setPropiedades] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarFavoritos = async () => {
      try {
        const data = await FavoritosService.obtenerPropiedadesFavoritas(session.user.id);
        setPropiedades(data);
      } catch (e) {
        onNotificar && onNotificar("Error al cargar favoritos", "error");
      } finally {
        setCargando(false);
      }
    };

    if (session?.user) {
      cargarFavoritos();
    }
  }, [session, onNotificar]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabecera Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest mb-4 group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Volver al Inicio
            </button>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              Mi Cartera <span className="text-blue-600">Privada</span>
            </h2>
            <p className="text-slate-400 font-bold text-sm mt-2 opacity-80 uppercase tracking-widest">
              Gestiona tus inmuebles favoritos de la red
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-2xl text-yellow-600">
              <Star size={24} fill="currentColor" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Guardados</p>
              <p className="text-xl font-black text-slate-900">{propiedades.length} Inmuebles</p>
            </div>
          </div>
        </div>

        {/* Grid de Propiedades */}
        {propiedades.length === 0 ? (
          <div className="bg-white rounded-[50px] border-2 border-dashed border-slate-200 p-20 text-center flex flex-col items-center">
            <div className="bg-slate-100 p-8 rounded-full mb-6">
              <Home size={64} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase mb-2">Tu cartera está vacía</h3>
            <p className="text-slate-400 font-medium max-w-sm mx-auto mb-8">
              Explora el marketplace y marca propiedades con la estrella para guardarlas aquí.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-600/20"
            >
              Ir al Marketplace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {propiedades.map((prop) => (
              <CardPropiedad 
                key={prop.id}
                propiedad={prop}
                usuarioActual={session.user}
                onNotificar={onNotificar}
                tasaBCV={tasaBCV}
                favoritoInicial={true} // Siempre es true en esta vista
                alActualizar={() => {
                   // Si se vende o algo, recargar
                   setPropiedades(prev => prev.filter(p => p.id !== prop.id));
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
