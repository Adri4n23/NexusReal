import React from 'react';
import { supabase } from '../supabase';
import { Search, LogOut, Building2, Edit3, RefreshCw, DollarSign } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';
import TasaBCV from './TasaBCV';

function Navbar({ alBuscar, usuario, tasaBCV, setTasaBCV, onNotificar }) {
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
      onNotificar && onNotificar("Ingresa un valor válido mayor a 0", "error");
      return;
    }
    
    try {
      setRefrescando(true);
      
      const exito = await propiedadesService.guardarTasaManual(valorNum);
      
      if (exito) {
        // ACTUALIZACIÓN DIRECTA DEL ESTADO
        if (setTasaBCV) {
          setTasaBCV(valorNum);
        }
        
        onNotificar && onNotificar("Tasa actualizada correctamente", "success");
        setMostrarModalTasa(false);
      }
    } catch (e) {
      console.error("Error detallado en Navbar:", e);
      onNotificar && onNotificar("Error al guardar: " + (e.message || "Problema de conexión"), "error");
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
        onNotificar && onNotificar("Tasa oficial obtenida. Verifica y guarda.", "exito");
      } else {
        onNotificar && onNotificar("No se pudo conectar con el BCV. Ingresa el valor manual.", "error");
      }
    } catch (e) {
      onNotificar && onNotificar("Error al consultar tasa", "error");
    } finally {
      setRefrescando(false);
    }
  };


  return (
    <nav className="bg-slate-900 pt-4 pb-12 md:pt-6 md:pb-16 px-4 md:px-6 rounded-b-[45px] shadow-2xl text-white relative overflow-hidden mb-6">
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#0056b3] rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>

      {/* MODAL PARA EDITAR TASA MANUALMENTE - Movido fuera del contenedor z-10 para evitar problemas de stacking */}
      {mostrarModalTasa && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-sm rounded-[35px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-center text-white relative">
                      <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-blue-500/30">
                          <Edit3 size={28} className="text-blue-400" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Ajustar Tasa</h3>
                      <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">Control de Cambio Nexus</p>
                      
                      {/* BOTÓN DE SINCRONIZACIÓN MÁGICA */}
                      <button 
                        onClick={consultarTasaOficial}
                        disabled={refrescando}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all group"
                        title="Sincronizar con BCV"
                      >
                        <RefreshCw size={14} className={`text-blue-300 ${refrescando ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
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
                              className="flex-1 bg-slate-100 text-slate-500 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all uppercase text-[10px] tracking-widest"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={guardarTasaManual}
                              className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 uppercase text-[10px] tracking-widest"
                          >
                              Guardar Tasa
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0056b3] rounded-xl flex items-center justify-center shadow-lg">
                <Building2 size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-tighter italic leading-none">NexusReal</h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Red Inmobiliaria</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <TasaBCV 
                tasa={tasaBCV}
                onNotificar={onNotificar}
             />
             <button 
                onClick={() => setMostrarModalTasa(true)} 
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                title="Ajuste Manual"
             >
                <Edit3 size={16} className="text-blue-400" />
             </button>
             <div className="text-right hidden md:block">
                <p className="text-[11px] font-bold text-slate-200">{usuario?.user_metadata?.nombre || usuario?.email}</p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="text-[9px] text-green-400 font-black uppercase tracking-tighter">Agente Verificado</span>
                  <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                  <span className="text-[9px] text-blue-400 font-black uppercase tracking-tighter">
                    {usuario?.user_metadata?.agencia_nombre || 'Independiente'}
                  </span>
                </div>
             </div>
             <button onClick={() => supabase.auth.signOut()} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">
                <LogOut size={18} />
             </button>
          </div>
        </div>
        

        
        <div className="relative max-w-4xl mx-auto transform translate-y-6 text-center">
          <div className="mb-8 flex flex-col items-center">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic leading-none mb-3 drop-shadow-xl">
              NexusReal
            </h1>
            <p className="text-xs md:text-base text-[#0056b3] font-black uppercase tracking-[0.4em] opacity-90">
              Red Inmobiliaria
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="mb-3 px-4 flex items-center justify-between">
              <h2 className="text-base md:text-lg font-bold text-slate-200">
                Hola, <span className="text-white">{usuario?.user_metadata?.nombre || usuario?.email?.split('@')[0]}</span> 👋
              </h2>
              <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider hidden sm:block">
                ¿Qué propiedad buscas hoy?
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
              <input 
                type="text" 
                onChange={(e) => alBuscar(e.target.value)}
                className="w-full bg-white rounded-full py-5 pl-14 pr-8 outline-none text-slate-800 text-base font-medium shadow-2xl placeholder:text-slate-300 ring-8 ring-black/5"
                placeholder="Buscar propiedad, zona o código..."
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;