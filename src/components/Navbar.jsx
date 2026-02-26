import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Search, LogOut, Edit3, RefreshCw, Building2, LayoutDashboard, X, MapPin, Wallet, PlusCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { propiedadesService } from '../propiedadesService';
import TasaBCV from './TasaBCV';

function Navbar({ usuario, tasaBCV, setTasaBCV, onNotificar, alBuscar, alBuscarZona, onPublicar }) {
  const [refrescando, setRefrescando] = useState(false);
  const [mostrarModalTasa, setMostrarModalTasa] = useState(false);
  const [nuevaTasa, setNuevaTasa] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [zona, setZona] = useState('');
  const [busquedaMovilAbierta, setBusquedaMovilAbierta] = useState(false);

  const esAdmin = usuario?.user_metadata?.rol === 'owner' || usuario?.user_metadata?.rol === 'superadmin';

  useEffect(() => {
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
        if (setTasaBCV) setTasaBCV(valorNum);
        onNotificar?.("Tasa actualizada correctamente", "success");
        setMostrarModalTasa(false);
      }
    } catch (e) {
      onNotificar?.("Error al guardar: " + e.message, "error");
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
        onNotificar?.("Tasa oficial obtenida.", "success");
      }
    } catch (e) {
      onNotificar?.("Error al consultar tasa", "error");
    } finally {
      setRefrescando(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setBusqueda(val);
    if (alBuscar) alBuscar(val);
  };

  const handleZonaChange = (e) => {
    const val = e.target.value;
    setZona(val);
    if (alBuscarZona) alBuscarZona(val);
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    if (alBuscar) alBuscar('');
  };

  const limpiarZona = () => {
    setZona('');
    if (alBuscarZona) alBuscarZona('');
  };

  return (
    <>
      {mostrarModalTasa && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[35px] overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-blue-600 p-6 text-center text-white relative">
              <h3 className="text-xl font-black uppercase tracking-tight">Ajustar Tasa</h3>
              <button
                onClick={consultarTasaOficial}
                disabled={refrescando}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
              >
                <RefreshCw size={14} className={refrescando ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-slate-800">
              <input
                type="number"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-blue-500 font-bold"
                value={nuevaTasa}
                onChange={e => setNuevaTasa(e.target.value)}
              />
              <div className="flex gap-3">
                <button onClick={() => setMostrarModalTasa(false)} className="flex-1 bg-slate-100 py-3 rounded-2xl font-bold text-slate-400">Cancelar</button>
                <button onClick={guardarTasaManual} className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-bold">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="fixed top-0 w-full z-50 transition-all duration-300">
        <div className="bg-[#00429d] rounded-b-[40px] shadow-2xl pb-6 px-6 pt-4">
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

            {/* LADO IZQUIERDO: LOGO */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-black text-white tracking-tight">NexusReal</span>
            </Link>

            {/* CENTRO: BUSCADOR DUAL (Keywords + Zona) */}
            <div className={`${busquedaMovilAbierta ? 'flex absolute inset-x-0 top-0 h-full z-[60] bg-[#00429d] p-6' : 'hidden'} md:flex flex-1 max-w-4xl w-full flex bg-white rounded-full shadow-inner border-2 border-transparent focus-within:border-blue-300 overflow-hidden transition-all duration-500`}>
              <div className="flex-1 relative border-r border-slate-100 flex items-center">
                <div className="absolute left-6 text-slate-300">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Ej: Penthouse, Casa..."
                  value={busqueda}
                  onChange={handleSearchChange}
                  className="w-full py-4 pl-14 pr-4 outline-none text-slate-800 font-bold text-sm placeholder:text-slate-300 bg-transparent"
                />
              </div>
              <div className="flex-1 relative bg-slate-50/50 flex items-center">
                <div className="absolute left-6 text-blue-600">
                  <MapPin size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Zona o Ciudad..."
                  value={zona}
                  onChange={handleZonaChange}
                  className="w-full py-4 pl-14 pr-12 outline-none text-slate-800 font-bold text-sm bg-transparent placeholder:text-slate-300"
                />
                {zona && (
                  <button onClick={limpiarZona} className="absolute right-4 text-slate-300 hover:text-slate-600 p-2">
                    <X size={16} />
                  </button>
                )}
              </div>
              {busquedaMovilAbierta && (
                <button onClick={() => setBusquedaMovilAbierta(false)} className="md:hidden bg-blue-600 text-white p-4 rounded-full ml-2">
                  <X size={20} />
                </button>
              )}
            </div>

            {/* LADO DERECHO: ACCIONES */}
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => setBusquedaMovilAbierta(true)}
                className="md:hidden p-3 bg-white/10 rounded-full text-white"
              >
                <Search size={22} />
              </button>

              <div className="hidden lg:flex items-center gap-2">
                <TasaBCV tasa={tasaBCV} />
                {esAdmin && (
                  <button
                    onClick={() => setMostrarModalTasa(true)}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all border border-white/20 group"
                    title="Ajustar Tasa"
                  >
                    <Edit3 size={14} className="group-hover:scale-110 transition-transform" />
                  </button>
                )}
              </div>

              <Link to="/bolsillo" className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all" title="Mis Ganancias">
                <Wallet size={20} />
              </Link>

              {/* BOTÓN PRIMARIO: PUBLICAR (UNIFICADO) */}
              {onPublicar && (
                <button
                  onClick={onPublicar}
                  className="hidden md:flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl transition-all shadow-[0_10px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  <PlusCircle size={20} className="stroke-[3px]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">Publicar Propiedad</span>
                </button>
              )}

              {esAdmin && (
                <Link to="/dashboard" className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all" title="Panel de Control">
                  <LayoutDashboard size={20} />
                </Link>
              )}

              {usuario?.user_metadata?.rol === 'superadmin' && (
                <Link to="/master-hq" className="p-2.5 bg-blue-500/80 hover:bg-blue-600 rounded-full text-white transition-all shadow-[0_0_10px_rgba(59,130,246,0.5)]" title="Nexus HQ Central">
                  <ShieldCheck size={20} />
                </Link>
              )}

              <button
                onClick={() => supabase.auth.signOut()}
                className="bg-white/10 text-white p-2.5 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-sm"
                title="Cerrar Sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;