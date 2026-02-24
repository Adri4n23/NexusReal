import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Building2 } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 selection:bg-amber-500 selection:text-black">
      <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-8">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-amber-500 flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Building2 className="text-black" size={24} />
            </div>
            <span className="text-3xl font-serif tracking-[0.2em] uppercase text-white">Nexus</span>
          </div>
          <p className="text-gray-500 mt-2">{esRegistro ? 'Crear nueva cuenta de Agente' : 'Acceso exclusivo para Agentes'}</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {esRegistro && (
            <>
              <input type="text" required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm text-white placeholder:text-gray-600" placeholder="Nombre completo" onChange={(e) => setNombre(e.target.value)} />
              <input type="text" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm text-white placeholder:text-gray-600" placeholder="Nombre de tu Inmobiliaria (opcional)" onChange={(e) => setAgencia(e.target.value)} />
              <input type="tel" required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm text-white placeholder:text-gray-600" placeholder="Teléfono (WhatsApp)" onChange={(e) => setTelefono(e.target.value)} />
            </>
          )}
          <input type="email" required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm text-white placeholder:text-gray-600" placeholder="Correo" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm text-white placeholder:text-gray-600" placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)} />
          
          <button type="submit" disabled={loading} className="w-full py-4 bg-amber-500 text-black rounded-xl font-bold uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 mt-2">
            {loading ? 'Procesando...' : (esRegistro ? 'Registrarme' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="mt-6 text-center">
            <button 
                onClick={() => setEsRegistro(!esRegistro)}
                className="text-sm text-amber-500 font-semibold hover:underline"
            >
                {esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
            </button>
        </div>
      </div>
    </div>
  );
}

export default Login;