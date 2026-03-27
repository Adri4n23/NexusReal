import React, { useState, useEffect } from 'react';
import { propiedadesService } from '../propiedadesService';
import {
    ShieldCheck,
    Users,
    CreditCard,
    Activity,
    CheckCircle2,
    XCircle,
    Eye,
    RefreshCcw,
    TrendingUp,
    Building2,
    DollarSign,
    Clock,
    Search,
    ArrowUpRight,
    Loader2
} from 'lucide-react';

export default function SuperAdmin({ session, onNotificar }) {
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('pagos'); // 'pagos' | 'organizaciones' | 'metricas'
    const [pagos, setPagos] = useState([]);
    const [organizaciones, setOrganizaciones] = useState([]);
    const [metricas, setMetricas] = useState([]);
    const [suscripciones_agentes, set_suscripciones_agentes] = useState([]);
    const [stats, setStats] = useState({
        totalRecaudado: 0,
        agenciasActivas: 0,
        pagosPendientes: 0
    });

    useEffect(() => {
        fetchGlobalData();
    }, []);

    const fetchGlobalData = async () => {
        try {
            setLoading(true);
            const [dataPagos, dataOrgs, dataMetricas, dataSus] = await Promise.all([
                propiedadesService.adminObtenerPagosPendientes(),
                propiedadesService.adminObtenerOrganizaciones(),
                propiedadesService.adminObtenerMetricasGlobales(),
                propiedadesService.admin_obtener_suscripciones_agentes()
            ]);

            setPagos(dataPagos || []);
            setOrganizaciones(dataOrgs || []);
            setMetricas(dataMetricas || []);
            set_suscripciones_agentes(dataSus || []);

            // Calcular Estadísticas
            const activas = dataOrgs.filter(o => o.plan_status === 'active').length;
            const pendientes = dataPagos.length;
            // Aquí asumimos que queremos ver cuánto dinero hay en "aprobado" de una consulta más amplia si existiera
            // pero por ahora usemos datos reales de lo que tenemos
            setStats({
                totalRecaudado: dataOrgs.length * 30, // Aproximación basada en agencias
                agenciasActivas: activas,
                pagosPendientes: pendientes
            });

        } catch (error) {
            console.error("Error en SuperAdmin:", error);
            onNotificar?.("Error al cargar la consola central", "error");
        } finally {
            setLoading(false);
        }
    };

    const aprobarPago = async (pago) => {
        const pin = window.prompt(`¿Aprobar pago de $${pago.monto} para ${pago.organizaciones?.agencia_nombre}?\n\nINGRESE PIN DE SEGURIDAD:`);
        if (!pin) return;
        try {
            await propiedadesService.adminAprobarPago(pago.id, pago.oficina_id, pin);
            onNotificar?.("Pago aprobado y licencia activada", "success");
            fetchGlobalData();
        } catch (error) {
            onNotificar?.(error.message || "Error al aprobar pago", "error");
        }
    };

    const rechazarPago = async (pago) => {
        const motivo = window.prompt("Indica el motivo del rechazo:");
        if (!motivo) return;
        try {
            await propiedadesService.adminRechazarPago(pago.id, pago.oficina_id, motivo);
            onNotificar?.("Pago rechazado", "info");
            fetchGlobalData();
        } catch (error) {
            onNotificar?.("Error al rechazar pago", "error");
        }
    };

    const aprobar_pago_individual = async (suscripcion_id) => {
        const pin = window.prompt("¿Aprobar licencia Pro individual (+30 días)?\n\nINGRESE PIN DE SEGURIDAD:");
        if (!pin) return;
        try {
            await propiedadesService.admin_aprobar_pago_agente(suscripcion_id, pin);
            onNotificar?.("Licencia de agente aprobada", "success");
            fetchGlobalData();
        } catch (error) {
            onNotificar?.(error.message || "Error aprobando suscripción", "error");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                <p className="text-blue-200/50 font-black text-[10px] uppercase tracking-[0.5em]">Accediendo al Núcleo...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 md:p-12 pt-24">
            <div className="max-w-7xl mx-auto">

                {/* Header Estilo Cyber-Control */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-blue-600 text-[9px] font-black rounded-full tracking-widest uppercase">Admin Universal</div>
                            <div className="h-[1px] w-12 bg-blue-600/30"></div>
                        </div>
                        <h1 className="text-5xl font-serif">Nexus <span className="text-blue-500">HQ Control</span></h1>
                    </div>

                    <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
                        <button onClick={() => setTab('pagos')} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${tab === 'pagos' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Pagos Agencias ({stats.pagosPendientes})</button>
                        <button onClick={() => setTab('agentes')} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${tab === 'agentes' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Pagos Agentes ({suscripciones_agentes.filter(s => s.status === 'pendiente').length})</button>
                        <button onClick={() => setTab('organizaciones')} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${tab === 'organizaciones' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Agencias</button>
                        <button onClick={() => setTab('metricas')} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${tab === 'metricas' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Métricas</button>
                    </div>
                </div>

                {/* Stats Rápidos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><DollarSign size={80} /></div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Recaudación Estimada</p>
                        <h3 className="text-4xl font-bold font-mono">${stats.totalRecaudado.toLocaleString()}</h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Building2 size={80} /></div>
                        <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">Agencias Activas</p>
                        <h3 className="text-4xl font-bold font-mono">{stats.agenciasActivas}</h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Clock size={80} /></div>
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Cierres en Revisión</p>
                        <h3 className="text-4xl font-bold font-mono">{stats.pagosPendientes}</h3>
                    </div>
                </div>

                {/* Contenido Dinámico */}
                <div className="bg-white/5 border border-white/10 rounded-[40px] overflow-hidden backdrop-blur-xl">

                    {tab === 'pagos' && (
                        <div className="p-8 animate-in fade-in duration-500">
                            <h2 className="text-xl font-serif mb-8 flex items-center gap-3">
                                <CreditCard className="text-blue-500" /> Auditoría de Pagos Pendientes
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <th className="px-6 py-4 text-center">Agencia</th>
                                            <th className="px-6 py-4 text-center">Monto</th>
                                            <th className="px-6 py-4 text-center">Método</th>
                                            <th className="px-6 py-4 text-center">Comprobante</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {pagos.length > 0 ? pagos.map(pago => (
                                            <tr key={pago.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-6">
                                                    <p className="font-bold">{pago.organizaciones?.agencia_nombre}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase font-black">{new Date(pago.created_at).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-6 py-6 text-center font-mono font-bold text-green-400">${pago.monto}</td>
                                                <td className="px-6 py-6 text-center"><span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase text-slate-300">{pago.metodo}</span></td>
                                                <td className="px-6 py-6 text-center">
                                                    <a href={pago.comprobante_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-black text-[10px] uppercase tracking-widest border-b border-blue-400/30">
                                                        <Eye size={14} /> Ver Imagen
                                                    </a>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button onClick={() => rechazarPago(pago)} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"><XCircle size={18} /></button>
                                                        <button onClick={() => aprobarPago(pago)} className="px-6 py-3 bg-green-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all flex items-center gap-2">
                                                            <CheckCircle2 size={16} /> Aprobar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" className="px-6 py-20 text-center text-slate-500 italic">No hay pagos pendientes por revisar. El sistema está al día.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === 'organizaciones' && (
                        <div className="p-8 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-serif flex items-center gap-3">
                                    <Building2 className="text-blue-500" /> Red de Agencias Nexus
                                </h2>
                                <button onClick={fetchGlobalData} className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 hover:text-white"><RefreshCcw size={14} /> Actualizar</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {organizaciones.map(org => (
                                    <div key={org.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl group hover:border-blue-500/50 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500"><Building2 size={24} /></div>
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${org.plan_status === 'active' ? 'bg-green-500 text-white' : org.plan_status === 'pending' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                                                {org.plan_status}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg mb-1">{org.agencia_nombre || 'Sin Nombre'}</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">ID: {org.id.split('-')[0]}...</p>
                                        <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
                                            <span className="text-slate-400">Expira:</span>
                                            <span className="font-mono text-blue-400">{new Date(org.trial_ends_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === 'metricas' && (
                        <div className="p-8 animate-in fade-in duration-500">
                            <h2 className="text-xl font-serif mb-8 flex items-center gap-3">
                                <Activity className="text-blue-500" /> Monitor Global de Ventas
                            </h2>
                            <div className="space-y-4">
                                {metricas.length > 0 ? metricas.map(met => (
                                    <div key={met.id} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-10 h-10 bg-green-500/20 text-green-500 rounded-xl flex items-center justify-center"><ArrowUpRight size={20} /></div>
                                            <div>
                                                <p className="font-black text-[10px] uppercase tracking-widest text-blue-400">Venta Registrada</p>
                                                <p className="font-bold text-lg">Agencia: {met.agency}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold font-mono text-green-400">${Number(met.value).toLocaleString()}</p>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{new Date(met.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-20 text-slate-500 italic">No se han registrado cierres globales aún.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === 'agentes' && (
                        <div className="p-8 animate-in fade-in duration-500">
                            <h2 className="text-xl font-serif mb-8 flex items-center gap-3">
                                <Users className="text-blue-500" /> Auditoría de Licencias Pro Individuales
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <th className="px-6 py-4">ID Agente</th>
                                            <th className="px-6 py-4 text-center">Plan Actual</th>
                                            <th className="px-6 py-4 text-center">Estado</th>
                                            <th className="px-6 py-4 text-center">Vencimiento</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {suscripciones_agentes.length > 0 ? suscripciones_agentes.map(sus => (
                                            <tr key={sus.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-6">
                                                    <p className="font-mono text-[10px] text-slate-300">{sus.user_id}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold mt-1">Suscripción: {sus.id.split('-')[0]}</p>
                                                </td>
                                                <td className="px-6 py-6 text-center font-black uppercase text-[10px]">{sus.plan}</td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className={`px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase ${sus.status === 'activo' ? 'text-green-400' : sus.status === 'pendiente' ? 'text-amber-400' : 'text-red-400'}`}>{sus.status}</span>
                                                </td>
                                                <td className="px-6 py-6 text-center text-sm font-mono text-slate-300">
                                                    {new Date(sus.fecha_vencimiento).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    {sus.status !== 'activo' ? (
                                                        <button onClick={() => aprobar_pago_individual(sus.id)} className="px-5 py-2 bg-blue-600 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 inline-flex">
                                                            <CheckCircle2 size={14} /> Aprobar (+30 Días)
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-600">Al día</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" className="px-6 py-20 text-center text-slate-500 italic">No hay licencias de agentes en el sistema.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
