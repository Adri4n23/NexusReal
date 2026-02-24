import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './supabase'; 
import { propiedadesService } from './propiedadesService';
import Login from './components/Login.jsx';
import LandingPage from './components/LandingPage.jsx';
import { Notificacion } from './components/Notificacion.jsx';
import Inicio from './components/Inicio.jsx';
import DetallePropiedad from './components/DetallePropiedad.jsx';
import { ShieldAlert } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [licencia, setLicencia] = useState({ activa: true, mensaje: '' });
  const [cargando, setCargando] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  
  // Estado para notificaciones
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: '' });

  const mostrarNotificacion = (mensaje, tipo = 'exito') => {
    setNotificacion({ mensaje, tipo });
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await validarAcceso(session.user);
      }
      setCargando(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        validarAcceso(session.user);
        iniciarSuscripciones(session.user);
      } else {
        // Si el usuario cierra sesión, no es necesario cargar nada más
        setCargando(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const iniciarSuscripciones = (user) => {
    // Suscribirse a notificaciones de venta
    const sub = propiedadesService.subscribirseANotificaciones((notif) => {
      // Si la notificación es de mi agencia o global (organizacion_id null)
      if (!notif.organizacion_id || notif.organizacion_id === user.user_metadata?.organizacion_id) {
        mostrarNotificacion(notif.mensaje, 'venta');
        // Si es una venta, podríamos disparar un efecto de sonido o confeti aquí
      }
    });
    return () => supabase.removeChannel(sub);
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white text-2xl">Cargando...</p>
      </div>
    );
  }

  // Renderizado condicional para bloqueo por licencia
  if (session && !licencia.activa) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white rounded-[40px] p-10 shadow-2xl border-t-8 border-red-500">
          <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase">Acceso Restringido</h2>
          <p className="text-slate-600 font-medium mb-8 leading-relaxed">
            {licencia.mensaje}
          </p>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Renderizado condicional con Notificaciones Globales
  if (!session) {
    return (
      <>
        <Notificacion 
          mensaje={notificacion.mensaje} 
          tipo={notificacion.tipo} 
          onClose={() => setNotificacion({ mensaje: '', tipo: '' })} 
        />
        {showLogin ? <Login onNotificar={mostrarNotificacion} /> : <LandingPage onAccederClick={() => setShowLogin(true)} />}
      </>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Notificacion 
          mensaje={notificacion.mensaje} 
          tipo={notificacion.tipo} 
          onClose={() => setNotificacion({ mensaje: '', tipo: '' })} 
        />
        
        <Routes>
          <Route path="/" element={<Inicio session={session} onNotificar={mostrarNotificacion} />} />
          <Route path="/propiedad/:id" element={<DetallePropiedad session={session} onNotificar={mostrarNotificacion} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
