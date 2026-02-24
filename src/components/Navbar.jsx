import React from 'react';
import { supabase } from '../supabase';
import { Search, LogOut, Edit3, RefreshCw, Building2 } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';
import TasaBCV from './TasaBCV';

function Navbar({ usuario, tasaBCV, setTasaBCV, onNotificar }) {
  const [refrescando, setRefrescando] = React.useState(false);
  const [mostrarModalTasa, setMostrarModalTasa] = React.useState(false);
  const [nuevaTasa, setNuevaTasa] = React.useState('');

  const esAdmin = usuario?.user_metadata?.rol === 'admin';

  // Sincronizar con la tasa que viene del padre solo cuando el modal se abre
  React.useEffect(() => {
    if (mostrarModalTasa && tasaBCV) {
      setNuevaTasa(tasaBCV.toString());
    }
  }, [mostrarModalTasa, tasaBCV]);

  const guardarTasaManual = async () => {
    const valorNum = parseFloat(nuevaTasa);
    if (!valorNum || isNaN(valorNum) || valorNum <= 0) {
      onNotificar?.("Ingresa un valor válido mayor a 0", "error");
      return;
    }
    
    try {
      setRefrescando(true);
      const exito = await propiedadesService.guardarTasaManual(valorNum);
      
      if (exito) {
        if (setTasaBCV) {
          setTasaBCV(valorNum);
        }
        onNotificar?.("Tasa actualizada correctamente", "success");
        setMostrarModalTasa(false);
      }
    } catch (e) {
      console.error("Error en Navbar:", e);
      onNotificar?.("Error al guardar: " + (e.message || "Problema de conexión"), "error");
    } finally {
      setRefrescando(false);
    }
  };

  const consultarTasaOficial = async () => {
    try {
      setRefrescando(true);
      const tasa = await propiedadesService.obtenerTasaOficial();
      if (tasa) {
        setNuevaTasa(tasa.toString());
        onNotificar?.("Tasa oficial obtenida. Verifica y guarda.", "success");
      } else {
        onNotificar?.("No se pudo conectar con el BCV. Ingresa el valor manual.", "error");
      }
    } catch (e) {
      onNotificar?.("Error al consultar tasa", "error");
    } finally {
      setRefrescando(false);
    }
  };

  return (
    <>
      {/* MODAL PARA EDITAR TASA - Fuera del NAV para evitar cortes visuales */}
      {mostrarModalTasa && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[35px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 text-center text-white relative">
              <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-400/30">
                <Edit3 size={28} className="text-blue-400" />
              </div>
              
              <h3 className="text-xl font-black uppercase tracking-tight">Ajustar Tasa</h3>
              <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">Control de Cambio Nexus</p>
              
              <button 
                onClick={consultarTasaOficial}
                disabled={refrescando}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all group"
                title="Sincronizar con BCV"
              >
                <RefreshCw size={14} className={`text-blue-400 ${refrescando ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Valor en Bolívares (Bs.)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Bs.</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-black text-slate-700 text-lg"
                    value={nuevaTasa}
                    onChange={(e) => setNuevaTasa(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setMostrarModalTasa(false)}
                  className="flex-1 bg-gray-200 text-gray-800 font-bold py-3.5 rounded-2xl hover:bg-gray-300 transition-all uppercase text-[10px] tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarTasaManual}
                  disabled={refrescando}
                  className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 uppercase text-[10px] tracking-widest disabled:opacity-50"
                >
                  {refrescando ? 'Procesando...' : 'Guardar Tasa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BARRA DE NAVEGACIÓN */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-500 flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Building2 className="text-black" />
            </div>
            <span className="text-2xl font-serif tracking-[0.2em] uppercase text-white">Nexus</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.2em] font-medium text-gray-400">
            <a href="#" className="hover:text-amber-500 transition-colors">Inicio</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Propiedades</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Servicios</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Contacto</a>
          </div>

          <div className="flex items-center gap-4">
             <TasaBCV tasa={tasaBCV} onNotificar={onNotificar} />
             
             {esAdmin && (
                <button
                  onClick={() => setMostrarModalTasa(true)}
                  className="p-2 bg-white/5 rounded-full text-amber-500 hover:bg-white/10 transition-all"
                  title="Ajuste Manual"
                >
                  <Edit3 size={16} />
                </button>
              )}

             <button 
                onClick={() => supabase.auth.signOut()} 
                className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-red-500/40 transition-all"
                title="Salir"
              >
                Salir
             </button>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;