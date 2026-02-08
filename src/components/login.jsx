import React, { useState } from 'react';
import { supabase } from '../supabase';

function Login({ onNotificar }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [agencia, setAgencia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [esRegistro, setEsRegistro] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    let result;
    if (esRegistro) {
      result = await supabase.auth.signUp({
        email, 
        password,
        options: {
          data: { 
            nombre: nombre,
            agencia_nombre: agencia || 'Independiente',
            telefono: telefono,
            rol: 'agente' // Por defecto son agentes
          }
        }
      });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }

    const { error } = result;
    if (error) {
        if (onNotificar) onNotificar("Error: " + error.message, 'error');
        else alert("Error: " + error.message);
    } else if (esRegistro) {
        onNotificar("¡Registro exitoso! Revisa tu correo para confirmar (o inicia sesión si no activaste confirmación).");
        setEsRegistro(false);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-900 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-gray-900">NEXUS REAL</h2>
          <p className="text-gray-500 mt-2">{esRegistro ? 'Crear nueva cuenta de Agente' : 'Acceso exclusivo para Agentes'}</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {esRegistro && (
            <>
              <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Nombre completo" onChange={(e) => setNombre(e.target.value)} />
              <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Nombre de tu Inmobiliaria (opcional)" onChange={(e) => setAgencia(e.target.value)} />
              <input type="tel" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Teléfono (WhatsApp)" onChange={(e) => setTelefono(e.target.value)} />
            </>
          )}
          <input type="email" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Correo" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)} />
          
          <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 mt-2">
            {loading ? 'Procesando...' : (esRegistro ? 'Registrarme' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="mt-6 text-center">
            <button 
                onClick={() => setEsRegistro(!esRegistro)}
                className="text-sm text-blue-600 font-semibold hover:underline"
            >
                {esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
            </button>
        </div>
      </div>
    </div>
  );
}

export default Login;