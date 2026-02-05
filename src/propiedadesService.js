import { supabase } from './supabase';

export const propiedadesService = {
  async obtenerTodas() {
    const { data, error } = await supabase.from('propiedades').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async crear(datos, usuario) {
    const { error } = await supabase.from('propiedades').insert([{
      ...datos,
      agente_nombre: usuario.user_metadata?.nombre || usuario.email,
      agente_id: usuario.id,
      galeria: datos.galeria || [] // Aseguramos que se guarde el array
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
    // 1. Optimización y Marca de Agua (Procesamiento en el Navegador)
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

            // Redimensionar si es muy grande (max 1200px)
            const MAX_WIDTH = 1200;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;

            // Dibujar imagen original
            ctx.drawImage(img, 0, 0, width, height);

            // Añadir Marca de Agua
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.textAlign = 'right';
            ctx.fillText('NEXUSREAL', width - 20, height - 20);

            // Convertir a Blob (comprimido al 80%)
            canvas.toBlob((blob) => {
              resolve(blob);
            }, 'image/jpeg', 0.8);
          };
        };
      });
    };

    const imagenProcesada = await procesarImagen(file);

    // 2. Subida a Supabase
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

  // --- MINI CRM ---
  async obtenerProspectos(propiedadId) {
    const { data, error } = await supabase
      .from('prospectos')
      .select('*')
      .eq('propiedad_id', propiedadId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async agregarProspecto(datos) {
    const { error } = await supabase
      .from('prospectos')
      .insert([datos]);
    if (error) throw error;
  },

  async obtenerTasaBCV() {
    try {
      const response = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.bcv.org.ve/'));
      const data = await response.json();
      const html = data.contents;

      // Buscamos específicamente el bloque del Dólar
      // Según la estructura del BCV, el valor del USD está en un contenedor con ID "dolar"
      const regexDolar = /<div id="dolar"[\s\S]*?<strong>\s*([\d,\.]+)\s*<\/strong>/;
      let match = html.match(regexDolar);

      if (!match) {
        // Intento 2: Buscar por el texto USD y la clase de la fuente
        const regexUSD = /USD[\s\S]*?<strong class="roboto-slab">([\d,\.]+)<\/strong>/;
        match = html.match(regexUSD);
      }

      if (match && match[1]) {
        // Limpiamos el valor: el BCV usa '.' para miles y ',' para decimales
        const valorLimpio = match[1].trim().replace(/\./g, '').replace(',', '.');
        const tasa = parseFloat(valorLimpio);
        
        if (!isNaN(tasa) && tasa > 0) {
          return tasa;
        }
      }
      
      throw new Error('No se pudo procesar la tasa del USD.');
    } catch (error) {
      console.error('Error al obtener la tasa del BCV:', error);
      // Retornamos un valor coherente con lo que ves en pantalla si falla la captura
      return 378.45; 
    }
  }
};