import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Building2, ShieldCheck, Mail, Lock, User, Phone } from 'lucide-react';

/**
 * Componente Login: Maneja la autenticación y registro de agentes en la red Nexus.
 * Implementa seguridad OWASP evitando la elevación de privilegios el lado del cliente.
 * 
 * @param {Object} props
 * @param {Function} props.on_notificar - Callback para mostrar alertas al usuario.
 * @returns {JSX.Element}
 */
function Login({ onNotificar }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [agencia, setAgencia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [es_registro, set_es_registro] = useState(false);

  /**
   * Procesa el inicio de sesión o registro de un nuevo agente.
   * @param {Event} e - Evento de formulario.
   */
  const manejar_auth = async (e) => {
    e.preventDefault();
    setLoading(true);

    let resultado;
    
    if (es_registro) {
      // SEGURIDAD: Todos los registros nuevos entran como 'agente' con status 'trial'.
      // La elevación a 'superadmin' o 'owner' solo se permite desde la DB o RPC seguro.
      resultado = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nombre: nombre.trim(),
            agencia_nombre: agencia.trim() || 'Independiente',
            telefono: telefono.trim(),
            rol: 'agente', // Rol por defecto (Blindaje contra escalada)
            status: 'pendiente'
          }
        }
      });
    } else {
      resultado = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
    }

    const { error } = resultado;
    
    if (error) {
      if (onNotificar) onNotificar("Error de Acceso: " + error.message, 'error');
    } else if (es_registro) {
      onNotificar("¡Registro exitoso! Por favor verifica tu correo electrónico.");
      set_es_registro(false);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-md w-full bg-white border border-slate-100 rounded-[40px] shadow-2xl shadow-blue-900/10 overflow-hidden transform transition-all duration-500">
        
        {/* Header Decorativo */}
        <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-transparent opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 flex items-center justify-center rounded-2xl shadow-xl shadow-blue-600/40">
                <Building2 className="text-white" size={24} />
              </div>
              <span className="text-3xl font-serif tracking-[0.2em] uppercase text-white">Nexus</span>
            </div>
            <p className="text-blue-400 font-black uppercase text-[9px] tracking-[0.4em]">
              {es_registro ? 'Red Inmobiliaria de Venezuela' : 'División de Gestión y Cierre Pro'}
            </p>
          </div>
        </div>

        <div className="p-10">
          <form onSubmit={manejar_auth} className="space-y-4">
            {es_registro && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" required className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all text-sm text-slate-700" placeholder="Nombre completo" onChange={(e) => setNombre(e.target.value)} />
                </div>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all text-sm text-slate-700" placeholder="Nombre de tu Agencia" onChange={(e) => setAgencia(e.target.value)} />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="tel" required className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all text-sm text-slate-700" placeholder="WhatsApp +58..." onChange={(e) => setTelefono(e.target.value)} />
                </div>
              </>
            )}
            
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="email" required className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all text-sm text-slate-700" placeholder="Correo Corporativo" onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="password" required className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all text-sm text-slate-700" placeholder="Contraseña de acceso" onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-[22px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 mt-6 flex items-center justify-center gap-3 text-[10px]">
              {loading ? 'Validando Credenciales...' : (es_registro ? 'Finalizar Registro' : 'Entrar al Ecosistema')} 
              {!loading && <ShieldCheck size={18} />}
            </button>
          </form>

          <div className="mt-10 text-center text-[9px] font-black uppercase tracking-widest pt-6 border-t border-slate-50">
            <button
              onClick={() => set_es_registro(!es_registro)}
              className="text-slate-400 hover:text-blue-600 transition-all flex flex-col items-center gap-2 mx-auto"
            >
              <span>{es_registro ? '¿Ya tienes una cuenta operativa?' : '¿Eres un nuevo agente Nexus?'}</span>
              <span className="text-blue-600 text-[10px] underline underline-offset-4">{es_registro ? 'Inicia Sesión aquí' : 'Crea tu perfil Pro'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;