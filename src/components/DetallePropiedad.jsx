import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { propiedadesService } from '../propiedadesService';
import { MessageCircle, MapPin, User, Home, Map, Share2, AlertCircle, Loader2, Tag, CalendarDays, Bed, Bath, Ruler, ArrowLeft, ArrowRight, DollarSign, FileText, Users, Send, Info } from 'lucide-react';

function DetallePropiedad({ onNotificar }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [propiedad, setPropiedad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tasaBCV, setTasaBCV] = useState(null);
  
  // Estados para CRM
  const [prospectos, setProspectos] = useState([]);
  const [nuevoProspecto, setNuevoProspecto] = useState({ nombre: '', telefono: '', notas: '' });
  const [mostrandoCRM, setMostrandoCRM] = useState(false);

  useEffect(() => {
    fetchPropiedad();
    fetchTasaBCV();
  }, [id, onNotificar]);

  useEffect(() => {
    if (propiedad) {
      fetchProspectos();
    }
  }, [propiedad]);

  async function fetchProspectos() {
    try {
      const data = await propiedadesService.obtenerProspectos(id);
      setProspectos(data || []);
    } catch (error) {
      console.error("Error cargando prospectos:", error);
    }
  }

  async function handleGuardarProspecto(e) {
    e.preventDefault();
    try {
      if (!nuevoProspecto.nombre || !nuevoProspecto.telefono) {
        onNotificar("Nombre y teléfono son obligatorios", "error");
        return;
      }
      
      await propiedadesService.agregarProspecto({
        ...nuevoProspecto,
        propiedad_id: id,
        estado: 'nuevo'
      });
      
      onNotificar("Prospecto registrado con éxito", "success");
      setNuevoProspecto({ nombre: '', telefono: '', notas: '' });
      fetchProspectos();
    } catch (error) {
      onNotificar("Error al guardar prospecto", "error");
    }
  }

  async function fetchTasaBCV() {
    try {
      const tasa = await propiedadesService.obtenerTasaBCV();
      setTasaBCV(tasa);
    } catch (error) {
      console.error("Error al obtener la tasa del BCV en DetallePropiedad:", error);
      onNotificar("Error al obtener la tasa del BCV.", "error");
    }
  }

  async function fetchPropiedad() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('propiedades')
        .select('*') 
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      if (!data) {
        setError("Propiedad no encontrada.");
      }
      setPropiedad(data);
    } catch (err) {
      console.error("Error al cargar la propiedad:", err);
      setError(err.message);
      onNotificar("Error al cargar la propiedad: " + err.message, 'error');


    } finally {
      setLoading(false);
    }
  }

  const nextImage = () => {
    if (propiedad && propiedad.galeria && propiedad.galeria.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % propiedad.galeria.length);
    }
  };

  const prevImage = () => {
    if (propiedad && propiedad.galeria && propiedad.galeria.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + propiedad.galeria.length) % propiedad.galeria.length);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <p className="ml-3 text-slate-700">Cargando propiedad...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <p className="text-slate-700 text-lg text-center">{error}</p>
        <button onClick={() => navigate('/')} className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
          Volver al inicio
        </button>
      </div>
    );
  }

  if (!propiedad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <Info className="text-blue-500 mb-4" size={48} />
        <p className="text-slate-700 text-lg text-center">Propiedad no encontrada.</p>
        <button onClick={() => navigate('/')} className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
          Volver al inicio
        </button>
      </div>
    );
  }

  // Lógica para compartir y WhatsApp (similar a CardPropiedad)
  const mensajeWA = `Hola, solicito información de: ${propiedad.titulo} (${propiedad.zona})`;
  const urlWA = `https://wa.me/${propiedad.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(mensajeWA)}`;

  const compartirFicha = () => {
    const texto = `🏡 *NUEVO INGRESO - NEXUSREAL*\n\n` +
                  `✨ *${propiedad.titulo}*\n` +
                  `📍 Zona: ${propiedad.zona}\n` +
                  `💰 Precio: $${Number(propiedad.precio).toLocaleString()}\n` +
                  `📐 Metraje: ${propiedad.metraje || '?'} m²\n` +
                  `🛏 Habitaciones: ${propiedad.habitaciones}\n` +
                  `🚿 Baños: ${propiedad.banos}\n\n` +
                  `ℹ *Más detalles y fotos aquí:* 👇\n` +
                  `${window.location.origin}/propiedad/${propiedad.id}`; 
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const generarPDF = async () => {
    try {
      onNotificar("Generando ficha técnica...", "info");
      
      const element = document.getElementById('propiedad-detalle');
      
      // Usamos las librerías cargadas por CDN (window.html2canvas y window.jspdf)
      const canvas = await window.html2canvas(element, {
        scale: 2, // Mayor resolución
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      doc.save(`Ficha-NexusReal-${propiedad.titulo.replace(/\s+/g, '-')}.pdf`);
      
      onNotificar("Ficha descargada con éxito", "success");
    } catch (error) {
      console.error("Error PDF:", error);
      onNotificar("Error al generar el PDF. Verifica la conexión.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" id="propiedad-detalle">
      <div className="max-w-4xl mx-auto bg-white rounded-[30px] shadow-xl overflow-hidden border border-slate-100">
        <div className="relative h-64 md:h-96 bg-slate-200 group">
          {/* Carrusel de imágenes */}
          {propiedad.galeria && propiedad.galeria.length > 0 ? (
            <img 
              src={propiedad.galeria[currentImageIndex]}
              alt={propiedad.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <img src={propiedad.imagen_url || 'https://via.placeholder.com/600x400'} alt={propiedad.titulo} className="w-full h-full object-cover" />
          )}
          
          {propiedad.galeria && propiedad.galeria.length > 1 && (
            <>
              <button 
                onClick={prevImage} 
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
              >
                <ArrowLeft size={20} />
              </button>
              <button 
                onClick={nextImage} 
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
              >
                <ArrowRight size={20} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {propiedad.galeria.map((_, index) => (
                  <span 
                    key={index} 
                    className={`block w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                  ></span>
                ))}
              </div>
            </>
          )}
          
          <button onClick={() => navigate('/')} className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors flex items-center gap-1">
            <ArrowLeft size={20} /> <span className="hidden md:inline">Volver</span>
          </button>
        </div>

        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-black text-slate-800 mb-2">{propiedad.titulo}</h1>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="flex items-center text-3xl md:text-4xl font-black text-[#0056b3]">
              <DollarSign size={28} className="mr-1" /> {Number(propiedad.precio).toLocaleString()}
            </span>
            <span className="text-sm text-slate-400">
              {propiedad.tipo_operacion === 'Alquiler' ? '/mes' : ''} ({propiedad.tipo_operacion})
            </span>
            {tasaBCV && (
              <span className="text-lg text-slate-500 ml-4">~ Bs. {(Number(propiedad.precio) * tasaBCV).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            )}
          </div>

          <div className="flex items-center text-slate-500 mb-4 gap-2">
            <MapPin size={16} />
            <span>{propiedad.zona}</span>
          </div>

          <p className="text-slate-700 mb-6 leading-relaxed">{propiedad.descripcion}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {propiedad.tipo_inmueble !== 'Terreno' && (
              <div className="flex items-center gap-2 text-slate-700">
                <Home size={18} /> {propiedad.tipo_inmueble}
              </div>
            )}
            {propiedad.tipo_inmueble !== 'Terreno' && (
              <div className="flex items-center gap-2 text-slate-700">
                <Bed size={18} /> {propiedad.habitaciones || '?'} Habs
              </div>
            )}
            {propiedad.tipo_inmueble !== 'Terreno' && (
              <div className="flex items-center gap-2 text-slate-700">
                <Bath size={18} /> {propiedad.banos || '?'} Baños
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-700">
              <Ruler size={18} /> {propiedad.metraje || '?'} m²
            </div>
            {propiedad.comision && (
              <div className="flex items-center gap-2 text-slate-700">
                <Tag size={18} /> {propiedad.comision}% Comisión
              </div>
            )}
            {propiedad.agente_nombre && (
              <div className="flex items-center gap-2 text-slate-700">
                <User size={18} /> {propiedad.agente_nombre}
              </div>
            )}
            {propiedad.created_at && (
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarDays size={18} /> Publicado: {new Date(propiedad.created_at).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-100 mt-6">
            <button 
              onClick={compartirFicha}
              className="flex-1 bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100"
            >
              <MessageCircle size={20} /> Compartir WhatsApp
            </button>
            <button 
              onClick={generarPDF}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
            >
              <FileText size={20} /> Generar PDF
            </button>
            <button 
              onClick={() => setMostrandoCRM(!mostrandoCRM)}
              className="flex-1 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
            >
              <Users size={20} /> {mostrandoCRM ? 'Ocultar CRM' : 'Ver Prospectos'}
            </button>
          </div>

          {/* Sección CRM */}
          {mostrandoCRM && (
            <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <Users className="text-blue-600" /> Control de Prospectos
              </h3>
              
              {/* Formulario Nuevo Prospecto */}
              <form onSubmit={handleGuardarProspecto} className="bg-slate-50 p-4 rounded-2xl mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input 
                    type="text" 
                    placeholder="Nombre del cliente"
                    className="bg-white border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    value={nuevoProspecto.nombre}
                    onChange={(e) => setNuevoProspecto({...nuevoProspecto, nombre: e.target.value})}
                  />
                  <input 
                    type="text" 
                    placeholder="Teléfono"
                    className="bg-white border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    value={nuevoProspecto.telefono}
                    onChange={(e) => setNuevoProspecto({...nuevoProspecto, telefono: e.target.value})}
                  />
                </div>
                <textarea 
                  placeholder="Notas (ej: Le gustó la cocina, viene el martes...)"
                  className="w-full bg-white border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm mb-4 h-20"
                  value={nuevoProspecto.notas}
                  onChange={(e) => setNuevoProspecto({...nuevoProspecto, notas: e.target.value})}
                />
                <button 
                  type="submit"
                  className="w-full bg-[#0056b3] text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Registrar Interesado
                </button>
              </form>

              {/* Lista de Prospectos */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {prospectos.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto text-slate-200 mb-2" size={48} />
                    <p className="text-slate-400 text-sm italic">No hay prospectos registrados aún.</p>
                  </div>
                ) : (
                  prospectos.map((p) => (
                    <div key={p.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-slate-800">{p.nombre}</h4>
                          <p className="text-xs text-blue-600 font-medium">{p.telefono}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-full uppercase">
                          {new Date(p.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {p.notas && <p className="text-sm text-slate-600 italic border-l-2 border-slate-200 pl-3">{p.notas}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {propiedad.mapa_url && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Ubicación en el Mapa</h3>
              <div className="aspect-video rounded-xl overflow-hidden shadow-md border border-slate-200">
                <iframe
                  src={propiedad.mapa_url}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetallePropiedad;