import React, { useState, useEffect } from 'react';
import { supabase } from './supabase'; // Según tu captura, se llama así
import Login from './components/Login';
import Navbar from './components/Navbar';
import Formulario from './components/Formulario';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {!session ? (
        <Login />
      ) : (
        <>
          <Navbar />
          <div className="p-4">
            <Formulario />
          </div>
        </>
      )}
    </div>
  );
}

export default App;