import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { propiedadesService } from '../propiedadesService';
import BlurUpImage from './BlurUpImage';
import { MessageCircle, MapPin, User, Home, Map, Share2, AlertCircle, Loader2, Tag, CalendarDays, Bed, Bath, Ruler, ArrowLeft, ArrowRight, DollarSign, FileText, Users, Send, Info, Building2, CheckCircle, X } from 'lucide-react';

function DetallePropiedad({ session, onNotificar, tasaBCV }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [propiedad, setPropiedad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const usuario = session?.user;

  const [agentesDisponibles, setAgentesDisponibles] = useState([]);
  const [datosCierre, setDatosCierre] = useState({
    precio_cierre: '',
    nota_cierre: '',
    agentes_comision: []
  });

  const [prospectos, setProspectos] = useState([]);
  const [nuevoProspecto, setNuevoProspecto] = useState({ nombre: '', telefono: '', notas: '' });

  // Cálculos Automáticos Regla 30/70
  const comisionTotalCalculada = (Number(datosCierre.precio_cierre || 0) * 0.05).toFixed(2);
  const tajoCasa30 = (Number(comisionTotalCalculada) * 0.30).toFixed(2);
  const poolAgentes70 = (Number(comisionTotalCalculada) * 0.70).toFixed(2);
  const totalPorcentajeAgentes = datosCierre.agentes_comision.reduce((sum, a) => sum + Number(a.comision_porcentaje || 0), 0);

  useEffect(() => {
    fetchPropiedad();
  }, [id]);

  useEffect(() => {
    const cargarAgentes = async () => {
      if (usuario?.user_metadata?.organizacion_id) {
        const agents = await propiedadesService.obtenerAgentesPorOrganizacion(usuario.user_metadata.organizacion_id);
        setAgentesDisponibles(agents);
      }
    };
    if (mostrarModalCierre) cargarAgentes();
  }, [mostrarModalCierre, usuario]);

  async function fetchPropiedad() {
    try {
      setLoading(true);
      const data = await propiedadesService.obtenerPorId(id);
      setPropiedad(data);
      if (data) {
        setDatosCierre(prev => ({ ...prev, precio_cierre: data.precio }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }



  const esPropiedadMia = propiedad?.agente_id === usuario?.id;
  const esDeMiAgencia = propiedad?.organizacion_id === usuario?.user_metadata?.organizacion_id;
  const esAdmin = usuario?.user_metadata?.rol === 'admin';
  const puedeVerCRM = esPropiedadMia || (esDeMiAgencia && esAdmin && propiedad?.organizacion_id !== null);

  useEffect(() => {
    if (propiedad && puedeVerCRM) {
      fetchProspectos();
    }
  }, [propiedad, puedeVerCRM]);

  async function fetchProspectos() {
    try {
      const data = await propiedadesService.obtenerProspectos(id, usuario);
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
        estado: 'nuevo',
        agente_id: usuario.id
      }, usuario);

      onNotificar("Prospecto registrado con éxito", "success");
      setNuevoProspecto({ nombre: '', telefono: '', notas: '' });
      fetchProspectos();
    } catch (error) {
      onNotificar("Error al guardar prospecto", "error");
    }
  }

  const handleCerrarVenta = async (e) => {
    e.preventDefault();
    if (totalPorcentajeAgentes !== 100) {
      onNotificar && onNotificar("El reparto entre agentes debe sumar 100%", "error");
      return;
    }
    try {
      await propiedadesService.cerrarVenta(id, {
        precio_cierre: datosCierre.precio_cierre,
        agentes_comision: datosCierre.agentes_comision,
        nota_cierre: datosCierre.nota_cierre,
        titulo_propiedad: propiedad.titulo,
        zona_propiedad: propiedad.zona
      }, usuario);
      onNotificar && onNotificar("¡Venta cerrada con éxito!", "success");
      setMostrarModalCierre(false);
      setPropiedad({ ...propiedad, estado: 'vendido' });
    } catch (err) {
      onNotificar && onNotificar("Error al cerrar venta: " + err.message, "error");
    }
  };

  const compartirFicha = () => {
    const texto = `🏡 *Oportunidad Inmobiliaria*\n\n` +
      `✨ *${propiedad.titulo}*\n` +
      `📍 Zona: ${propiedad.zona}\n` +
      `💰 Precio: $${Number(propiedad.precio).toLocaleString()}\n` +
      `📐 Metraje: ${propiedad.metraje || '?'} m²\n\n` +
      `ℹ *Ver fotos y detalles:* 👇\n` +
      `${window.location.origin}/propiedad/${propiedad.id}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const generarPDF = async () => {
    try {
      onNotificar?.("Preparando Ficha Técnica de Lujo...", "success");

      const loadImage = (url) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = reject;
        });
      };

      const imageUrl = (propiedad.galeria && propiedad.galeria.length > 0) ? propiedad.galeria[0] : propiedad.imagen_url;
      let imgData = null;

      try {
        const img = await loadImage(imageUrl + '?w=800&q=50');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 300;

        ctx.filter = 'blur(15px) brightness(0.6)';
        ctx.drawImage(img, 0, -100, 800, 500);

        // Overlay Azul Nexus para contraste
        ctx.fillStyle = 'rgba(0, 66, 157, 0.5)';
        ctx.fillRect(0, 0, 800, 300);

        imgData = canvas.toDataURL('image/jpeg', 0.8);
      } catch (e) {
        console.warn("No se pudo cargar la imagen para el PDF, usando fondo sólido.");
      }

      const doc = new window.jspdf.jsPDF();

      // BANNER SUPERIOR CON IMAGEN DIFUMINADA
      if (imgData) {
        doc.addImage(imgData, 'JPEG', 0, 0, 210, 60);
      } else {
        doc.setFillColor(0, 66, 157); // Fallback solid blue
        doc.rect(0, 0, 210, 60, 'F');
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont("helvetica", "bold");
      doc.text("NEXUSREAL", 20, 35);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("DIVISIÓN INMOBILIARIA DE LUJO", 20, 45);

      // CUERPO - TÍTULO Y PRECIO
      doc.setTextColor(30, 41, 59); // slate-800
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(propiedad.titulo.toUpperCase(), 20, 85);

      doc.setTextColor(0, 66, 157);
      doc.setFontSize(28);
      doc.text(`$${Number(propiedad.precio).toLocaleString()}`, 20, 105);

      if (tasaBCV) {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Tasa BCV: Bs. ${(Number(propiedad.precio) * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, 20, 115);
      }

      let currentY = 125;
      doc.setDrawColor(240, 240, 240);
      doc.line(20, currentY, 190, currentY);
      currentY += 15;

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("ESPECIFICACIONES DEL INMUEBLE", 20, currentY);
      currentY += 10;

      doc.setFont("helvetica", "normal");
      const specs = [
        `Ubicación: ${propiedad.zona}`,
        `Tipo: ${propiedad.tipo_inmueble}`,
        `Operación: ${propiedad.tipo_operacion}`,
        `Habitaciones: ${propiedad.habitaciones}`,
        `Baños: ${propiedad.banos}`,
        `Metraje: ${propiedad.metraje} m²`
      ];

      specs.forEach(spec => {
        doc.text(`• ${spec}`, 25, currentY);
        currentY += 8;
      });

      currentY += 10;
      doc.setFont("helvetica", "bold");
      doc.text("DESCRIPCIÓN DETALLADA", 20, currentY);
      currentY += 10;

      doc.setFont("helvetica", "normal");
      const splitDesc = doc.splitTextToSize(propiedad.descripcion || "Sin descripción adicional disponible.", 160);
      doc.text(splitDesc, 20, currentY);

      // FOOTER CONTACTO AGENTE
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 260, 210, 37, 'F');

      doc.setTextColor(0, 66, 157);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(propiedad.agente_nombre?.toUpperCase() || "AGENTE NEXUS", 20, 275);

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Agencia: ${propiedad.organizacion_nombre || "Nexus Real Estate"}`, 20, 282);
      doc.text(`WhatsApp: ${propiedad.whatsapp}`, 20, 288);

      doc.save(`Nexus_Ficha_${propiedad.titulo.replace(/\s+/g, '_')}.pdf`);
      onNotificar?.("¡Ficha de Lujo generada!", "success");
    } catch (e) {
      console.error(e);
      onNotificar?.("Error al generar PDF con imagen", "error");
    }
  };

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

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  if (error || !propiedad) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800"><AlertCircle className="text-red-500 mb-4" size={48} /><p>{error || 'Propiedad no encontrada'}</p><button onClick={() => navigate('/')} className="mt-4 text-blue-600 font-bold underline">Volver al inicio</button></div>;

  const mensajeWA = `Hola, solicito información de: ${propiedad.titulo} (${propiedad.zona})`;
  const urlWA = `https://wa.me/${propiedad.whatsapp?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(mensajeWA)}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 p-4 md:p-8 pt-24" id="propiedad-detalle">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 font-black text-xs uppercase tracking-[0.2em] transition-all">
          <ArrowLeft size={16} />
          Volver al Catálogo
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="relative h-[500px] bg-slate-200 rounded-[40px] overflow-hidden shadow-2xl shadow-blue-900/10 group">
              <BlurUpImage
                src={(propiedad.galeria && propiedad.galeria.length > 0) ? propiedad.galeria[currentImageIndex] : (propiedad.imagen_url || 'https://via.placeholder.com/800x600')}
                alt={propiedad.titulo}
                className="w-full h-full transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              {propiedad.galeria && propiedad.galeria.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full text-slate-800 hover:bg-blue-600 hover:text-white backdrop-blur-sm z-10 transition-all"><ArrowLeft size={24} /></button>
                  <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full text-slate-800 hover:bg-blue-600 hover:text-white backdrop-blur-sm z-10 transition-all"><ArrowRight size={24} /></button>
                  <div className="absolute bottom-6 right-6 bg-black/60 text-white text-[10px] px-4 py-2 rounded-full font-black uppercase tracking-widest">{currentImageIndex + 1} / {propiedad.galeria.length}</div>
                </>
              )}
            </div>

            <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-blue-900/5">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-600/20">{propiedad.tipo_operacion}</span>
                <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                  <MapPin size={16} className="text-blue-600" />
                  <span>{propiedad.zona}</span>
                </div>
              </div>
              <h1 className="text-5xl font-serif text-slate-900 mb-6 leading-tight">{propiedad.titulo}</h1>
              <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed italic">
                <p>{propiedad.descripcion || 'Sin descripción disponible.'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-xl shadow-blue-900/5">
              <div className="border-b border-slate-50 pb-6 mb-6">
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-1">Precio de Venta</p>
                <p className="text-5xl font-bold text-slate-900 tracking-tight">${Number(propiedad.precio).toLocaleString()}</p>
                {tasaBCV && <p className="text-blue-600 font-mono font-bold mt-2">Bs. {(Number(propiedad.precio) * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>}
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center">
                  <Bed size={24} className="text-slate-200 mb-1" />
                  <span className="text-xs font-black text-slate-500 uppercase">{propiedad.habitaciones} Hab</span>
                </div>
                <div className="flex flex-col items-center">
                  <Bath size={24} className="text-slate-200 mb-1" />
                  <span className="text-xs font-black text-slate-500 uppercase">{propiedad.banos} Baños</span>
                </div>
                <div className="flex flex-col items-center">
                  <Ruler size={24} className="text-slate-200 mb-1" />
                  <span className="text-xs font-black text-slate-500 uppercase">{propiedad.metraje} m²</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-xl shadow-blue-900/5">
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4">Agente Encargado</p>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                  <User size={28} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg leading-tight">{propiedad.agente_nombre || 'Agente Nexus'}</p>
                  <p className="text-xs text-blue-600 font-black uppercase tracking-tight">{propiedad.organizacion_nombre || 'Red Inmobiliaria'}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <a href={urlWA} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-[20px] hover:bg-blue-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/30">
                  <MessageCircle size={18} /> Solicitar Info
                </a>
                {propiedad.estado !== 'vendido' && esPropiedadMia && (
                  <button
                    onClick={() => setMostrarModalCierre(true)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-[20px] hover:bg-black transition-all font-black text-[10px] uppercase tracking-widest shadow-xl"
                  >
                    <CheckCircle size={18} /> Cerrar Venta
                  </button>
                )}
                <button onClick={generarPDF} className="w-full flex items-center justify-center gap-2 py-4 bg-white text-blue-600 rounded-[20px] hover:bg-blue-50 transition-all font-black text-[10px] uppercase tracking-widest border-2 border-blue-600 shadow-xl shadow-blue-600/5">
                  <FileText size={18} /> Descargar Ficha PDF
                </button>
                <button onClick={compartirFicha} className="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-600 rounded-[20px] hover:bg-slate-200 transition-all font-black text-[10px] uppercase tracking-widest border border-slate-200">
                  <Share2 size={18} /> Compartir
                </button>
              </div>
            </div>

            {puedeVerCRM && (
              <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-xl shadow-blue-900/5">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 mb-6 flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  Prospectos
                </h3>
                <form onSubmit={handleGuardarProspecto} className="space-y-3 mb-6">
                  <input type="text" placeholder="Nombre" value={nuevoProspecto.nombre} onChange={(e) => setNuevoProspecto({ ...nuevoProspecto, nombre: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all text-sm" />
                  <input type="tel" placeholder="Teléfono" value={nuevoProspecto.telefono} onChange={(e) => setNuevoProspecto({ ...nuevoProspecto, telefono: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all text-sm" />
                  <textarea placeholder="Notas..." value={nuevoProspecto.notas} onChange={(e) => setNuevoProspecto({ ...nuevoProspecto, notas: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all text-sm" rows="2"></textarea>
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/20">Registrar</button>
                </form>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {prospectos.map(p => (
                    <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="font-bold text-slate-800 text-sm">{p.nombre}</p>
                      <p className="text-xs text-blue-600 font-bold">{p.telefono}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {mostrarModalCierre && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="bg-gradient-to-br from-blue-700 to-blue-600 p-8 text-center text-white">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                <DollarSign size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tight">Finalizar Negocio</h3>
              <p className="text-blue-100 text-[10px] mt-1 font-bold uppercase tracking-widest opacity-80">Regla 30/70 Automática (5% Comisión)</p>
            </div>

            <div className="p-8 space-y-6 text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Precio de Cierre ($)</label>
                  <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-6 outline-none focus:border-blue-500 font-bold" value={datosCierre.precio_cierre} onChange={e => setDatosCierre({ ...datosCierre, precio_cierre: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comisión (5%)</label>
                  <div className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl py-3 px-6 font-black text-slate-800">${Number(comisionTotalCalculada).toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Agencia (30%)</span>
                  <span className="text-xl font-black text-blue-600">${Number(tajoCasa30).toLocaleString()}</span>
                </div>
                <div className="bg-blue-600 p-4 rounded-2xl border border-blue-600 shadow-lg shadow-blue-600/20">
                  <span className="text-[9px] font-black text-white/80 uppercase block mb-1">Pool Agentes (70%)</span>
                  <span className="text-xl font-black text-white">${Number(poolAgentes70).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reparto de Pool</label>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${totalPorcentajeAgentes === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{totalPorcentajeAgentes}% asignado</span>
                </div>
                <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:border-blue-500" onChange={e => {
                  const agent = agentesDisponibles.find(a => a.id === e.target.value);
                  if (agent && !datosCierre.agentes_comision.find(a => a.id === agent.id)) {
                    setDatosCierre({ ...datosCierre, agentes_comision: [...datosCierre.agentes_comision, { ...agent, comision_porcentaje: 0 }] });
                  }
                }} value="">
                  <option value="" disabled>Seleccionar Agente...</option>
                  {agentesDisponibles.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>

                <div className="max-h-32 overflow-y-auto space-y-2">
                  {datosCierre.agentes_comision.map((agente, index) => (
                    <div key={agente.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase block">{agente.nombre}</span>
                        <span className="text-sm font-bold text-blue-600">${(poolAgentes70 * (agente.comision_porcentaje / 100)).toFixed(2)}</span>
                      </div>
                      <input type="number" className="w-16 bg-white border border-slate-200 rounded-lg py-1 px-2 text-center font-bold text-sm" value={agente.comision_porcentaje} onChange={(e) => {
                        const updated = datosCierre.agentes_comision.map((a, i) => i === index ? { ...a, comision_porcentaje: e.target.value } : a);
                        setDatosCierre({ ...datosCierre, agentes_comision: updated });
                      }} />
                      <button onClick={() => setDatosCierre({ ...datosCierre, agentes_comision: datosCierre.agentes_comision.filter(a => a.id !== agente.id) })} className="text-red-400"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setMostrarModalCierre(false)} className="flex-1 bg-slate-100 text-slate-400 font-bold py-4 rounded-2xl uppercase text-[10px] tracking-widest">Cancelar</button>
                <button onClick={handleCerrarVenta} disabled={totalPorcentajeAgentes !== 100} className={`flex-1 font-bold py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-lg ${totalPorcentajeAgentes === 100 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Confirmar Venta</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetallePropiedad;