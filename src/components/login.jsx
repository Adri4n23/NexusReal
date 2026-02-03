import React, { useState } from 'react';
import { Lock, Mail, Loader2, ChevronLeft } from 'lucide-react';

export const Login = ({ alLoguear, alCancelar }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      await alLoguear(email, pass);
    } catch (err) {
      alert("Acceso denegado: Revisa tus credenciales");
    }
    setCargando(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-slate-200 relative">
        <button onClick={alCancelar} className="absolute top-6 left-6 text-slate-400 hover:text-[#0056b3] transition-colors">
          <ChevronLeft size={24} />
        </button>
        
        <div className="text-center mb-8 mt-4">
          <div className="bg-[#0056b3] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Admin Nexus</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
            <input 
              type="email" placeholder="Correo de administrador" 
              className="w-full p-4 pl-12 bg-slate-50 rounded-2xl outline-none border border-slate-200 focus:border-[#0056b3]"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
            <input 
              type="password" placeholder="Contraseña" 
              className="w-full p-4 pl-12 bg-slate-50 rounded-2xl outline-none border border-slate-200 focus:border-[#0056b3]"
              value={pass} onChange={e => setPass(e.target.value)} required
            />
          </div>
          <button disabled={cargando} className="w-full bg-[#0056b3] text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 flex items-center justify-center gap-2">
            {cargando ? <Loader2 className="animate-spin" /> : 'INICIAR SESIÓN'}
          </button>
        </form>
      </div>
    </div>
  );
};