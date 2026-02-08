import { supabase } from './supabase';

export const propiedadesService = {
  async obtenerTodas() {
    const { data, error } = await supabase.from('propiedades').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async crear(datos, usuario) {
    const orgId = usuario.user_metadata?.organizacion_id || null;
    const orgNombre = usuario.user_metadata?.agencia_nombre || 'Independiente';

    const { error } = await supabase.from('propiedades').insert([{
      ...datos,
      agente_nombre: usuario.user_metadata?.nombre || usuario.email,
      agente_id: usuario.id,
      organizacion_id: orgId,
      organizacion_nombre: orgNombre,
      galeria: datos.galeria || []
    }]);
    if (error) throw error;
  },

  async actualizar(id, datos) {
    const { error } = await supabase.from('propiedades').update(datos).eq('id', id);
    if (error) throw error;
  },

  async eliminar(id) {
    const { error } = await supabase.from('propiedades').delete().eq('id', id);
    if (error) throw error;
  },

  async subirFoto(file) {
    const procesarImagen = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_WIDTH = 1200;
            let width = img.width;
            let height = img.height;
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.textAlign = 'right';
            ctx.fillText('NEXUSREAL', width - 20, height - 20);
            canvas.toBlob((blob) => {
              resolve(blob);
            }, 'image/jpeg', 0.8);
          };
        };
      });
    };

    const imagenProcesada = await procesarImagen(file);
    const fileExt = 'jpg';
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('fotos_propiedades')
      .upload(filePath, imagenProcesada);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('fotos_propiedades')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async subirGaleria(files) {
    const urls = [];
    for (const file of files) {
      const url = await this.subirFoto(file);
      urls.push(url);
    }
    return urls;
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  async agregarProspecto(datos, usuario) {
    const orgId = usuario?.user_metadata?.organizacion_id || null;
    const { error } = await supabase
      .from('prospectos')
      .insert([{
        ...datos,
        organizacion_id: orgId // Los prospectos siempre pertenecen a la agencia del agente
      }]);
    if (error) throw error;
  },

  // Obtener solo prospectos de MI organización
  async obtenerProspectos(propiedadId, usuario) {
    const orgId = usuario?.user_metadata?.organizacion_id || null;
    let query = supabase
      .from('prospectos')
      .select('*')
      .eq('propiedad_id', propiedadId);
    
    // Si el usuario pertenece a una organización, solo ve prospectos de esa organización
    if (orgId) {
      query = query.eq('organizacion_id', orgId);
    } else {
      // Si es independiente, solo ve los suyos propios (asumiendo que los registró él)
      query = query.eq('agente_id', usuario.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // --- GESTIÓN DE ORGANIZACIONES Y LICENCIAS ---
  async verificarLicencia(orgId) {
    if (!orgId) return { activa: true, mensaje: 'Modo Independiente' }; // Los independientes por ahora son gratis
    
    try {
      const { data, error } = await supabase
        .from('organizaciones')
        .select('estado_licencia, mensaje_bloqueo')
        .eq('id', orgId)
        .single();
      
      if (error) throw error;
      
      return {
        activa: data.estado_licencia === 'activa',
        mensaje: data.mensaje_bloqueo || 'Tu suscripción ha expirado. Contacta a soporte.'
      };
    } catch (e) {
      console.error("Error verificando licencia:", e);
      return { activa: true }; // Fallback para no bloquear por error de red
    }
  },

  async cerrarVenta(propiedadId, datosCierre, usuario) {
    const { precio_cierre, comision_total, nota_cierre } = datosCierre;
    
    const { error: errorProp } = await supabase
      .from('propiedades')
      .update({ 
        estado: 'vendido',
        precio_cierre,
        comision_pagada: comision_total,
        fecha_cierre: new Date()
      })
      .eq('id', propiedadId);

    if (errorProp) throw errorProp;

    // Registrar en contabilidad (opcional, pero recomendado)
    const { error: errorCont } = await supabase
      .from('ventas_registro')
      .insert([{
        propiedad_id: propiedadId,
        agente_id: usuario.id,
        organizacion_id: usuario.user_metadata?.organizacion_id,
        monto_venta: precio_cierre,
        comision_agencia: comision_total / 2, // Ejemplo 50/50
        comision_agente: comision_total / 2,
        notas: nota_cierre
      }]);

    if (errorCont) throw errorCont;

    // --- NUEVO: Emitir Notificación Global de Éxito ---
    await supabase.from('notificaciones').insert([{
      tipo: 'venta_exitosa',
      titulo: '¡VENTA CERRADA! 🎉',
      mensaje: `${usuario.user_metadata?.nombre || 'Un agente'} acaba de cerrar la venta de "${datosCierre.titulo_propiedad || 'una propiedad'}" en ${datosCierre.zona_propiedad || 'la zona'}.`,
      organizacion_id: usuario.user_metadata?.organizacion_id,
      meta_data: {
        monto: precio_cierre,
        agente: usuario.user_metadata?.nombre
      }
    }]);
  },

  subscribirseANotificaciones(callback) {
    return supabase
      .channel('notificaciones-reales')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones' },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },

  async obtenerVentasAgencia(usuario) {
    const orgId = usuario.user_metadata?.organizacion_id;
    if (!orgId) return [];

    const { data, error } = await supabase
      .from('ventas_registro')
      .select('*, propiedades(titulo, zona)')
      .eq('organizacion_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // --- GESTIÓN DE TASA (SIMPLIFICADA) ---
  async obtenerTasa() {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('valor')
        .eq('clave', 'tasa_bcv')
        .maybeSingle();
      
      if (error || !data) {
        const cache = localStorage.getItem('tasa_bcv_cache');
        return cache ? parseFloat(cache) : 38.50;
      }

      return parseFloat(data.valor);
    } catch (e) {
      const cache = localStorage.getItem('tasa_bcv_cache');
      return cache ? parseFloat(cache) : 38.50;
    }
  },

  async guardarTasaManual(valor) {
    try {
      const { error } = await supabase
        .from('configuracion')
        .upsert({ 
          clave: 'tasa_bcv', 
          valor: valor.toString(), 
          updated_at: new Date().toISOString() 
        }, { 
          onConflict: 'clave' 
        });
      
      if (error) throw error;
      localStorage.setItem('tasa_bcv_cache', valor.toString());
      return true;
    } catch (error) {
      console.error('Error al guardar tasa:', error);
      throw error;
    }
  },

  // --- NUEVO: Obtención inteligente para facilitar al usuario ---
  async obtenerTasaOficial() {
    try {
      // Intentamos con DolarToday (fuente más estable por API)
      const response = await fetch('https://s3.amazonaws.com/dolartoday/data.json');
      if (response.ok) {
        const data = await response.json();
        const tasa = parseFloat(data?.USD?.sicad2); // El sicad2 suele ser el BCV en su API
        if (tasa && tasa > 20) return tasa;
      }
    } catch (e) {
      console.warn("Error con DolarToday, intentando fuente alternativa...");
    }

    // Si falla, intentamos un proxy al BCV (Scraping ligero)
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://www.bcv.org.ve/')}`;
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const data = await response.json();
        const html = data.contents;
        // Buscamos el patrón del dólar en el HTML del BCV
        const regex = /<strong>\s*(\d+,\d+)\s*<\/strong>/;
        const match = html.match(regex);
        if (match && match[1]) {
          return parseFloat(match[1].replace(',', '.'));
        }
      }
    } catch (e) {
      console.error("No se pudo obtener la tasa de ninguna fuente automática.");
    }
    return null;
  }
};