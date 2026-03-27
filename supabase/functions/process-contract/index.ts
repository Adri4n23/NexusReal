// supabase/functions/process-contract/index.ts
// Este es el código de tu Supabase Edge Function.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// NOTA DE ARQUITECTURA: La clave de la API de OpenAI (o cualquier otro LLM)
// debe estar configurada como un "Secret" en el panel de Supabase, NUNCA aquí.
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Prompt de Ingeniería para la Extracción de Datos
const createPrompt = (contractText: string): string => {
  return `
    Eres un asistente legal experto en el mercado inmobiliario venezolano, especializado en extraer datos de contratos de arrendamiento.
    Analiza el siguiente texto y extrae la información clave en formato JSON. Sigue estas reglas estrictamente:

    1.  **Nombres:** Extrae el nombre completo del Arrendador y del Arrendatario.
    2.  **Cédulas:** Extrae los números de cédula de identidad, incluyendo el prefijo (V-, E-).
    3.  **Montos:** Extrae el "Monto de Garantía" y el "Canon de Arrendamiento". Devuélvelos como números, sin símbolos de moneda.
    4.  **Inventario:** Identifica la lista de bienes muebles y su estado. Devuélvela como un array de objetos JSON, donde cada objeto tiene las claves "item" y "estado".
    5.  **Formato:** Si un dato no se encuentra, devuelve un string vacío "" para ese campo o un array vacío [] para el inventario.

    Texto del Contrato:
    """
    ${contractText}
    """

    JSON de Salida:
  `;
};

serve(async (req) => {
  // 1. Verificación de Seguridad Inicial
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 });
  }

  const { contractText, propiedad_id } = await req.json();
  const user = req.headers.get('x-supabase-user'); // Supabase pasa el usuario autenticado

  if (!user) {
    return new Response(JSON.stringify({ error: 'Autenticación requerida' }), { status: 401 });
  }

  // 2. Lógica de Autorización en el Backend (Defensa en Profundidad)
  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  const { data: propiedad, error: propError } = await supabaseAdmin
    .from('propiedades')
    .select('agente_id, oficin-id')
    .eq('id', propiedad_id)
    .single();

  if (propError || !propiedad) {
    return new Response(JSON.stringify({ error: 'Propiedad no encontrada' }), { status: 404 });
  }

  const { data: userRoles } = await supabaseAdmin.auth.admin.getUserById(user.id);
  const rol = userRoles.user?.user_metadata?.rol;
  const esDuenio = propiedad.agente_id === user.id;
  const esAdmin = rol === 'owner' || rol === 'superadmin';

  if (!esDuenio && !esAdmin) {
    return new Response(JSON.stringify({ error: 'Acceso denegado. No tienes permisos para esta propiedad.' }), { status: 403 });
  }

  // 3. Llamada Segura a la API del Modelo de Lenguaje
  try {
    const prompt = createPrompt(contractText);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1, // Buscamos precisión, no creatividad
      }),
    });

    if (!response.ok) {
      throw new Error(`API de OpenAI respondió con status: ${response.status}`);
    }

    const data = await response.json();
    const extractedData = JSON.parse(data.choices[0].message.content);

    // 4. Devolver los datos estructurados al frontend
    return new Response(JSON.stringify(extractedData), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error en la Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Fallo al procesar el contrato con IA.' }), { status: 500 });
  }
});
