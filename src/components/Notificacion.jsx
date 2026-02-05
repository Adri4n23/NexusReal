import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export function Notificacion({ mensaje, tipo, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (mensaje) {
        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300); // Esperar animación de salida
        }, 4000);
        return () => clearTimeout(timer);
    }
  }, [mensaje, onClose]);

  if (!mensaje && !visible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${tipo === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'}`}>
            {tipo === 'error' ? <AlertCircle size={24} className="text-red-500" /> : <CheckCircle size={24} className="text-green-500" />}
            <div>
                <h4 className="font-bold text-sm">{tipo === 'error' ? '¡Ups! Algo salió mal' : '¡Éxito!'}</h4>
                <p className="text-xs font-medium opacity-80">{mensaje}</p>
            </div>
            <button onClick={() => setVisible(false)} className="ml-4 p-1 hover:bg-black/5 rounded-full transition-colors">
                <X size={16} />
            </button>
        </div>
    </div>
  );
}