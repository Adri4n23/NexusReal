import React, { useState, useEffect } from 'react';
import { supabase } from './supabase'; // En tu captura se llama 'supabase.js'
import Login from './components/Login'; // Tienes 'Login.jsx'
import Navbar from './components/Navbar'; // Tienes 'Navbar.jsx'
import Formulario from './components/Formulario'; // Tienes 'Formulario.jsx'
import CardPropiedad from './components/CardPropiedad'; // Tienes 'CardPropiedad.jsx'

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuchar cambios de inicio/cierre de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Cargando Nexus Real...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {!session ? (
        <Login />
      ) : (
        <>
          <Navbar />
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Panel de Control</h1>
            <Formulario />
            {/* Aquí podrías mapear tus propiedades usando CardPropiedad */}
          </div>
        </>
      )}
    </div>
  );
}

export default App;