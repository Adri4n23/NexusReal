// Utilidad para "leer" mensajes de WhatsApp y extraer datos
// Esto funciona buscando patrones comunes en los mensajes inmobiliarios

export const parsearTextoWhatsApp = (texto) => {
    const datos = {
      titulo: '',
      precio: '',
      zona: '',
      habitaciones: '',
      banos: '',
      metraje: '',
      descripcion: texto, // Guardamos el texto original en la descripción
      tipo_inmueble: 'Apartamento', // Default
      tipo_operacion: 'Venta' // Default
    };
  
    const textoMin = texto.toLowerCase();
  
    // 1. Detectar Precio (Busca símbolos $ o USD)
    // Ejemplos: $50.000, 50000$, USD 50.000
    const precioMatch = texto.match(/(\$|usd|precio)\s?\.?:?\s?(\d{1,3}(?:[.,]\d{3})*)/i);
    if (precioMatch) {
      // Limpiamos puntos y comas para dejar solo el número
      datos.precio = precioMatch[2].replace(/[.,]/g, '');
    }
  
    // 2. Detectar Habitaciones
    // Ejemplos: 3 habs, 3 habitaciones, 3h, 3d
    const habsMatch = textoMin.match(/(\d+)\s?(hab|dorm|recamara)/);
    if (habsMatch) datos.habitaciones = habsMatch[1];
  
    // 3. Detectar Baños
    // Ejemplos: 2 baños, 2 banos, 2b
    const banosMatch = textoMin.match(/(\d+)\s?(baño|bano|wc)/);
    if (banosMatch) datos.banos = banosMatch[1];
  
    // 4. Detectar Metraje
    // Ejemplos: 80m2, 80 mts, 80 metros
    const metrosMatch = textoMin.match(/(\d+)\s?(m2|mts|mt|metro)/);
    if (metrosMatch) datos.metraje = metrosMatch[1];
  
    // 5. Detectar Tipo de Inmueble
    if (textoMin.includes('casa') || textoMin.includes('townhouse')) datos.tipo_inmueble = 'Casa';
    else if (textoMin.includes('apto') || textoMin.includes('apartamento')) datos.tipo_inmueble = 'Apartamento';
    else if (textoMin.includes('finca')) datos.tipo_inmueble = 'Finca';
    else if (textoMin.includes('local') || textoMin.includes('oficina')) datos.tipo_inmueble = 'Estudio';
    else if (textoMin.includes('terreno') || textoMin.includes('lote')) datos.tipo_inmueble = 'Terreno';
  
    // 6. Detectar Operación
    if (textoMin.includes('alquil') || textoMin.includes('arriend')) datos.tipo_operacion = 'Alquiler';
  
    // 7. Intentar sacar un Título (La primera línea suele ser el título)
    const lineas = texto.split('\n').filter(l => l.trim().length > 0);
    if (lineas.length > 0) {
      datos.titulo = lineas[0].substring(0, 50); // Tomamos la primera línea
    }
    
    // 8. Intentar detectar Zona (Busca palabra clave "zona" o "ubicado en")
    const zonaMatch = textoMin.match(/(?:zona|ubicación|ubicado|sector)[:\s]+([^,\n.]+)/);
    if (zonaMatch) {
        // Capitalizar primera letra de cada palabra
        datos.zona = zonaMatch[1].trim().replace(/\b\w/g, l => l.toUpperCase());
    }
  
    return datos;
  };