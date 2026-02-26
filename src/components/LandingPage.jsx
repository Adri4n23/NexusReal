import React, { useState } from 'react';
import { Building2, ArrowRight, PieChart, FileDown, Cloud, Phone, ShieldCheck, TrendingUp, MapPin } from 'lucide-react';

const Navbar = ({ onAccederClick }) => (
  <nav className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
    <div className="container mx-auto px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.2)]">
          <Building2 className="text-white" size={20} />
        </div>
        <span className="text-2xl font-serif tracking-[0.1em] uppercase text-slate-900 font-bold">Nexus<span className="text-blue-600">Real</span></span>
      </div>
      <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        <a href="#funciones" className="hover:text-blue-600 transition-colors">Funciones</a>
        <a href="#precios" className="hover:text-blue-600 transition-colors">Precios</a>
        <a href="#soporte" className="hover:text-blue-600 transition-colors">Soporte</a>
      </div>
      <div className="flex items-center gap-4">
        {/* Eliminado botón pequeño de la esquina para priorizar el Hero */}
      </div>
    </div>
  </nav>
);

export default function LandingPage({ onAccederClick }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar onAccederClick={onAccederClick} />

      {/* --- HERO SECTION PARA SOFTWARE ADMINISTRATIVO --- */}
      <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden bg-slate-50 pt-20">

        {/* Fondo Decorativo con Grid de Ingeniería */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#00429d 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

          {/* Badge de Estatus */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Sistema Operativo V1.0 Activo</span>
          </div>

          {/* Título B2B: Directo al Jefe de Agencia */}
          <h1 className="text-6xl md:text-7xl font-serif text-slate-900 mb-6 leading-tight">
            Control Total de tu <br />
            <span className="text-blue-600 italic">Oficina Inmobiliaria</span>
          </h1>

          {/* Subtítulo Funcional */}
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium">
            Automatiza la regla 30/70, gestiona el pool de agentes y genera fichas técnicas de lujo.
            Nexus es la infraestructura digital diseñada para el alto rendimiento.
          </p>

          {/* Botones de Acción: Acceso Profesional */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onAccederClick}
              className="group relative px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              <span className="relative z-10 flex items-center gap-2">
                Acceder al Panel <ArrowRight size={18} />
              </span>
            </button>

            <button
              onClick={onAccederClick}
              className="px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-xl shadow-slate-200/50"
            >
              Registrar mi Agencia
            </button>
          </div>

          {/* Quick Stats: Para dar confianza de Software */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-slate-100 pt-10">
            <div>
              <p className="text-2xl font-bold text-slate-900">30/70</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contabilidad</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">PDF</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fichas de Lujo</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">BCV</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasa Automática</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">CRM</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prospectos</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN FUNCIONALIDADES CORE --- */}
      <section id="funciones" className="container mx-auto px-6 py-32">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-4">Arquitectura de Alto Nivel</h2>
          <p className="text-4xl font-serif text-slate-900 leading-tight">Diseñado para resolver los cuellos de <br /> botella de tu negocio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Comisiones */}
          <div className="group p-10 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-blue-200 hover:shadow-blue-900/5 transition-all">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 border border-blue-100 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-500">
              <PieChart className="text-blue-600 group-hover:text-white" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Gestión de Comisiones 30/70</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Automatiza la distribución de ingresos entre la agencia y tus agentes sin errores manuales.
              Control total de la rentabilidad de cada oficina.
            </p>
          </div>

          {/* Card 2: PDF */}
          <div className="group p-10 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-blue-200 hover:shadow-blue-900/5 transition-all">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 border border-blue-100 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-500">
              <FileDown className="text-blue-600 group-hover:text-white" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Generador de Fichas PDF</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Crea catálogos de lujo personalizados con un solo clic, con la marca de tu agencia,
              listos para enviar a tus clientes por WhatsApp instantáneamente.
            </p>
          </div>

          {/* Card 3: BCV & CRM */}
          <div className="group p-10 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-blue-200 hover:shadow-blue-900/5 transition-all">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 border border-blue-100 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-500">
              <Cloud className="text-blue-600 group-hover:text-white" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Tasa BCV & CRM Inteligente</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Sincronización diaria con la tasa oficial y control total de prospectos para que no
              se escape ninguna venta. Datos centralizados en la nube.
            </p>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN PRECIOS (PLACEHOLDER) --- */}
      <section id="precios" className="bg-slate-900 py-32 px-6 overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-white text-4xl font-serif mb-6">Planes diseñados para crecer</h2>
          <p className="text-slate-400 mb-12 max-w-xl mx-auto font-medium">Desde agentes independientes hasta grandes redes inmobiliarias. Encuentra el plan que se adapta a tu volumen de ventas.</p>
          <button onClick={onAccederClick} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20">Ver Tabla de Precios</button>
        </div>
      </section>

      <footer id="soporte" className="border-t border-slate-100 bg-white py-24 px-6">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="text-white" size={20} />
              </div>
              <span className="text-2xl font-serif tracking-widest text-slate-900 font-bold uppercase">NexusReal</span>
            </div>
            <p className="text-slate-500 max-w-sm font-medium italic leading-relaxed">
              NexusReal: La infraestructura operativa para las inmobiliarias más exitosas de Venezuela.
              Tecnología diseñada para escalar tu oficina al siguiente nivel.
            </p>
          </div>
          <div>
            <h4 className="text-slate-800 font-black mb-6 uppercase tracking-widest text-[10px]">Contacto</h4>
            <ul className="space-y-4 text-slate-500 text-sm font-medium">
              <li className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer"><Phone size={14} /> +58 212 000 0000</li>
              <li className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer"><MapPin size={14} /> Las Mercedes, Caracas</li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-800 font-black mb-6 uppercase tracking-widest text-[10px]">Certificaciones</h4>
            <div className="flex flex-wrap gap-4">
              <ShieldCheck className="text-blue-600/20" size={32} />
              <TrendingUp className="text-blue-600/20" size={32} />
            </div>
          </div>
        </div>
        <div className="container mx-auto mt-20 pt-8 border-t border-slate-50 text-center text-slate-300 text-[9px] font-black uppercase tracking-[0.4em]">
          © 2024 Nexus Real Estate - Blue Division. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
