import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Search, LogOut, Edit3, RefreshCw, Building2, LayoutDashboard, X, MapPin, Wallet, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { propiedadesService } from '../propiedadesService';
import TasaBCV from './TasaBCV';

function Navbar({ usuario, tasaBCV, setTasaBCV, onNotificar, alBuscar, alBuscarZona, onPublicar }) {
  const [refrescando, setRefrescando] = useState(false);
  const [mostrarModalTasa, setMostrarModalTasa] = useState(false);
  const [nuevaTasa, setNuevaTasa] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [zona, setZona] = useState('');

  const esAdmin = usuario?.user_metadata?.rol === 'admin';

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
            <div className="flex-1 max-w-3xl w-full flex bg-white rounded-2xl shadow-inner border-2 border-transparent focus-within:border-blue-300 overflow-hidden transition-all">
              <div className="flex-1 relative border-r border-slate-100">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Ej: Penthouse, Casa..."
                  value={busqueda}
                  onChange={handleSearchChange}
                  className="w-full py-2.5 pl-12 pr-4 outline-none text-slate-700 font-medium text-sm placeholder:text-slate-300"
                />
              </div>
              <div className="flex-1 relative bg-slate-50/50">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                  <MapPin size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Zona o Ciudad..."
                  value={zona}
                  onChange={handleZonaChange}
                  className="w-full py-2.5 pl-12 pr-10 outline-none text-slate-700 font-bold text-sm bg-transparent placeholder:text-slate-300"
                />
                {zona && (
                  <button onClick={limpiarZona} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 p-1">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* LADO DERECHO: ACCIONES */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:block">
                <TasaBCV tasa={tasaBCV} />
              </div>

              <Link to="/bolsillo" className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all" title="Mis Ganancias">
                <Wallet size={20} />
              </Link>

              {/* Botón de Publicar en Navbar */}
              {onPublicar && (
                <button
                  onClick={onPublicar}
                  className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                >
                  <PlusCircle size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Publicar</span>
                </button>
              )}

              {esAdmin && (
                <>
                  <Link to="/dashboard" className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all" title="Panel de Control">
                    <LayoutDashboard size={20} />
                  </Link>
                  <button onClick={() => setMostrarModalTasa(true)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all" title="Ajustar Tasa">
                    <Edit3 size={18} />
                  </button>
                </>
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