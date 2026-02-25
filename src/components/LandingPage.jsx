import React, { useState } from 'react';
import { Home, Search, MapPin, Building2, ChevronRight, Phone, ShieldCheck, TrendingUp } from 'lucide-react';
import CardPropiedad from './CardPropiedad.jsx';

const Navbar = ({ onAccederClick }) => (
  <nav className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
    <div className="container mx-auto px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.2)]">
          <Building2 className="text-white" />
        </div>
        <span className="text-2xl font-serif tracking-[0.2em] uppercase text-slate-800">Nexus</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        <a href="#" className="hover:text-blue-600 transition-colors">Inicio</a>
        <a href="#" className="hover:text-blue-600 transition-colors">Propiedades</a>
        <a href="#" className="hover:text-blue-600 transition-colors">Servicios</a>
        <a href="#" className="hover:text-blue-600 transition-colors">Contacto</a>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onAccederClick} className="bg-slate-100 text-slate-700 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-slate-200">
          Acceder
        </button>
      </div>
    </div>
  </nav>
);

export default function LandingPage({ onAccederClick }) {
  const [tasaBCV] = useState(36.50);
  const [busqueda, setBusqueda] = useState("");

  const propiedades = [
    { id: 1, titulo: "Penthouse Sky View", zona: "Altamira, Caracas", precio: 850000, habitaciones: 4, banos: 5, metraje: 420, tipo_operacion: "Venta", imagen_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800" },
    { id: 2, titulo: "Villa Moderna Los Canales", zona: "Lechería, Anzoátegui", precio: 1200000, habitaciones: 6, banos: 7, metraje: 850, tipo_operacion: "Lujo", imagen_url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800" },
    { id: 3, titulo: "Apartamento Minimalista", zona: "Tucacas, Falcón", precio: 180000, habitaciones: 2, banos: 2, metraje: 110, tipo_operacion: "Playa", imagen_url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=800" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar onAccederClick={onAccederClick} />

      <section className="relative pt-40 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] bg-blue-600/5 blur-[120px] rounded-full -z-10" />
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight text-slate-900">
            Encuentra la Residencia de <span className="text-blue-600 italic">Tus Sueños</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl mb-12 font-medium max-w-2xl mx-auto">
            Curaduría exclusiva de propiedades de alto nivel en las zonas más privilegiadas de Venezuela.
          </p>
          <div className="relative max-w-3xl mx-auto p-2 bg-white shadow-2xl shadow-blue-900/10 border border-slate-100 rounded-[32px] flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 gap-3 border-b md:border-b-0 md:border-r border-slate-50 py-3 md:py-0">
              <Search className="text-blue-600" size={20} />
              <input
                type="text"
                placeholder="¿Dónde deseas vivir?"
                className="bg-transparent border-none outline-none w-full text-slate-800 placeholder:text-slate-300 font-medium"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex-1 flex items-center px-4 gap-3 py-3 md:py-0">
              <Home className="text-blue-600" size={20} />
              <select className="bg-transparent border-none outline-none w-full text-slate-800 cursor-pointer appearance-none font-medium">
                <option>Tipo de Propiedad</option>
                <option>Apartamento</option>
                <option>Casa / Villa</option>
              </select>
            </div>
            <button className="bg-blue-600 text-white font-bold px-10 py-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20 uppercase text-xs tracking-widest">
              Buscar Ahora
            </button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-serif mb-2 text-slate-800">Propiedades Destacadas</h2>
            <div className="h-1.5 w-16 bg-blue-600 rounded-full" />
          </div>
          <button className="text-blue-600 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
            Ver todas <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {propiedades.map(prop => (
            <CardPropiedad key={prop.id} propiedad={prop} tasaBCV={tasaBCV} />
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white py-20 px-6">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Building2 className="text-white" size={18} />
              </div>
              <span className="text-2xl font-serif uppercase tracking-widest text-slate-800">Nexus</span>
            </div>
            <p className="text-slate-500 max-w-sm font-medium italic">
              Liderando el mercado inmobiliario de lujo en Venezuela con transparencia,
              tecnología avanzada y un servicio personalizado de clase mundial.
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
