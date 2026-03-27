import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    FileText, Download, Loader2, Printer, CheckCircle, 
    Calendar, Receipt, ClipboardCheck, AlertTriangle, RefreshCcw 
} from 'lucide-react';
import { ContratoService } from '../services/ContratoService';
import { BCVService } from '../services/BCVService';

/**
 * GeneradorContrato (v3.5 - Edición Multi-Hilo): Arquitectura Modular para Gestión Legal.
 * Este componente es el responsable final de la inyección de datos financieros 
 * y la exportación de documentos legales utilizando Web Workers para evitar 
 * bloqueos en el UI principal.
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.propiedad - Objeto de la propiedad desde Supabase.
 * @param {Object} props.prospecto - Objeto del prospecto (inquilino).
 * @param {Object} props.datos_wizard - Datos dinámicos (Abogado, Inventario, Reglas).
 * @param {Function} props.on_cerrar - Callback para cerrar el modal.
 */
const GeneradorContrato = ({ propiedad, prospecto, datos_wizard, on_cerrar }) => {
    // --- REFERENCIA AL WEB HYPER-STATION (WORKER) ---
    const worker_ref = useRef(null);

    // --- ESTADOS DE DATOS ---
    const [datos_finales, set_datos_finales] = useState(null);
    const [tasa_bcv, set_tasa_bcv] = useState(0);
    const [duracion_meses, set_duracion_meses] = useState(6);
    
    // --- ESTADOS DE UI ---
    const [etapa_carga, set_etapa_carga] = useState('inicial'); // 'inicial', 'tasa', 'inyectando', 'listo', 'error'
    const [exportando_pdf, set_exportando_pdf] = useState(false);
    const [mensaje_error, set_mensaje_error] = useState(null);
    const [tab_activa, set_tab_activa] = useState('contrato'); // 'contrato', 'recibo', 'inventario'

    /**
     * EFECTO DE INICIALIZACIÓN: Orquestación del motor legal y el worker.
     */
    useEffect(() => {
        // Inicializar Worker de PDF en segundo plano (Vite Standard)
        const pdf_worker_url = new URL('../workers/pdf.worker.js', import.meta.url);
        worker_ref.current = new Worker(pdf_worker_url);

        // Listener para recibir el PDF generado
        worker_ref.current.onmessage = (e) => {
            const { status, pdf_data, fileName, message } = e.data;
            set_exportando_pdf(false);

            if (status === 'success') {
                const blob = new Blob([pdf_data], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(url);
            } else {
                set_mensaje_error("Motor de Worker: " + message);
                set_etapa_carga('error');
            }
        };

        const iniciar_motor_legal = async () => {
            try {
                set_etapa_carga('tasa');
                const valor_tasa = await obtener_tasa_resiliente();
                set_tasa_bcv(valor_tasa);

                set_etapa_carga('inyectando');
                await inyectar_datos_documentacion(valor_tasa);
                
                set_etapa_carga('listo');
            } catch (error) {
                manejar_error_supabase(error);
            }
        };

        iniciar_motor_legal();

        // Limpieza de hilos al desmontar
        return () => {
            if (worker_ref.current) {
                worker_ref.current.terminate();
                console.log("Nexus Worker Terminated: Limpieza de memoria exitosa.");
            }
        };
    }, []);

    // Actualizamos datos cuando cambia la duración o el wizard (sin recrear el worker)
    useEffect(() => {
        if (etapa_carga === 'listo' || etapa_carga === 'inyectando') {
           inyectar_datos_documentacion(tasa_bcv);
        }
    }, [duracion_meses, datos_wizard, propiedad.id, prospecto.id]);

    /**
     * MOTOR FINANCIERO: Obtiene la tasa BCV de forma aislada.
     */
    const obtener_tasa_resiliente = async () => {
        try {
            return await BCVService.obtenerTasaOficial();
        } catch (error) {
            const cache = localStorage.getItem('tasa_bcv_cache');
            return cache ? parseFloat(cache) : 48.50;
        }
    };

    /**
     * INYECTOR LEGAL: Une todas las fuentes de datos (DB + Wizard + Tasa).
     */
    const inyectar_datos_documentacion = async (tasa_vigente) => {
        try {
            const payload = await ContratoService.obtenerDatosParaContrato(
                propiedad.id, 
                prospecto.id, 
                duracion_meses, 
                { ...datos_wizard, tasa_manual: tasa_vigente }
            );
            set_datos_finales(payload);
        } catch (error) {
            manejar_error_supabase(error);
        }
    };

    /**
     * SISTEMA DE RESILIENCIA: Maneja desconexiones o errores específicos de Supabase.
     */
    const manejar_error_supabase = (error) => {
        console.error("Auditoría Legal - Fallo en DB:", error);
        set_etapa_carga('error');
        set_mensaje_error(error.message || "Error inesperado al generar la documentación.");
    };

    /**
     * EXPORTACIÓN MULTI-HILO: Delega la carga pesada de jsPDF al Worker.
     */
    const ejecutar_exportacion_async = useCallback(() => {
        if (!datos_finales || !worker_ref.current) return;

        set_exportando_pdf(true);
        let titulo_doc = "";
        let contenido_texto = "";

        switch (tab_activa) {
            case 'contrato':
                titulo_doc = "CONTRATO DE ARRENDAMIENTO";
                contenido_texto = ContratoService.generarCuerpoContrato(datos_finales);
                break;
            case 'recibo':
                titulo_doc = "RECIBO DE PAGO DE GARANTIA";
                contenido_texto = ContratoService.generarReciboPago(datos_finales);
                break;
            case 'inventario':
                titulo_doc = "INVENTARIO Y NORMAS DE CONVIVENCIA";
                contenido_texto = ContratoService.generarInventario(datos_finales);
                break;
        }

        // Enviamos la tarea al Worker
        worker_ref.current.postMessage({
            titulo_documento: titulo_doc,
            contenido_texto: contenido_texto,
            nombre_arrendatario: datos_finales.arrendatario_nombre
        });
    }, [datos_finales, tab_activa]);

    // --- VISTAS CONDICIONALES ---

    if (etapa_carga === 'error') {
        return (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-[40px] shadow-2xl border-2 border-red-50">
                <AlertTriangle className="text-red-500 mb-6 animate-pulse" size={64} />
                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Fallo en Motor Legal</h3>
                <p className="text-slate-500 text-sm text-center mb-8 max-w-sm">{mensaje_error}</p>
                <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all">
                    <RefreshCcw size={16} /> Reintentar Sincronización
                </button>
            </div>
        );
    }

    if (etapa_carga !== 'listo' && !datos_finales) {
        return (
            <div className="flex flex-col items-center justify-center p-24 bg-white rounded-[40px] shadow-2xl border border-slate-100">
                <Loader2 className="animate-spin text-blue-600 mb-6" size={56} />
                <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse text-center">
                    {etapa_carga === 'tasa' ? 'Consultando BCV en Tiempo Real...' : 'Inyectando Inteligencia Legal...'}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden max-w-5xl mx-auto transform transition-all duration-300">
            {/* HEADER NEXUS PRO */}
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Centro de Generación Legal v3.5</h2>
                        <div className="flex items-center gap-2">
                             <div className="flex gap-1">
                                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                 <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-75"></span>
                             </div>
                             <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.2em]">Hilos de Exportación: Activos</p>
                        </div>
                    </div>
                </div>
                <button onClick={on_cerrar} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-red-500/20 hover:text-red-500 transition-all border border-white/10 font-black text-xs">✕</button>
            </div>

            {/* TAB SELECTOR MODULAR */}
            <div className="flex border-b border-slate-100 bg-slate-50/30">
                {[
                    { id: 'contrato', icon: FileText, label: '1. Cuerpo Legal' },
                    { id: 'recibo', icon: Receipt, label: '2. Recibo Pago' },
                    { id: 'inventario', icon: ClipboardCheck, label: '3. Normas & Inv.' }
                ].map((tab) => (
                    <button 
                        key={tab.id}
                        onClick={() => set_tab_activa(tab.id)} 
                        className={`flex-1 flex flex-col items-center py-6 gap-2 transition-all relative ${
                            tab_activa === tab.id ? 'bg-white text-blue-600' : 'text-slate-400 hover:bg-slate-50'
                        }`}
                    >
                        <tab.icon size={20} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
                        {tab_activa === tab.id && <div className="absolute bottom-0 w-full h-1 bg-blue-600"></div>}
                    </button>
                ))}
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* ÁREA DE CONFIGURACIÓN Y PRE-VISUALIZACIÓN */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Calendar size={14} className="text-blue-600" /> Tiempo de Vigencia
                        </h3>
                        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
                            {[6, 12].map(m => (
                                <button 
                                    key={m}
                                    onClick={() => set_duracion_meses(m)} 
                                    className={`px-6 py-2 rounded-xl font-black text-[9px] transition-all uppercase ${
                                        duracion_meses === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
                                    }`}
                                >
                                    {m === 6 ? '6 Meses' : '1 Año'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[40px] border-2 border-dashed border-slate-200/50 max-h-[450px] overflow-y-auto shadow-inner relative group">
                        <pre className="text-[11px] leading-relaxed text-slate-600 whitespace-pre-wrap font-serif">
                            {tab_activa === 'contrato' && ContratoService.generarCuerpoContrato(datos_finales)}
                            {tab_activa === 'recibo' && ContratoService.generarReciboPago(datos_finales)}
                            {tab_activa === 'inventario' && ContratoService.generarInventario(datos_finales)}
                        </pre>
                    </div>
                </div>

                {/* RESUMEN FINANCIERO DUAL BCV */}
                <div className="flex flex-col justify-between py-2">
                    <div className="space-y-6">
                        <div className="bg-blue-600/5 p-8 rounded-[40px] border border-blue-100/50 space-y-4">
                            <h4 className="text-[10px] font-black text-blue-600/60 uppercase tracking-[0.2em] mb-4">Sincronización Dual BCV</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Canon Mensual</p>
                                    <p className="text-xl font-black text-slate-900 block">${datos_finales?.canon_mensual_usd}</p>
                                    <p className="text-[10px] font-bold text-blue-600">Bs. {datos_finales?.canon_mensual_ves}</p>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Depósito Garantía</p>
                                    <p className="text-xl font-black text-slate-900">${datos_finales?.deposito_garantia_usd}</p>
                                    <p className="text-[10px] font-bold text-blue-600">Bs. {datos_finales?.deposito_garantia_ves}</p>
                                </div>
                            </div>
                            <div className="pt-4 flex items-center justify-between">
                                 <span className="text-[9px] font-black text-slate-400 uppercase">Tasa de Inyección:</span>
                                 <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-mono">
                                    {tasa_bcv} Bs/$
                                 </div>
                            </div>
                        </div>

                        {/* STATUS LEGAL */}
                        <div className="p-6 bg-slate-900 rounded-[35px] flex items-center gap-4 shadow-xl">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-[11px] text-white font-black uppercase tracking-widest">Documento Listo</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[200px]">Visado: {datos_finales?.abogado_nombre}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        <button
                            onClick={ejecutar_exportacion_async}
                            disabled={exportando_pdf}
                            className="w-full bg-blue-600 text-white font-black py-6 rounded-[35px] flex items-center justify-center gap-4 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/40 uppercase text-[10px] tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {exportando_pdf ? (
                                <><Loader2 className="animate-spin" size={20} /> Formateando en Segundo Plano...</>
                            ) : (
                                <><Download size={20} /> Exportar {tab_activa.toUpperCase()} (.pdf)</>
                            )}
                        </button>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <button className="bg-white text-slate-900 border-2 border-slate-100 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all uppercase text-[9px] tracking-widest">
                                <Printer size={16} /> Imprimir copia
                            </button>
                            <button onClick={on_cerrar} className="bg-red-50 text-red-500 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-all uppercase text-[9px] tracking-widest">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneradorContrato;


