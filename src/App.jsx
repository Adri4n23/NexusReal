import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './supabase';
import { propiedadesService } from './propiedadesService';
import Login from './components/Login.jsx';
import LandingPage from './components/LandingPage.jsx';
import { Notificacion } from './components/Notificacion.jsx';
import Inicio from './components/Inicio.jsx';
import DetallePropiedad from './components/DetallePropiedad.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import { MiBolsillo } from './components/MiBolsillo.jsx';
import { ShieldAlert, Loader2, Lock, FileText } from 'lucide-react';
import { Facturacion } from './components/Facturacion.jsx';

function App() {
  const [session, setSession] = useState(null);
  const [licencia, setLicencia] = useState({ activa: true, mensaje: '' });
  const [cargando, setCargando] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Tasa Global Reactiva
  const [tasaBCV, setTasaBCV] = useState(() => {
    const cache = localStorage.getItem('tasa_bcv_cache');
    return cache ? parseFloat(cache) : 48.50;
  });

  // Estado para notificaciones
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: '' });

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotificacion({ mensaje, tipo });
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await Promise.all([
          validarAcceso(session.user),
          cargarTasaGlobal()
        ]);
        iniciarSuscripcionesGlobales(session.user);
      }
      setCargando(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        validarAcceso(session.user);
        cargarTasaGlobal();
        iniciarSuscripcionesGlobales(session.user);
      } else {
        setCargando(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const cargarTasaGlobal = async () => {
    try {
      const tasa = await propiedadesService.obtenerTasa();
      if (tasa) {
        setTasaBCV(tasa);
        localStorage.setItem('tasa_bcv_cache', tasa.toString());
      }
    } catch (e) {
      console.error("Error al cargar tasa inicial:", e);
    }
  };

  const iniciarSuscripcionesGlobales = (user) => {
    // 1. Suscripción a Notificaciones de Ventas
    propiedadesService.subscribirseANotificaciones((notif) => {
      if (!notif.organizacion_id || notif.organizacion_id === user.user_metadata?.organizacion_id) {
        mostrarNotificacion(notif.mensaje, 'venta');
      }
    });

    // 2. Suscripción a Tasa en Tiempo Real (Update DE GOLPE para todos)
    propiedadesService.subscribirseATasa((nuevaTasa) => {
      setTasaBCV(nuevaTasa);
      localStorage.setItem('tasa_bcv_cache', nuevaTasa.toString());
    });
  };

  const validarAcceso = async (user) => {
    const orgId = user.user_metadata?.organizacion_id;
    if (orgId) {
      const status = await propiedadesService.verificarLicencia(orgId);
      setLicencia(status);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Nexus Real Estate</p>
      </div>
    );
  }

  if (session && licencia.bloqueado) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[50px] p-12 mb-8 text-center">
            <h2 className="text-4xl font-serif text-white mb-4">Suscripción <span className="text-blue-500">Expirada</span></h2>
            <p className="text-slate-400 font-medium mb-12 max-w-xl mx-auto">{licencia.mensaje}</p>
            <Facturacion session={session} onNotificar={mostrarNotificacion} />
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] block mx-auto hover:text-white transition-all"
          >
            ← Desconectarse
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {!session ? (
        <>
          <Notificacion
            mensaje={notificacion.mensaje}
            tipo={notificacion.tipo}
            onClose={() => setNotificacion({ mensaje: '', tipo: '' })}
          />
          {showLogin ? <Login onNotificar={mostrarNotificacion} /> : <LandingPage onAccederClick={() => setShowLogin(true)} />}
        </>
      ) : (
        <div className="min-h-screen bg-slate-50">
          <Notificacion
            mensaje={notificacion.mensaje}
            tipo={notificacion.tipo}
            onClose={() => setNotificacion({ mensaje: '', tipo: '' })}
          />

          <Routes>
            <Route path="/" element={<Inicio session={session} onNotificar={mostrarNotificacion} tasaBCV={tasaBCV} setTasaBCV={setTasaBCV} licencia={licencia} />} />
            <Route path="/propiedad/:id" element={<DetallePropiedad session={session} onNotificar={mostrarNotificacion} tasaBCV={tasaBCV} />} />
            <Route path="/dashboard" element={<AdminDashboard session={session} onNotificar={mostrarNotificacion} licencia={licencia} />} />
            <Route path="/bolsillo" element={
              <div className="pt-32 pb-20 px-6 max-w-xl mx-auto">
                <MiBolsillo session={session} onNotificar={mostrarNotificacion} />
              </div>
            } />
          </Routes>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
