import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X, PartyPopper, TrendingUp } from 'lucide-react';

export function Notificacion({ mensaje, tipo, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (mensaje) {
        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300); // Esperar animación de salida
        }, tipo === 'venta' ? 8000 : 4000); // Las ventas duran más
        return () => clearTimeout(timer);
    }
  }, [mensaje, onClose, tipo]);

  if (!mensaje && !visible) return null;

  const config = {
    error: {
        bg: 'bg-red-50 border-red-100 text-red-800',
        icon: <AlertCircle size={24} className="text-red-500" />,
        title: '¡Ups! Algo salió mal'
    },
    success: {
        bg: 'bg-green-50 border-green-100 text-green-800',
        icon: <CheckCircle size={24} className="text-green-500" />,
        title: '¡Éxito!'
    },
    venta: {
        bg: 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-400 text-white',
        icon: <PartyPopper size={32} className="text-amber-300 animate-bounce" />,
        title: '¡VENTA CONFIRMADA!'
    }
  };

  const current = config[tipo] || config.success;

  return (
    <div className={`fixed top-4 right-4 z-[300] transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-95'}`}>
        <div className={`flex items-center gap-4 px-8 py-6 rounded-[35px] shadow-2xl border-2 ${current.bg} min-w-[320px] max-w-md`}>
            {current.icon}
            <div className="flex-1">
                <h4 className={`font-black text-sm uppercase tracking-tight ${tipo === 'venta' ? 'text-amber-300' : ''}`}>{current.title}</h4>
                <p className={`text-xs font-bold mt-1 leading-relaxed ${tipo === 'venta' ? 'text-white' : 'opacity-80'}`}>{mensaje}</p>
            </div>
            <button onClick={() => setVisible(false)} className={`p-2 rounded-xl transition-all ${tipo === 'venta' ? 'hover:bg-white/20' : 'hover:bg-black/5'}`}>
                <X size={18} />
            </button>
        </div>
    </div>
  );
}