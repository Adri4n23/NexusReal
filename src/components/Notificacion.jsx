import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X, PartyPopper, TrendingUp } from 'lucide-react';

export function Notificacion({ mensaje, tipo, onClose }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (mensaje) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onClose, 300);
            }, tipo === 'venta' ? 8000 : 4000);
            return () => clearTimeout(timer);
        }
    }, [mensaje, onClose, tipo]);

    if (!mensaje && !visible) return null;

    const config = {
        error: {
            bg: 'bg-white border-red-100 text-slate-800 shadow-xl shadow-red-900/5',
            icon: <AlertCircle size={24} className="text-red-500" />,
            title: 'Atención'
        },
        success: {
            bg: 'bg-white border-blue-100 text-slate-800 shadow-xl shadow-blue-900/5',
            icon: <CheckCircle size={24} className="text-blue-600" />,
            title: 'Operación Exitosa'
        },
        venta: {
            bg: 'bg-gradient-to-br from-blue-700 to-blue-600 border-blue-400 text-white shadow-2xl shadow-blue-600/30',
            icon: <PartyPopper size={32} className="text-white animate-bounce" />,
            title: '¡VENTA CONFIRMADA!'
        }
    };

    const current = config[tipo] || config.success;

    return (
        <div className={`fixed top-8 right-8 z-[300] transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-95'}`}>
            <div className={`flex items-center gap-4 px-8 py-6 rounded-[32px] border-2 ${current.bg} min-w-[320px] max-w-md`}>
                {current.icon}
                <div className="flex-1">
                    <h4 className={`font-black text-xs uppercase tracking-[0.2em] ${tipo === 'venta' ? 'text-white' : 'text-slate-800'}`}>{current.title}</h4>
                    <p className={`text-xs font-bold mt-1 leading-relaxed ${tipo === 'venta' ? 'text-blue-50' : 'text-slate-400'}`}>{mensaje}</p>
                </div>
                <button onClick={() => setVisible(false)} className={`p-2 rounded-xl transition-all ${tipo === 'venta' ? 'hover:bg-white/20' : 'hover:bg-slate-50'}`}>
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}