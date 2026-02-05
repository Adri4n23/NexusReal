import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './supabase'; 
import Login from './components/Login.jsx';
import { Notificacion } from './components/Notificacion.jsx';
import Inicio from './components/Inicio.jsx';
import DetallePropiedad from './components/DetallePropiedad.jsx';

function App() {
  const [session, setSession] = useState(null);
  
  // Estado para notificaciones
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: '' });

  const mostrarNotificacion = (mensaje, tipo = 'exito') => {
    setNotificacion({ mensaje, tipo });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Renderizado condicional con Notificaciones Globales
  if (!session) {
    return (
      <>
        <Notificacion 
          mensaje={notificacion.mensaje} 
          tipo={notificacion.tipo} 
          onClose={() => setNotificacion({ mensaje: '', tipo: '' })} 
        />
        <Login onNotificar={mostrarNotificacion} />
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
          <Route path="/propiedad/:id" element={<DetallePropiedad onNotificar={mostrarNotificacion} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
