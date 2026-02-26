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
      const esCorreoAdmin = email.toLowerCase() === 'adriancv1103@gmail.com';
      result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: nombre,
            agencia_nombre: agencia || (esCorreoAdmin ? 'Nexus HQ' : 'Independiente'),
            telefono: telefono,
            rol: esCorreoAdmin ? 'superadmin' : 'agente'
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
      onNotificar("¡Registro exitoso! Revisa tu correo.");
      setEsRegistro(false);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-md w-full bg-white border border-slate-100 rounded-[40px] shadow-2xl shadow-blue-900/10 overflow-hidden p-10">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-blue-600 flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Building2 className="text-white" size={24} />
            </div>
            <span className="text-3xl font-serif tracking-[0.2em] uppercase text-slate-800">Nexus</span>
          </div>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest leading-relaxed">
            {esRegistro ? 'Plataforma Inmobiliaria - Nuevo Registro' : 'Acceso exclusivo División Lujo'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {esRegistro && (
            <>
              <input type="text" required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all text-sm text-slate-700" placeholder="Nombre completo" onChange={(e) => setNombre(e.target.value)} />
              <input type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all text-sm text-slate-700" placeholder="Agencia" onChange={(e) => setAgencia(e.target.value)} />
              <input type="tel" required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all text-sm text-slate-700" placeholder="WhatsApp" onChange={(e) => setTelefono(e.target.value)} />
            </>
          )}
          <input type="email" required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all text-sm text-slate-700" placeholder="Correo electrónico" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all text-sm text-slate-700" placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)} />

          <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-[20px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 mt-4 text-xs">
            {loading ? 'Procesando...' : (esRegistro ? 'Crear Cuenta' : 'Ingresar al Portal')}
          </button>
        </form>

        <div className="mt-8 text-center text-[10px] font-black uppercase tracking-widest pt-4 border-t border-slate-50">
          <button
            onClick={() => setEsRegistro(!esRegistro)}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            {esRegistro ? 'Volver al Inicio de Sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;