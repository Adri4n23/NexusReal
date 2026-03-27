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
    PieChart as PieChartIcon,
    ChevronRight,
    Loader2,
    AlertCircle,
    LayoutDashboard,
    Wallet,
    CreditCard,
    UserPlus,
    UserMinus,
    Check,
    Zap,
    Lock
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar
} from 'recharts';
import { Facturacion } from './Facturacion';

function AdminDashboard({ session, onNotificar, licencia }) {
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
    const [licencia_agente, set_licencia_agente] = useState(null);

    const usuario = session?.user;
    const orgNombre = usuario?.user_metadata?.agencia_nombre || 'Mi Agencia';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [dataVentas, stats, team, itemsNotif, lic_indv] = await Promise.all([
                propiedadesService.obtenerVentasAgencia(usuario),
                propiedadesService.obtenerEstadisticasAgencia(usuario),
                propiedadesService.obtenerAgentesPorOrganizacion(usuario.user_metadata?.organizacion_id),
                propiedadesService.obtenerNotificaciones(usuario.user_metadata?.organizacion_id),
                propiedadesService.verificar_suscripcion_agente(usuario.id).catch(e => ({ status: 'vencido', fecha_vencimiento: new Date().toISOString() }))
            ]);

            setVentas(dataVentas || []);
            setAgentes(team || []);
            setNotificaciones(itemsNotif || []);
            set_licencia_agente(lic_indv);

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

    // Lógica para transformar datos para los gráficos
    const getDatosGraficoVentas = () => {
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const datos = meses.map(mes => ({ name: mes, ingresos: 0 }));

        ventas.forEach(v => {
            const fecha = new Date(v.created_at);
            const mesIdx = fecha.getMonth();
            datos[mesIdx].ingresos += Number(v.monto_venta || 0);
        });

        // Filtrar meses sin datos si se prefiere, o mostrar tendencia anual
        return datos;
    };

    const calcular_dias_restantes = (fecha) => {
        if (!fecha) return 0;
        const diff = new Date(fecha).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    const getDatosGraficoTipos = () => {
        const tipos = {};
        ventas.forEach(v => {
            const tipo = v.propiedades?.tipo_inmueble || 'Otro';
            tipos[tipo] = (tipos[tipo] || 0) + 1;
        });
        return Object.entries(tipos).map(([name, value]) => ({ name, value }));
    };

    const COLORS = ['#00429d', '#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe'];

    const exportarPDF = async () => {
        if (licencia?.status !== 'active') {
            onNotificar?.("Función Pro: Requiere suscripción activa para exportar reportes.", "error");
            return;
        }
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

                {/* ALERTA DE VENCIMIENTO INDIVIDUAL */}
                {licencia_agente && licencia_agente.status === 'activo' && calcular_dias_restantes(licencia_agente.fecha_vencimiento) <= 3 && (
                    <div className="bg-amber-500 text-white p-6 rounded-[24px] flex flex-col md:flex-row items-center justify-between mb-8 shadow-xl shadow-amber-500/20 border border-amber-400 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shrink-0">
                                <AlertCircle size={24} className="animate-pulse" />
                            </div>
                            <div>
                                <h4 className="font-black uppercase tracking-widest text-xs mb-1">¡Licencia Pro a punto de Expirar!</h4>
                                <p className="text-amber-50 text-[11px] font-medium leading-relaxed">
                                    Tu agenda de ventas privada se bloqueará en <strong>{calcular_dias_restantes(licencia_agente.fecha_vencimiento)} días</strong>. Evita perder acceso al Generador de Contratos y al Importador Masivo.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setView('billing')} 
                            className="w-full md:w-auto px-6 py-3 bg-white text-amber-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-amber-50 transition-all shadow-lg shrink-0"
                        >
                            Renovar Licencia
                        </button>
                    </div>
                )}
                
                {/* ALERTA VENCIDA */}
                {licencia_agente && licencia_agente.status === 'vencido' && (
                    <div className="bg-red-500 text-white p-6 rounded-[24px] flex flex-col md:flex-row items-center justify-between mb-8 shadow-xl shadow-red-500/20 border border-red-400 animate-in fade-in">
                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shrink-0">
                                <Lock size={24} />
                            </div>
                            <div>
                                <h4 className="font-black uppercase tracking-widest text-xs mb-1">Licencia Pro Expirada</h4>
                                <p className="text-red-50 text-[11px] font-medium leading-relaxed">
                                    Las características avanzadas han sido bloqueadas. Renueva tu licencia para recuperar el acceso a tu embudo de ventas privado y al Importador Masivo.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setView('billing')} 
                            className="w-full md:w-auto px-6 py-3 bg-white text-red-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-50 transition-all shadow-lg shrink-0"
                        >
                            Pagar Mensualidad
                        </button>
                    </div>
                )}

                {view === 'accounting' && (
                    <div className="animate-in fade-in duration-700">
                        {/* SECCIÓN DE GRÁFICOS ANALÍTICOS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
                            {/* Gráfico de Tendencia de Ingresos */}
                            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-blue-900/5">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                                        <TrendingUp size={18} className="text-blue-600" />
                                        Tendencia de Ingresos
                                    </h3>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anual ($)</span>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={getDatosGraficoVentas()}>
                                            <defs>
                                                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} tickFormatter={(v) => `$${v / 1000}k`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '15px' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                            />
                                            <Area type="monotone" dataKey="ingresos" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorIngresos)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Gráfico de Distribución por Tipo */}
                            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-blue-900/5">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                                        <PieChartIcon size={18} className="text-blue-600" />
                                        Distribución de Cierres
                                    </h3>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Por Tipo</span>
                                </div>
                                <div className="h-[300px] w-full flex items-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={getDatosGraficoTipos()}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={8}
                                                dataKey="value"
                                            >
                                                {getDatosGraficoTipos().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '15px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="w-1/3 flex flex-col gap-3">
                                        {getDatosGraficoTipos().map((entry, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                <span className="text-[10px] font-black text-slate-600 uppercase truncate">{entry.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* WIDGET BALANCE DE COMISIONES - GLASSMORPHISM ADJUSTED */}
                        <div className="relative overflow-hidden bg-white/20 backdrop-blur-md rounded-[50px] p-12 border border-white/30 shadow-2xl shadow-blue-900/10 mb-12 group transition-all hover:bg-white/30">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Building2 size={120} className="text-blue-900" />
                            </div>

                            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                                <div className="space-y-4 text-center lg:text-left">
                                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-600 mb-2">Balance de Comisiones</h2>
                                    <div className="flex flex-col">
                                        <span className="text-6xl font-black text-slate-900 tracking-tighter">
                                            ${estadisticas.totalIngresos.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Total Facturado Bruto</span>
                                    </div>
                                </div>

                                <div className="h-20 w-[1px] bg-slate-200 hidden lg:block"></div>

                                <div className="flex flex-wrap justify-center gap-10">
                                    <div className="text-center lg:text-left">
                                        <div className="flex items-center gap-2 mb-2 justify-center lg:justify-start">
                                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Agencia (30%)</span>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-900">${estadisticas.comisionAgencia.toLocaleString()}</p>
                                        <p className="text-[9px] font-black text-blue-600 uppercase mt-1">Ganancia Neta</p>
                                    </div>

                                    <div className="text-center lg:text-left">
                                        <div className="flex items-center gap-2 mb-2 justify-center lg:justify-start">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pool Agentes (70%)</span>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-900">${estadisticas.poolAgentes.toLocaleString()}</p>
                                        <p className="text-[9px] font-black text-green-600 uppercase mt-1">Monto a Repartir</p>
                                    </div>
                                </div>

                                <button
                                    onClick={exportarPDF}
                                    className={`px-8 py-5 rounded-[25px] font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 ${licencia?.status === 'active' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-105' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                    {licencia?.status === 'active' ? <Download size={16} /> : <Lock size={16} />}
                                    Descargar Corte
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                            <div className="bg-white/70 p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-blue-900/5 relative overflow-hidden group">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Inventario Total</p>
                                <h3 className="text-3xl font-bold font-mono text-slate-800">{estadisticas.prospectosTotales + 12}</h3> {/* Placeholder logic for assets */}
                                <div className="mt-6 flex items-center gap-2 text-blue-600 font-black text-[10px] bg-blue-50 w-fit px-3 py-1 rounded-full uppercase tracking-widest">
                                    <Building2 size={14} /> Unidades Nexus
                                </div>
                            </div>
                            <div className="bg-white/70 p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-blue-900/5 relative overflow-hidden">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Volumen de Ventas</p>
                                <h3 className="text-3xl font-bold font-mono text-slate-800">${estadisticas.totalIngresos.toLocaleString()}</h3>
                                <div className="mt-6 flex items-center gap-2 text-green-600 font-black text-[10px] bg-green-50 w-fit px-3 py-1 rounded-full uppercase tracking-widest">
                                    <DollarSign size={14} /> Total Cobrado
                                </div>
                            </div>
                            <div className="bg-white/70 p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-blue-900/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Equipo Activo</p>
                                <h3 className="text-3xl font-bold font-mono text-blue-600">{agentes.length}</h3>
                                <div className="mt-6 flex items-center gap-2 text-blue-600 font-black text-[10px] bg-blue-50 w-fit px-3 py-1 rounded-full uppercase tracking-widest">
                                    <Users size={14} /> Agentes
                                </div>
                            </div>
                            <div className="bg-white/70 p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-blue-900/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Estado Premium</p>
                                <h3 className="text-3xl font-bold font-mono text-green-600">ACTIVO</h3>
                                <div className="mt-6 flex items-center gap-2 text-green-600 font-black text-[10px] bg-green-50 w-fit px-3 py-1 rounded-full uppercase tracking-widest">
                                    <Zap size={14} /> Nexus PRO
                                </div>
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
