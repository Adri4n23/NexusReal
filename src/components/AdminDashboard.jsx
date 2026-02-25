import React, { useState, useEffect } from 'react';
import { propiedadesService } from '../propiedadesService';
import {
    TrendingUp,
    Users,
    DollarSign,
    Building2,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Filter,
    Download,
    Briefcase,
    PieChart,
    ChevronRight,
    Loader2,
    AlertCircle,
    LayoutDashboard,
    Wallet,
    CreditCard,
    UserPlus,
    UserMinus,
    Check,
    Zap
} from 'lucide-react';
import { Facturacion } from './Facturacion';

function AdminDashboard({ session, onNotificar }) {
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('accounting'); // 'accounting' | 'billing' | 'team'
    const [ventas, setVentas] = useState([]);
    const [agentes, setAgentes] = useState([]);
    const [estadisticas, setEstadisticas] = useState({
        totalIngresos: 0,
        comisionAgencia: 0,
        poolAgentes: 0,
        conteoVentas: 0,
        prospectosTotales: 0
    });
    const [notificaciones, setNotificaciones] = useState([]);

    const usuario = session?.user;
    const orgNombre = usuario?.user_metadata?.agencia_nombre || 'Mi Agencia';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [dataVentas, stats, team, itemsNotif] = await Promise.all([
                propiedadesService.obtenerVentasAgencia(usuario),
                propiedadesService.obtenerEstadisticasAgencia(usuario),
                propiedadesService.obtenerAgentesPorOrganizacion(usuario.user_metadata?.organizacion_id),
                propiedadesService.obtenerNotificaciones(usuario.user_metadata?.organizacion_id)
            ]);

            setVentas(dataVentas || []);
            setAgentes(team || []);
            setNotificaciones(itemsNotif || []);

            const totalIngresos = dataVentas.reduce((acc, v) => acc + Number(v.monto_venta || 0), 0);
            const comisionAgencia = dataVentas.reduce((acc, v) => acc + Number(v.comision_agencia || 0), 0);
            const comisionTotalGenerada = dataVentas.reduce((acc, v) => acc + (Number(v.monto_venta || 0) * 0.05), 0);
            const poolAgentes = comisionTotalGenerada * 0.70;

            setEstadisticas({
                totalIngresos,
                comisionAgencia,
                poolAgentes,
                conteoVentas: dataVentas.length,
                prospectosTotales: stats.totalProspectos
            });
        } catch (error) {
            console.error("Error cargando dashboard:", error);
            onNotificar?.("Error al cargar datos financieros", "error");
        } finally {
            setLoading(false);
        }
    };

    const exportarPDF = async () => {
        try {
            onNotificar?.("Generando reporte financiero...", "success");
            const doc = new window.jspdf.jsPDF();

            // Estilo Nexus
            doc.setFillColor(0, 66, 157); // #00429d
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("REPORTE FINANCIERO NEXUSREAL", 20, 25);

            doc.setTextColor(100, 100, 100);
            doc.setFontSize(10);
            doc.text(`Agencia: ${orgNombre}`, 20, 50);
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 55);

            // Tabla de Ventas
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text("RESUMEN DE CIERRES", 20, 70);

            let y = 80;
            doc.setDrawColor(240, 240, 240);
            doc.line(20, y, 190, y);
            y += 10;

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("PROPIEDAD", 20, y);
            doc.text("PRECIO VENTA", 100, y);
            doc.text("AGENCIA (30%)", 150, y);
            y += 5;

            doc.setFont("helvetica", "normal");
            ventas.forEach((v) => {
                if (y > 270) { doc.addPage(); y = 20; }
                y += 10;
                doc.text(v.propiedades?.titulo?.substring(0, 40) || "Venta", 20, y);
                doc.text(`$${Number(v.monto_venta).toLocaleString()}`, 100, y);
                doc.text(`$${Number(v.comision_agencia).toLocaleString()}`, 150, y);
                doc.line(20, y + 2, 190, y + 2);
            });

            y += 20;
            doc.setFont("helvetica", "bold");
            doc.text(`TOTAL COMISIÓN AGENCIA: $${estadisticas.comisionAgencia.toLocaleString()}`, 110, y);

            doc.save(`Nexus_Reporte_${orgNombre.replace(/\s+/g, '_')}.pdf`);
            onNotificar?.("Reporte listo para descargar", "success");
        } catch (error) {
            console.error(error);
            onNotificar?.("Error al generar PDF", "error");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Sincronizando Contabilidad...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 pt-24">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* HEADER DASHBOARD */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-10">
                    <div>
                        <h1 className="text-5xl font-serif tracking-tight text-slate-900">Panel de <span className="text-blue-600">Control</span></h1>
                        <p className="text-slate-400 text-xs mt-2 font-black uppercase tracking-widest">Gestión de Negocio - {orgNombre}</p>
                    </div>
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                        <button
                            onClick={() => setView('accounting')}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${view === 'accounting' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-blue-600'}`}
                        >
                            <Wallet size={16} /> Contabilidad
                        </button>
                        <button
                            onClick={() => setView('team')}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${view === 'team' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-blue-600'}`}
                        >
                            <Users size={16} /> Equipo
                        </button>
                        <button
                            onClick={() => setView('billing')}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${view === 'billing' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-blue-600'}`}
                        >
                            <CreditCard size={16} /> Suscripción
                        </button>
                    </div>
                </div>

                {view === 'accounting' && (
                    <div className="animate-in fade-in duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-blue-900/5 relative overflow-hidden group">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Volumen Total</p>
                                <h3 className="text-3xl font-bold font-mono text-slate-800">${estadisticas.totalIngresos.toLocaleString()}</h3>
                                <div className="mt-6 flex items-center gap-2 text-green-600 font-black text-[10px] bg-green-50 w-fit px-3 py-1 rounded-full uppercase tracking-widest">
                                    <ArrowUpRight size={14} /> +12.5%
                                </div>
                            </div>
                            <div className="bg-blue-600 p-8 rounded-[40px] border border-blue-600 shadow-2xl shadow-blue-600/30 relative overflow-hidden">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 mb-2">Agencia (30%)</p>
                                <h3 className="text-3xl font-bold font-mono text-white">${estadisticas.comisionAgencia.toLocaleString()}</h3>
                                <p className="text-[10px] text-blue-100 mt-6 font-black uppercase tracking-widest opacity-60 italic">Operatividad Neta</p>
                            </div>
                            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-blue-900/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Pool Agentes (70%)</p>
                                <h3 className="text-3xl font-bold font-mono text-blue-600">${estadisticas.poolAgentes.toLocaleString()}</h3>
                                <p className="text-[10px] text-slate-400 mt-6 font-black uppercase tracking-widest opacity-60 italic">Monto Repartido</p>
                            </div>
                            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-blue-900/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cierres</p>
                                <h3 className="text-3xl font-bold font-mono text-slate-800">{estadisticas.conteoVentas}</h3>
                                <p className="text-[10px] text-slate-400 mt-6 font-black uppercase tracking-widest opacity-60 italic text-blue-600">{estadisticas.prospectosTotales} Leads Activos</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 flex items-center gap-3"><Briefcase size={18} /> Historial Contable</h2>
                                    <button onClick={exportarPDF} className="text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"><Download size={14} /> PDF</button>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-xl shadow-blue-900/5">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-50 bg-slate-50/50">
                                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Propiedad</th>
                                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Inversión</th>
                                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Agencia (30%)</th>
                                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {ventas.length > 0 ? ventas.map((venta) => (
                                                <tr key={venta.id} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-10 py-7">
                                                        <p className="font-bold text-slate-800">{venta.propiedades?.titulo || 'Propiedad'}</p>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{venta.propiedades?.zona || 'Zona'}</p>
                                                    </td>
                                                    <td className="px-10 py-7 text-center font-mono font-bold">${Number(venta.monto_venta).toLocaleString()}</td>
                                                    <td className="px-10 py-7 text-center"><span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black border border-blue-100">${Number(venta.comision_agencia).toLocaleString()}</span></td>
                                                    <td className="px-10 py-7 text-right text-[10px] font-black text-slate-400 uppercase">{new Date(venta.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="4" className="px-10 py-20 text-center text-slate-300 italic">No hay ventas registradas aún.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="lg:col-span-1 space-y-8">
                                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-blue-900/5 relative">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-black uppercase tracking-tight text-slate-800 text-sm">Historial de Actividad</h3>
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    </div>
                                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                                        {notificaciones.length > 0 ? notificaciones.map((notif) => {
                                            const isVenta = notif.tipo === 'venta_exitosa';
                                            const isPago = notif.tipo === 'pago_pendiente';

                                            return (
                                                <div key={notif.id} className="flex gap-4 group">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${isVenta ? 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white' :
                                                            isPago ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' :
                                                                'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                                                        }`}>
                                                        {isVenta ? <Zap size={18} /> : isPago ? <DollarSign size={18} /> : <CreditCard size={18} />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[11px] font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{notif.mensaje}</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                                            <p className="text-[9px] text-slate-400 font-medium tracking-widest uppercase">{new Date(notif.created_at).toLocaleDateString()} - {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <p className="text-center text-slate-300 text-xs italic py-10">Sin actividad reciente</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-blue-900/5">
                                    <h3 className="font-black uppercase tracking-tight text-slate-800 mb-8 text-sm">Corte Mensual</h3>
                                    <div className="p-5 bg-blue-50 rounded-[24px] border border-blue-100">
                                        <span className="text-[9px] font-black uppercase text-blue-600 block mb-1">Pagos Pendientes a Agentes</span>
                                        <span className="text-2xl font-black text-slate-900">${estadisticas.poolAgentes.toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-4 italic">Liquidaciones listas para reparto manual.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'team' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Gestión de Equipo</h2>
                            <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2"><UserPlus size={16} /> Invitar Agente</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {agentes.map(agente => (
                                <div key={agente.id} className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-xl shadow-blue-900/5 flex items-center justify-between transition-all hover:border-blue-200">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black">{agente.nombre?.charAt(0) || 'A'}</div>
                                        <div><p className="font-bold text-slate-800">{agente.nombre || 'Agente'}</p><p className="text-[10px] text-slate-400 font-black uppercase">{agente.email}</p></div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${agente.activo !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{agente.activo !== false ? 'Activo' : 'Inactivo'}</span>
                                        <button className="text-slate-300 hover:text-red-500 transition-colors p-1"><UserMinus size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'billing' && <Facturacion session={session} onNotificar={onNotificar} />}
            </div>
        </div>
    );
}

export default AdminDashboard;
