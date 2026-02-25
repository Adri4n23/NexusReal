import React, { useState } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, Zap, AlertCircle, Building2, Smartphone, Landmark } from 'lucide-react';

export function Facturacion({ session, onNotificar }) {
    const [metodo, setMetodo] = useState('pago_movil');
    const [archivoComprobante, setArchivoComprobante] = useState(null);
    const [subiendo, setSubiendo] = useState(false);
    const [pagoEnviado, setPagoEnviado] = useState(false);
    const orgNombre = session?.user?.user_metadata?.agencia_nombre || 'Tu Agencia';

    const planes = [
        {
            nombre: 'Agencia Pro',
            precio: '49',
            features: ['Agentes Ilimitados', 'CRM de Prospectos', 'Contabilidad 30/70', 'Tasa BCV Automática', 'Exportación PDF'],
            current: true
        }
    ];

    const manejarEnvioComprobante = async () => {
        if (!archivoComprobante) {
            onNotificar?.("Por favor selecciona una foto del comprobante", "error");
            return;
        }

        try {
            setSubiendo(true);
            // Reutilizamos la lógica de subir foto pero para comprobantes
            const publicUrl = await propiedadesService.subirComprobante(archivoComprobante, session.user);
            console.log("Comprobante subido:", publicUrl);

            setPagoEnviado(true);
            onNotificar?.("¡Comprobante enviado! Validaremos tu pago en breve.", "success");
        } catch (error) {
            console.error(error);
            onNotificar?.("Error al subir el comprobante", "error");
        } finally {
            setSubiendo(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* LADO IZQUIERDO: PLAN ACTUAL */}
                <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-blue-900/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <ShieldCheck size={180} className="text-blue-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <span className="bg-green-100 text-green-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest inline-block">Suscripción Activa</span>
                        </div>
                        <h2 className="text-4xl font-serif text-slate-900 mb-2">Plan {planes[0].nombre}</h2>
                        <p className="text-slate-400 font-bold text-sm mb-8">Gestión profesional para {orgNombre}</p>

                        <div className="space-y-4 mb-10">
                            {planes[0].features.map(f => (
                                <div key={f} className="flex items-center gap-3 text-slate-600 font-medium">
                                    <CheckCircle2 size={18} className="text-blue-600" />
                                    <span>{f}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-baseline gap-2 border-t border-slate-50 pt-8">
                            <span className="text-4xl font-black text-slate-900">${planes[0].precio}</span>
                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">/ Mes</span>
                        </div>
                    </div>
                </div>

                {/* LADO DERECHO: PASARELA DE PAGO */}
                <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-8">Renovación de Licencia</h3>

                    {pagoEnviado ? (
                        <div className="bg-blue-600/10 border border-blue-500/30 p-8 rounded-[30px] text-center space-y-4">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-600/20">
                                <CheckCircle2 size={32} />
                            </div>
                            <h4 className="font-black uppercase text-sm tracking-widest">Pago en Verificación</h4>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">Hemos recibido tu comprobante. Tu licencia se extenderá automáticamente una vez validado el depósito (aprox. 15 min).</p>
                            <button onClick={() => setPagoEnviado(false)} className="text-blue-400 text-[10px] font-black uppercase tracking-widest hover:underline pt-4">Enviar otro pago</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setMetodo('card')}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${metodo === 'card' ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
                                >
                                    <CreditCard size={20} />
                                    <span className="text-[9px] font-black uppercase">Card</span>
                                </button>
                                <button
                                    onClick={() => setMetodo('pago_movil')}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${metodo === 'pago_movil' ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
                                >
                                    <Smartphone size={20} />
                                    <span className="text-[9px] font-black uppercase">Vnzla</span>
                                </button>
                                <button
                                    onClick={() => setMetodo('zelle')}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${metodo === 'zelle' ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
                                >
                                    <Landmark size={20} />
                                    <span className="text-[9px] font-black uppercase">Zelle</span>
                                </button>
                            </div>

                            <div className="bg-white/5 rounded-[24px] p-6 border border-white/10">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Instrucciones de Pago</p>
                                {metodo === 'pago_movil' ? (
                                    <div className="space-y-2 text-sm font-medium">
                                        <p>Banco: <span className="text-white font-black">BANCAMIGA (0172)</span></p>
                                        <p>CI/RIF: <span className="text-white font-black">J-123456789</span></p>
                                        <p>Teléfono: <span className="text-white font-black">0412-1234567</span></p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 py-4">
                                        <Landmark className="text-blue-400" />
                                        <p className="text-xs text-slate-400">Instrucciones de Zelle enviadas a tu correo administrativo.</p>
                                    </div>
                                )}
                            </div>

                            <div className="relative group">
                                <label className="block bg-white/5 border-2 border-dashed border-white/10 p-5 rounded-2xl text-center cursor-pointer hover:border-blue-500 transition-all">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => setArchivoComprobante(e.target.files[0])}
                                    />
                                    {archivoComprobante ? (
                                        <span className="text-blue-400 text-xs font-black truncate block">{archivoComprobante.name}</span>
                                    ) : (
                                        <div className="space-y-1">
                                            <span className="text-xs font-black text-slate-300 block uppercase tracking-widest">Subir Foto Comprobante</span>
                                            <span className="text-[9px] text-slate-500 block italic">JPG, PNG o PDF</span>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <button
                                onClick={manejarEnvioComprobante}
                                disabled={subiendo || !archivoComprobante}
                                className={`w-full py-5 rounded-[20px] font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${subiendo || !archivoComprobante ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'}`}
                            >
                                {subiendo ? <Loader2 className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                                {subiendo ? 'Enviando...' : 'Confirmar y Activar Mes'}
                            </button>
                        </div>
                    )}

                    <p className="text-[9px] text-center text-slate-500 mt-8 font-black uppercase tracking-[0.3em]">Conexión Encriptada AES-256</p>
                </div>

            </div>
        </div>
    );
}
