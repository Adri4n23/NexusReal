import React, { useState, useEffect } from 'react';
import {
    Wallet,
    TrendingUp,
    History,
    DollarSign,
    ArrowRight,
    Loader2,
    Award,
    ShieldCheck,
    Zap,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';
import { propiedadesService } from '../propiedadesService';

export function MiBolsillo({ session, onNotificar }) {
    const [loading, setLoading] = useState(true);
    const [comisiones, setComisiones] = useState([]);
    const [resumen, setResumen] = useState({
        acumulado: 0,
        conteo: 0
    });

    const usuario = session?.user;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await propiedadesService.obtenerComisionesAgente(usuario.id);
            setComisiones(data || []);

            const acumulado = data.reduce((acc, c) => acc + Number(c.monto_comision || 0), 0);
            setResumen({
                acumulado,
                conteo: data.length
            });
        } catch (error) {
            console.error("Error cargando comisiones:", error);
            onNotificar?.("Error al sincronizar tu bolsillo", "error");
        } finally {
            setLoading(false);
        }
    };

    const solicitarLiquidacion = async () => {
        if (resumen.acumulado <= 0) {
            onNotificar?.("No tienes fondos suficientes para liquidar", "error");
            return;
        }

        // Simulación de solicitud de liquidación enviando notificación al Admin
        onNotificar?.("Solicitando liquidación a contabilidad...", "success");
        setTimeout(() => {
            onNotificar?.("Solicitud enviada. Recibirás tu pago en las próximas 24h.", "success");
        }, 1500);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Sincronizando Bóveda...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">

            {/* CARD DE BALANCE: NEXUS GLASSMORPHISM */}
            <div className="relative group overflow-hidden rounded-[50px] bg-[#00429d] p-1 shadow-2xl shadow-blue-900/40">
                {/* Capas de fondo para el efecto cristal */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-400/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-600/30 rounded-full blur-[100px]"></div>

                <div className="relative z-10 bg-[#00429d]/40 backdrop-blur-xl border border-white/10 rounded-[48px] p-12 text-white">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/10 rounded-[22px] flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                                <Wallet size={28} className="text-blue-100" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-200/80">Nexus Vault</span>
                                <h1 className="text-xl font-serif text-white">Mi Bolsillo Personal</h1>
                            </div>
                        </div>

                        {/* RANGO DEL AGENTE CON BADGE PREMIUM */}
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-200/60 mb-2">Estatus Actual</span>
                            <div className="bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border border-yellow-400/30 px-5 py-2 rounded-full flex items-center gap-3 backdrop-blur-sm">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-100 flex items-center gap-2">
                                    Rango Senior <Award size={14} className="text-yellow-400" />
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 mb-12">
                        <p className="text-sm font-medium text-blue-100/60 flex items-center gap-2 uppercase tracking-widest">
                            <TrendingUp size={16} /> Comisiones Acumuladas
                        </p>
                        <div className="flex items-baseline gap-4">
                            <span className="text-7xl font-black tracking-tighter">${resumen.acumulado.toLocaleString()}</span>
                            <span className="text-blue-200/40 text-sm font-mono">USD</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-200/50">Cierres Totales</span>
                                <ArrowUpRight size={14} className="text-blue-300" />
                            </div>
                            <span className="text-3xl font-black">{resumen.conteo}</span>
                        </div>
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-200/50">Proyección Mes</span>
                                <Zap size={14} className="text-yellow-400" />
                            </div>
                            <span className="text-3xl font-black">+14%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* HISTORIAL: DISEÑO MINIMALISTA DE ALTO CONTRASTE */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                        <History size={16} className="text-blue-600" /> Últimos Movimientos
                    </h3>
                    <button className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors">Ver Todo</button>
                </div>

                <div className="space-y-4">
                    {comisiones.length > 0 ? comisiones.map((c) => (
                        <div key={c.id} className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-xl shadow-blue-900/5 flex items-center justify-between group hover:border-blue-200 transition-all duration-300">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
                                    <DollarSign size={28} />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-800 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                                        {c.ventas_registro?.propiedades?.titulo || 'Comisión por Venta'}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </p>
                                        <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                        <p className="text-[9px] font-black text-green-600 uppercase bg-green-50 px-3 py-1 rounded-full">Liquidado</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                <span className="text-2xl font-black text-slate-900">+${Number(c.monto_comision).toLocaleString()}</span>
                                <ChevronRight className="text-slate-200 group-hover:text-blue-600 transition-colors" size={20} />
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <ShieldCheck size={32} className="text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sin movimientos recientes en tu bóveda</p>
                        </div>
                    )}
                </div>
            </div>

            {/* BOTÓN DE ACCIÓN: SOLICITAR LIQUIDACIÓN */}
            <div className="pt-6">
                <button
                    onClick={solicitarLiquidacion}
                    className="group w-full py-6 bg-slate-900 hover:bg-blue-600 text-white rounded-[28px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-blue-900/20 transition-all duration-500 flex items-center justify-center gap-4 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    <span className="relative z-10">Solicitar Liquidación Inmediata</span>
                    <ArrowRight size={18} className="relative z-10 group-hover:translate-x-2 transition-transform" />
                </button>
                <p className="text-center text-[9px] text-slate-400 mt-6 font-bold uppercase tracking-widest leading-relaxed opacity-60">
                    Procesado por el departamento de Tesorería de NexusReal • Sujeto a verificación de auditoría 30/70.
                </p>
            </div>
        </div>
    );
}
