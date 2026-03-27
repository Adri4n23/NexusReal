import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * NEXUS CORE: activate-license (v2.0)
 * Motor centralizado y ultra-seguro para movimientos financieros y licencias.
 * Soporta activaciones individuales y de agencias con 2FA.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. VERIFICACIÓN DE IDENTIDAD (SUPERADMIN)
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user || user.user_metadata?.rol !== 'superadmin') {
      throw new Error("Acceso Prohibido: Se requiere rol SuperAdmin.");
    }

    // 2. EXTRACCIÓN Y VALIDACIÓN DE PIN (2FA)
    const { id, type, pin_seguridad, metadata } = await req.json();
    const MASTER_PIN = Deno.env.get('SUPERADMIN_MASTER_PIN') || "0000";
    
    if (pin_seguridad !== MASTER_PIN) {
      throw new Error("PIN Maestro Incorrecto: Operación Bloqueada.");
    }

    if (type === 'individual') {
      // Lógica para Agentes Individuales (Suscripciones Pro)
      const nueva_fecha = new Date();
      nueva_fecha.setDate(nueva_fecha.getDate() + 30);

      const { error: errUpdate } = await supabaseClient
        .from('suscripciones')
        .update({
          status: 'activo',
          plan: 'Pro',
          fecha_vencimiento: nueva_fecha.toISOString()
        })
        .eq('id', id);

      if (errUpdate) throw errUpdate;

      // Auditoría
      await supabaseClient.from('logs_de_activacion').insert([{
        superadmin_id: user.id,
        organizacion_id: id,
        plan_id: 'Individual_Pro_30D',
        metodo_pago: metadata?.metodo || 'Manual',
        referencia_pago: metadata?.referencia || 'N/A'
      }]);

    } else if (type === 'agency') {
      // Lógica para Agencias (Organizaciones)
      const { pago_id, oficina_id } = id; // En este caso id es un objeto
      
      // A) Aprobar Pago
      await supabaseClient.from('suscripciones_pagos').update({ status: 'aprobado' }).eq('id', pago_id);

      // B) Activar Organización
      const nueva_fecha = new Date();
      nueva_fecha.setDate(nueva_fecha.getDate() + 30);
      
      await supabaseClient.from('organizaciones').update({
        plan_status: 'active',
        trial_ends_at: nueva_fecha.toISOString()
      }).eq('id', oficina_id);

      // C) Notificar
      await supabaseClient.from('notificaciones').insert([{
        tipo: 'pago_aprobado',
        titulo: '¡Licencia Activada! 🚀',
        mensaje: 'Tu oficina cuenta con acceso total.',
        oficina_id: oficina_id
      }]);

      // Auditoría
      await supabaseClient.from('logs_de_activacion').insert([{
        superadmin_id: user.id,
        organizacion_id: oficina_id,
        plan_id: 'Agencia_Active_30D',
        metodo_pago: 'Verificación Bancaria Manual',
        referencia_pago: pago_id
      }]);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Operación financiera autorizada y ejecutada." }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
