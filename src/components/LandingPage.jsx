import React, { useState } from 'react';
import { Home, Search, MapPin, Building2, ChevronRight, Phone, ShieldCheck, TrendingUp } from 'lucide-react';
import CardPropiedad from './CardPropiedad.jsx';

const Navbar = ({ onAccederClick }) => (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-amber-500 flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                    <Building2 className="text-black" />
                </div>
                <span className="text-2xl font-serif tracking-[0.2em] uppercase text-white">Nexus</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.2em] font-medium text-gray-400">
                <a href="#" className="hover:text-amber-500 transition-colors">Inicio</a>
                <a href="#" className="hover:text-amber-500 transition-colors">Propiedades</a>
                <a href="#" className="hover:text-amber-500 transition-colors">Servicios</a>
                <a href="#" className="hover:text-amber-500 transition-colors">Contacto</a>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={onAccederClick} className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-amber-500 transition-all">
                    Acceder
                </button>
            </div>
        </div>
    </nav>
);

export default function LandingPage({ onAccederClick }) {
  const [tasaBCV] = useState(36.50); // Example rate
  const [busqueda, setBusqueda] = useState("");
  
  const propiedades = [
    { id: 1, titulo: "Penthouse Sky View", zona: "Altamira, Caracas", precio: 850000, habitaciones: 4, banos: 5, metraje: 420, tipo_operacion: "Venta", imagen_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800" },
    { id: 2, titulo: "Villa Moderna Los Canales", zona: "Lechería, Anzoátegui", precio: 1200000, habitaciones: 6, banos: 7, metraje: 850, tipo_operacion: "Lujo", imagen_url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800" },
    { id: 3, titulo: "Apartamento Minimalista", zona: "Tucacas, Falcón", precio: 180000, habitaciones: 2, banos: 2, metraje: 110, tipo_operacion: "Playa", imagen_url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=800" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500 selection:text-black">
      <Navbar onAccederClick={onAccederClick} />
      
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] bg-amber-500/5 blur-[120px] rounded-full -z-10" />
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">
            Encuentra la Residencia de <span className="text-amber-500 italic">Tus Sueños</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-12 font-light max-w-2xl mx-auto">
            Curaduría exclusiva de propiedades de alto nivel en las zonas más privilegiadas de Venezuela.
          </p>
          <div className="relative max-w-3xl mx-auto p-2 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-2xl flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 gap-3 border-b md:border-b-0 md:border-r border-white/5 py-3 md:py-0">
              <Search className="text-amber-500" size={20} />
              <input 
                type="text" 
                placeholder="¿Dónde deseas vivir?"
                className="bg-transparent border-none outline-none w-full text-white placeholder:text-gray-600"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex-1 flex items-center px-4 gap-3 py-3 md:py-0">
              <Home className="text-amber-500" size={20} />
              <select className="bg-transparent border-none outline-none w-full text-white cursor-pointer appearance-none">
                <option className="bg-black">Tipo de Propiedad</option>
                <option className="bg-black">Apartamento</option>
                <option className="bg-black">Casa / Villa</option>
              </select>
            </div>
            <button className="bg-amber-500 text-black font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform active:scale-95">
              Buscar Ahora
            </button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-serif mb-2">Propiedades Destacadas</h2>
            <div className="h-1 w-20 bg-amber-500" />
          </div>
          <button className="text-amber-500 text-sm font-bold uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
            Ver todas <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {propiedades.map(prop => (
            <CardPropiedad key={prop.id} propiedad={prop} tasa={tasaBCV} />
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 bg-black py-20 px-6">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="text-amber-500" />
              <span className="text-2xl font-serif uppercase tracking-widest">Nexus</span>
            </div>
            <p className="text-gray-500 max-w-sm font-light">
              Liderando el mercado inmobiliario de lujo en Venezuela con transparencia, 
              tecnología avanzada y un servicio personalizado de clase mundial.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Contacto</h4>
            <ul className="space-y-4 text-gray-500 text-sm">
              <li className="flex items-center gap-2"><Phone size={14} /> +58 212 000 0000</li>
              <li className="flex items-center gap-2"><MapPin size={14} /> Las Mercedes, Caracas</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Certificaciones</h4>
            <div className="flex flex-wrap gap-4">
               <ShieldCheck className="text-amber-500/50" size={32} />
               <TrendingUp className="text-amber-500/50" size={32} />
            </div>
          </div>
        </div>
        <div className="container mx-auto mt-20 pt-8 border-t border-white/5 text-center text-gray-600 text-[10px] uppercase tracking-[0.3em]">
          © 2024 Nexus Real Estate - Luxury Division. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
