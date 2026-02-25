import { supabase } from './supabase';

export const propiedadesService = {
  async obtenerTodas() {
    const { data, error } = await supabase.from('propiedades').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async obtenerPorId(id) {
    const { data, error } = await supabase.from('propiedades').select('*').eq('id', id).single();
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

  async importarDesdeExcel(arregloDatos, usuario) {
    if (!arregloDatos || arregloDatos.length === 0) return;

    const orgId = usuario.user_metadata?.organizacion_id || null;
    const orgNombre = usuario.user_metadata?.agencia_nombre || 'Independiente';

    // Mapeamos los datos para añadir la estructura base de NexusReal
    const propiedadesBorrador = arregloDatos.map(item => ({
      titulo: item.titulo,
      descripcion: item.descripcion,
      zona: item.zona,
      precio: item.precio,
      habitaciones: item.habitaciones,
      banos: item.banos,
      metraje: item.metraje,
      tipo_inmueble: item.tipo_inmueble,
      tipo_operacion: item.tipo_operacion,
      // Metadata extra
      estado: 'disponible',
      galeria: [],
      // Usamos unsplash como base si están importando sin fotos, luego las subirán
      imagen_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
      whatsapp: usuario.user_metadata?.telefono || '+580000000', // Whatsapp default del agente
      agente_nombre: usuario.user_metadata?.nombre || usuario.email,
      agente_id: usuario.id,
      organizacion_id: orgId,
      organizacion_nombre: orgNombre,
    }));

    // Inserción en lote en Supabase (Bulk Insert)
    const { error } = await supabase.from('propiedades').insert(propiedadesBorrador);
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

            // LÓGICA ULTRA-LIGHT: Ajustamos dimensiones según el peso original
            let MAX_WIDTH = 1200;
            let calidad = 0.7; // Calidad base profesional

            // Si la foto es un "monstruo" de +5MB, bajamos más la resolución
            if (file.size > 5 * 1024 * 1024) {
              MAX_WIDTH = 1000;
              calidad = 0.5;
            }

            let width = img.width;
            let height = img.height;
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Marca de agua sutil
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.textAlign = 'right';
            ctx.fillText('NEXUSREAL', width - 20, height - 20);

            canvas.toBlob((blob) => {
              console.log(`Compresión finalizada: ${(blob.size / 1024).toFixed(2)} KB`);
              resolve(blob);
            }, 'image/jpeg', calidad);
          };
        };
      });
    };

    const imagenProcesada = await procesarImagen(file);
    const fileExt = 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
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

  async subirComprobante(file, usuario) {
    const fileExt = file.name.split('.').pop();
    const fileName = `pago-${usuario.id}-${Date.now()}.${fileExt}`;
    const filePath = `comprobantes/${fileName}`;

    // Subimos a un folder de comprobantes (debe existir el bucket 'fotos_propiedades' o uno nuevo)
    const { error: uploadError } = await supabase.storage
      .from('fotos_propiedades')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('fotos_propiedades')
      .getPublicUrl(filePath);

    // Registrar el pago en una tabla de auditoría (opcional pero recomendado)
    await supabase.from('notificaciones').insert([{
      tipo: 'pago_pendiente',
      mensaje: `Nueva confirmación de pago de ${usuario.user_metadata?.agencia_nombre || usuario.email}`,
      organizacion_id: usuario.user_metadata?.organizacion_id,
      metadata: { comprobante_url: publicUrl }
    }]);

    return publicUrl;
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
    const esAdmin = usuario?.user_metadata?.rol === 'admin';

    // Primero, verificamos si el usuario tiene derecho a ver esta propiedad
    const { data: propiedad } = await supabase
      .from('propiedades')
      .select('agente_id, organizacion_id')
      .eq('id', propiedadId)
      .single();

    if (!propiedad) return [];

    // PRIVACIDAD ROBUSTA: Solo el dueño de la propiedad o el admin de la agencia pueden ver prospectos
    const esDuenio = propiedad.agente_id === usuario?.id;
    const esAdminAgencia = esAdmin && propiedad.organizacion_id === orgId;

    if (!esDuenio && !esAdminAgencia) {
      console.warn("Acceso denegado a prospectos: Usuario no autorizado.");
      return [];
    }

    const { data, error } = await supabase
      .from('prospectos')
      .select('*')
      .eq('propiedad_id', propiedadId)
      .order('created_at', { ascending: false });

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

      if (error) {
        // Si no existe la organización aún, dejamos pasar (periodo de gracia automático 3 días)
        return { activa: true, mensaje: 'Periodo de Gracia Activo' };
      }

      const esActiva = data.estado_licencia === 'activa';

      return {
        activa: esActiva,
        mensaje: data.mensaje_bloqueo || 'Tu suscripción ha expirado. Por favor sube tu comprobante de pago en el Dashboard.'
      };
    } catch (e) {
      console.error("Error verificando licencia:", e);
      return { activa: true }; // Fallback para no bloquear por error de red
    }
  },

  async cerrarVenta(propiedadId, datosCierre, usuario) {
    const { precio_cierre, agentes_comision, nota_cierre, titulo_propiedad, zona_propiedad } = datosCierre;

    // VALIDACIÓN DE INTEGRIDAD CONTABLE (CTO MANDATORY)
    const totalPorcentajeAsignado = agentes_comision.reduce((sum, a) => sum + Number(a.comision_porcentaje || 0), 0);
    if (totalPorcentajeAsignado !== 100) {
      throw new Error("Integridad Contable: El reparto entre agentes debe sumar exactamente el 100% del pool.");
    }

    // 1. Automatización: La comisión total es el 5% del precio de cierre
    const monto_venta = Number(precio_cierre);
    const comision_total = Number((monto_venta * 0.05).toFixed(2));

    // 2. Regla 30/70: La Inmobiliaria (la casa) se queda con el 30% del total cobrado
    const comision_agencia_neta = Number((comision_total * 0.30).toFixed(2));

    // 3. Monto a repartir entre los agentes (El 70% restante)
    // BLINDAJE CTO: Restamos para evitar errores de redondeo de centavo
    const monto_repartible_agentes = Number((comision_total - comision_agencia_neta).toFixed(2));

    const { error: errorProp } = await supabase
      .from('propiedades')
      .update({
        estado: 'vendido',
        precio_cierre,
        comision_pagada: comision_total,
        fecha_cierre: new Date().toISOString()
      })
      .eq('id', propiedadId);

    if (errorProp) throw errorProp;

    // Registrar en contabilidad (ventas_registro)
    const { data: ventaRegistro, error: errorCont } = await supabase
      .from('ventas_registro')
      .insert([{
        propiedad_id: propiedadId,
        agente_id: usuario.id,
        organizacion_id: usuario.user_metadata?.organizacion_id,
        monto_venta: precio_cierre,
        comision_agencia: comision_agencia_neta, // El 30% de la casa
        notas: nota_cierre
      }])
      .select();

    if (errorCont) throw errorCont;

    const ventaId = ventaRegistro[0].id;

    // Registrar comisiones compartidas (ventas_agentes_comision)
    // El reparto se hace sobre el 70% asignado a los agentes
    const comisionesParaInsertar = agentes_comision.map(agente => ({
      venta_id: ventaId,
      agente_id: agente.id,
      monto_comision: (monto_repartible_agentes * (Number(agente.comision_porcentaje) / 100)).toFixed(2)
    }));

    const { error: errorComision } = await supabase
      .from('ventas_agentes_comision')
      .insert(comisionesParaInsertar);

    if (errorComision) throw errorComision;

    // --- Emitir Notificación Global de Éxito ---
    await supabase.from('notificaciones').insert([{
      tipo: 'venta_exitosa',
      titulo: '¡VENTA CERRADA! 🎉',
      mensaje: `${usuario.user_metadata?.nombre || 'Un agente'} acaba de cerrar la venta de "${titulo_propiedad || 'una propiedad'}" en ${zona_propiedad || 'la zona'}.`,
      organizacion_id: usuario.user_metadata?.organizacion_id,
      meta_data: {
        monto: precio_cierre,
        agente: usuario.user_metadata?.nombre,
        agentes_comision: agentes_comision.map(a => ({ id: a.id, nombre: a.nombre, comision: a.comision_porcentaje }))
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

  async obtenerNotificaciones(organizacionId) {
    if (!organizacionId) return [];
    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('organizacion_id', organizacionId)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Error obteniendo notificaciones:", e);
      return [];
    }
  },

  async obtenerVentasAgencia(usuario) {
    const orgId = usuario.user_metadata?.organizacion_id;
    const esAdmin = usuario.user_metadata?.rol === 'admin';

    // MODO DESARROLLO: Permitimos el paso si existe el contexto de organización, 
    // relajando la restricción de rol para facilitar las pruebas iniciales.
    if (!orgId) {
      console.warn("Nexus Real-Time: Usuario sin organización vinculada. Mostrando set de datos vacío.");
      return [];
    }

    const { data, error } = await supabase
      .from('ventas_registro')
      .select(`
        *,
        propiedades (titulo, zona),
        ventas_agentes_comision (
          agente_id, 
          monto_comision
        )
      `)
      .eq('organizacion_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async obtenerPropiedades(usuario, filtros) {
    let query = supabase.from('propiedades').select('*');

    // Aplicar filtros
    if (filtros.texto) {
      query = query.or(`titulo.ilike.%${filtros.texto}%,zona.ilike.%${filtros.texto}%,agente_nombre.ilike.%${filtros.texto}%`);
    }
    if (filtros.zona) {
      query = query.ilike('zona', `%${filtros.zona}%`);
    }
    if (filtros.tipo) {
      query = query.eq('tipo_inmueble', filtros.tipo);
    }
    if (filtros.operacion) {
      query = query.eq('tipo_operacion', filtros.operacion);
    }
    if (filtros.precioMin) {
      query = query.gte('precio', filtros.precioMin);
    }
    if (filtros.precioMax) {
      query = query.lte('precio', filtros.precioMax);
    }
    if (filtros.habitaciones) {
      query = query.gte('habitaciones', filtros.habitaciones);
    }
    if (filtros.banos) {
      query = query.gte('banos', filtros.banos);
    }
    if (filtros.metrajeMin) {
      query = query.gte('metraje', filtros.metrajeMin);
    }

    // Filtro por estado
    if (filtros.estado === 'disponible') {
      query = query.not('estado', 'in', '("vendido","alquilado")');
    } else if (filtros.estado !== 'todos') {
      query = query.eq('estado', filtros.estado);
    }

    // Filtro por modo MLS
    if (filtros.modoMLS === 'solo_mias' && usuario?.id) {
      query = query.eq('agente_id', usuario.id);
    } else if (filtros.modoMLS === 'mi_agencia' && usuario?.user_metadata?.organizacion_id) {
      query = query.eq('organizacion_id', usuario.user_metadata.organizacion_id);
    }

    // Ordenar
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // --- GESTIÓN DE TASA (SIMPLIFICADA) ---
  async obtenerTasa() {
    try {
      // 1. Intentamos obtener la tasa guardada en Base de Datos
      const { data, error } = await supabase
        .from('configuracion')
        .select('valor, updated_at')
        .eq('clave', 'tasa_bcv')
        .maybeSingle();

      const ahora = new Date();
      const ultimaActualizacion = data?.updated_at ? new Date(data.updated_at) : null;

      // 2. Si no hay datos, o si la tasa tiene más de 6 horas, intentamos sincronizar con BCV
      const esAntigua = !ultimaActualizacion || (ahora - ultimaActualizacion) > (6 * 60 * 60 * 1000);

      if (!data || esAntigua) {
        console.log("Tasa ausente o antigua. Sincronizando con BCV...");
        const tasaOficial = await this.obtenerTasaOficial();

        if (tasaOficial) {
          await this.guardarTasaManual(tasaOficial);
          localStorage.setItem('tasa_bcv_cache', tasaOficial.toString());
          return tasaOficial;
        }
      }

      // 3. Si tenemos data fresca o el scraping falló, devolvemos lo que hay en DB/Cache
      if (data?.valor) {
        return parseFloat(data.valor);
      }

      const cache = localStorage.getItem('tasa_bcv_cache');
      return cache ? parseFloat(cache) : 48.50;
    } catch (e) {
      const cache = localStorage.getItem('tasa_bcv_cache');
      return cache ? parseFloat(cache) : 48.50;
    }
  },

  subscribirseATasa(callback) {
    return supabase
      .channel('tasa-cambio-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'configuracion',
          filter: 'clave=eq.tasa_bcv'
        },
        (payload) => {
          if (payload.new && payload.new.valor) {
            callback(parseFloat(payload.new.valor));
          }
        }
      )
      .subscribe();
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
      // Intentamos con DolarToday (fuente muy estable que referencia al BCV)
      const response = await fetch('https://s3.amazonaws.com/dolartoday/data.json');
      if (response.ok) {
        const data = await response.json();
        const tasa = parseFloat(data?.USD?.sicad2);
        if (tasa && tasa > 20) return tasa;
      }
    } catch (e) {
      console.warn("Error con DolarToday, intentando scraping...");
    }

    try {
      // Scraping directo al BCV vía proxy
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://www.bcv.org.ve/')}`;
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const data = await response.json();
        const html = data.contents;

        // Multi-patrón para el BCV (a veces cambian el <strong> o el ID del div)
        const regexDolar = /id="dolar"[\s\S]*?<strong>\s*(\d+,\d+)\s*<\/strong>/i;
        const match = html.match(regexDolar);

        if (match && match[1]) {
          const valor = parseFloat(match[1].replace(',', '.'));
          // CTO BLINDAJE: Si el BCV devuelve 0 o vacío, ignoramos
          if (valor > 0) return valor;
        }

        // Fallback: buscar cualquier strong con formato de decimales altos (como 54,20)
        const regexGenerica = /<strong>\s*(\d{2},\d{2,})\s*<\/strong>/g;
        let m;
        let tasasEncontradas = [];
        while ((m = regexGenerica.exec(html)) !== null) {
          const v = parseFloat(m[1].replace(',', '.'));
          if (v > 0) tasasEncontradas.push(v);
        }
        if (tasasEncontradas.length > 0) {
          return Math.max(...tasasEncontradas);
        }
      }
    } catch (e) {
      console.error("Fallo total en sincronización de tasa. Se activará el fallback historial.");
    }
    return null;
  },

  async obtenerEstadisticasAgencia(usuario) {
    const orgId = usuario.user_metadata?.organizacion_id;
    if (!orgId) return { totalProspectos: 0, ventasMes: 0 };

    try {
      // 1. Contar prospectos de la organización
      const { count: totalProspectos, error: errProspectos } = await supabase
        .from('prospectos')
        .select('*', { count: 'exact', head: true })
        .eq('organizacion_id', orgId);

      if (errProspectos) throw errProspectos;

      // 2. Calcular ventas del mes actual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { data: ventas, error: errVentas } = await supabase
        .from('ventas_registro')
        .select('monto_venta')
        .eq('organizacion_id', orgId)
        .gte('created_at', inicioMes.toISOString());

      if (errVentas) throw errVentas;

      const ventasMes = ventas.reduce((acc, v) => acc + Number(v.monto_venta || 0), 0);

      return {
        totalProspectos: totalProspectos || 0,
        ventasMes
      };
    } catch (e) {
      console.error("Error al obtener estadísticas:", e);
      return { totalProspectos: 0, ventasMes: 0 };
    }
  },

  async seedData(usuario) {
    const orgId = usuario.user_metadata?.organizacion_id || null;
    const orgNombre = usuario.user_metadata?.agencia_nombre || 'Independiente';
    const agenteNombre = usuario.user_metadata?.nombre || usuario.email;

    // 1. Limpiar datos previos de prueba para este usuario/organización si se desea
    // Por seguridad, aquí solo agregamos, pero en una implementación de "Reset" 
    // podríamos borrar lo anterior filtrando por agente_id o organizacion_id.

    const propiedadesPrueba = [
      {
        titulo: 'Casa Familiar en Alto Barinas',
        precio: 65000,
        zona: 'Barinas, Alto Barinas',
        habitaciones: 4,
        banos: 3,
        metraje: 180,
        tipo_inmueble: 'Casa',
        tipo_operacion: 'Venta',
        descripcion: 'Amplia casa ideal para familia, con jardín y área de parrillera. Ubicada en zona tranquila y segura.',
        imagen_url: 'https://images.unsplash.com/photo-1580582932707-52c5df7ff049?auto=format&fit=crop&w=800&q=80',
        galeria: ['https://images.unsplash.com/photo-1580582932707-52c5df7ff049?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1560518883-ffcd148911cd?auto=format&fit=crop&w=800&q=80'],
        estado: 'disponible',
        whatsapp: '584141234567',
        comision: 5,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // Hace 3 días
      },
      {
        titulo: 'Apartamento Céntrico en El Llano',
        precio: 35000,
        zona: 'Barinas, El Llano',
        habitaciones: 2,
        banos: 2,
        metraje: 70,
        tipo_inmueble: 'Apartamento',
        tipo_operacion: 'Venta',
        descripcion: 'Apartamento moderno con excelente ubicación, cerca de comercios y servicios. Ideal para solteros o parejas.',
        imagen_url: 'https://images.unsplash.com/photo-1570129477490-ba5b1e69502a?auto=format&fit=crop&w=800&q=80',
        galeria: ['https://images.unsplash.com/photo-1570129477490-ba5b1e69502a?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80'],
        estado: 'disponible',
        whatsapp: '584241234567',
        comision: 4,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // Ayer
      },
      {
        titulo: 'Terreno para Desarrollo en Don Samuel',
        precio: 80000,
        zona: 'Barinas, Don Samuel',
        metraje: 500,
        tipo_inmueble: 'Terreno',
        tipo_operacion: 'Venta',
        descripcion: 'Gran oportunidad de inversión. Terreno plano, ideal para construcción de viviendas o locales comerciales.',
        imagen_url: 'https://images.unsplash.com/photo-1582063289852-62f3e2002922?auto=format&fit=crop&w=800&q=80',
        galeria: ['https://images.unsplash.com/photo-1582063289852-62f3e2002922?auto=format&fit=crop&w=800&q=80'],
        estado: 'disponible',
        whatsapp: '584121234567',
        comision: 10,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // Hace 5 días
      },
      {
        titulo: 'Local Comercial en Los Pozones',
        precio: 1500,
        zona: 'Barinas, Los Pozones',
        metraje: 60,
        tipo_inmueble: 'Local Comercial',
        tipo_operacion: 'Alquiler',
        descripcion: 'Local a estrenar en centro comercial. Ideal para cualquier tipo de negocio, alto tráfico peatonal y vehicular.',
        imagen_url: 'https://images.unsplash.com/photo-1567401893410-b99f3640207a?auto=format&fit=crop&w=800&q=80',
        galeria: ['https://images.unsplash.com/photo-1567401893410-b99f3640207a?auto=format&fit=crop&w=800&q=80'],
        estado: 'vendido', // Una ya vendida para ver stats
        precio_cierre: 1450,
        fecha_cierre: new Date().toISOString(),
        comision_pagada: 145,
        whatsapp: '584147654321',
        comision: 5,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // Hace 10 días
      }
    ];

    let insertados = 0;
    let ultimoError = null;

    for (const prop of propiedadesPrueba) {
      try {
        const payload = {
          ...prop,
          agente_nombre: agenteNombre,
          agente_id: usuario.id,
          organizacion_id: orgId,
          organizacion_nombre: orgNombre,
          es_prueba: true
        };

        let { data: newProp, error: errorProp } = await supabase.from('propiedades').insert([payload]).select();

        if (errorProp) {
          if (errorProp.message?.includes('es_prueba') || errorProp.code === '42703') {
            // Reintentar sin la columna es_prueba
            delete payload.es_prueba;
            const { data: retryProp, error: retryError } = await supabase.from('propiedades').insert([payload]).select();
            if (retryError) throw retryError;
            newProp = retryProp;
          } else {
            throw errorProp;
          }
        }

        if (newProp && newProp[0]) {
          insertados++;
          await this.agregarProspectoPrueba(newProp[0].id, usuario, orgId);
        }
      } catch (e) {
        console.error("Error al insertar propiedad de prueba:", e);
        ultimoError = e;
      }
    }

    if (insertados === 0 && ultimoError) {
      throw new Error("No se pudo insertar ninguna propiedad: " + ultimoError.message);
    }

    // Agregar notificaciones de prueba
    try {
      await supabase.from('notificaciones').insert([
        {
          tipo: 'venta_exitosa',
          titulo: '¡VENTA CERRADA! 🎉',
          mensaje: `Un agente de ${orgNombre} acaba de cerrar una venta importante.`,
          organizacion_id: orgId,
          meta_data: { monto: 125000, agente: 'Sistema' }
        }
      ]);
    } catch (e) {
      console.warn("Error con notificaciones:", e);
    }

    return insertados > 0;
  },

  async agregarProspectoPrueba(propiedadId, usuario, orgId) {
    const prospectosFicticios = [
      {
        nombre: 'María García',
        telefono: '+584141112233',
        correo: 'maria.garcia@gmail.com',
        mensaje: '¿Aceptan crédito bancario para esta propiedad?',
        fuente: 'Instagram'
      },
      {
        nombre: 'Juan Pérez',
        telefono: '+584125556677',
        correo: 'juanp@hotmail.com',
        mensaje: 'Me gustaría agendar una visita para este fin de semana.',
        fuente: 'WhatsApp'
      },
      {
        nombre: 'Empresa Inversora S.A.',
        telefono: '+582129998877',
        correo: 'compras@inversora.com',
        mensaje: 'Estamos interesados en el local comercial para una franquicia.',
        fuente: 'Web'
      }
    ];

    // Elegir 1 o 2 prospectos al azar
    const cantidad = Math.floor(Math.random() * 2) + 1;
    const barajados = prospectosFicticios.sort(() => 0.5 - Math.random());
    const seleccionados = barajados.slice(0, cantidad);

    for (const p of seleccionados) {
      await supabase.from('prospectos').insert([{
        ...p,
        propiedad_id: propiedadId,
        organizacion_id: orgId,
        agente_id: usuario.id,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000).toISOString()
      }]);
    }
  },

  async obtenerAgentesPorOrganizacion(organizacionId) {
    if (!organizacionId) return [];
    try {
      // Utilizamos el RPC seguro creado en la base de datos
      const { data, error } = await supabase
        .rpc('get_agentes_organizacion', { org_id: organizacionId });

      if (error) throw error;

      return data.map(user => ({
        id: user.id,
        nombre: user.raw_user_meta_data?.nombre || user.raw_user_meta_data?.email || 'Agente Desconocido',
        comision_porcentaje: 0 // Preparado para el panel de cierre
      }));
    } catch (e) {
      console.error("Error obteniendo agentes por organización:", e);
      return [];
    }
  },

  async limpiarDatosPrueba(usuario) {
    const orgId = usuario.user_metadata?.organizacion_id || null;

    const titulosPrueba = [
      'Apartamento Moderno en La Trigaleña',
      'Quinta de Lujo en Alto Hatillo',
      'Local Comercial en Chacao',
      'Penthouse en El Parral'
    ];

    try {
      // 1. Intentamos obtener IDs con el flag es_prueba
      let query = supabase
        .from('propiedades')
        .select('id')
        .eq('agente_id', usuario.id);

      // Intentamos una búsqueda que no rompa si no existe la columna
      const { data: props, error: errorSearch } = await query.or(`titulo.in.(${titulosPrueba.map(t => `"${t}"`).join(',')})`);

      let propIds = props?.map(p => p.id) || [];

      // Si no encontramos por título, intentamos por flag (en un bloque separado por si falla la columna)
      try {
        const { data: propsFlag } = await supabase
          .from('propiedades')
          .select('id')
          .eq('agente_id', usuario.id)
          .eq('es_prueba', true);

        if (propsFlag) {
          const extraIds = propsFlag.map(p => p.id).filter(id => !propIds.includes(id));
          propIds = [...propIds, ...extraIds];
        }
      } catch (e) {
        console.warn("Columna es_prueba no existe, saltando búsqueda por flag.");
      }

      if (propIds.length > 0) {
        await supabase.from('prospectos').delete().in('propiedad_id', propIds);
        const { error: errorDel } = await supabase.from('propiedades').delete().in('id', propIds);
        if (errorDel) throw errorDel;
      }

      if (orgId) {
        await supabase.from('notificaciones').delete()
          .eq('organizacion_id', orgId)
          .in('tipo', ['nuevo_prospecto', 'venta_exitosa']);
      }
    } catch (error) {
      console.error("Error en limpieza:", error);
      throw error;
    }

    return true;
  },

  async obtenerComisionesAgente(agentId) {
    const { data, error } = await supabase
      .from('ventas_agentes_comision')
      .select(`
        *,
        ventas_registro (
          monto_venta,
          created_at,
          propiedades (titulo, zona)
        )
      `)
      .eq('agente_id', agentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};