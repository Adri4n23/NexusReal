import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bgqfakzcyejvbddbdape.supabase.co";
const SUPABASE_KEY = "sb_publishable_E5tzUn4nyMT3OVDUI0gghA_OfBWmbT_"; // SE REQUIERE SERVICE ROLE PARA SEEDING REAL

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * 🕵️ QA Engineer Seeding Strategy - NexusReal Barinas
 * 
 * Este script recrea el escenario real de "THAIS VALERO" (Arrendadora) y "OLISMARY LACRUZ" (Arrendataria).
 * Sigue fielmente la estructura legal y de inventario definida en ContratoService.js.
 */

async function seedNexusRealBarinas() {
    console.log("🚀 Iniciando Seeding Especializado: Caso Thais Valero vs Olismary Lacruz...");

    // 1. Obtener contexto (Agente y Oficina activa)
    const { data: prop, error: errCtx } = await supabase
        .from('propiedades')
        .select('agente_id, oficina_id, organizacion_nombre')
        .limit(1)
        .maybeSingle();

    if (errCtx || !prop) {
        console.error("❌ Error: No hay contexto de oficina/agente. Por favor registra un usuario primero.");
        return;
    }

    const { agente_id, oficina_id, organizacion_nombre } = prop;

    // 2. Insertar Propiedad de Arrendamiento (Colinas de Campo Movil)
    console.log("🏠 Insertando Propiedad Crítica...");
    const { data: propiedad, error: errProp } = await supabase.from('propiedades').insert([{
        titulo: "Apartamento de Lujo - Res. Colinas de Campo Movil",
        precio: 250, // Canon USD
        zona: "Barinas, Alto Barinas",
        habitaciones: 1,
        banos: 1,
        metraje: 45,
        tipo_inmueble: 'Apartamento',
        tipo_operacion: 'Alquiler',
        descripcion: "Exclusivo apartamento tipo estudio, totalmente equipado con línea blanca de alta gama. Ubicado en la mejor zona de Barinas.",
        imagen_url: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=800&q=80",
        galeria: [
            "https://images.unsplash.com/photo-1574362848149-11496d93a7c7",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2"
        ],
        estado: 'disponible',
        agente_id: agente_id,
        oficina_id: oficina_id,
        organizacion_nombre: organizacion_nombre,
        whatsapp: '+584145201195',
        created_at: new Date().toISOString()
    }]).select().single();

    if (errProp) {
        console.error("❌ Error al insertar propiedad:", errProp);
        return;
    }

    // 3. Insertar Prospecto (Olismary Lacruz)
    console.log("👤 Insertando Prospecto (Arrendataria)...");
    const { data: prospecto, error: errPros } = await supabase.from('prospectos').insert([{
        nombre: "OLISMARY LACRUZ",
        cedula: "V-25.789.012",
        telefono: "+584141234567",
        correo: "olismary.lacruz@email.com",
        estado_civil: "SOLTERA",
        domicilio_actual: "Res. Barinas III, Torre A, Barinas",
        mensaje: "Interesada en el alquiler de Alto Barinas. ¿Aceptan mascotas pequeñas?",
        fuente: "Instagram",
        propiedad_id: propiedad.id,
        oficina_id: oficina_id,
        agente_id: agente_id,
        estado: 'contactado',
        created_at: new Date().toISOString()
    }]).select().single();

    if (errPros) {
        console.error("❌ Error al insertar prospecto:", errPros);
        return;
    }

    // 4. Insertar Contrato con Inventario Real (JSONB)
    console.log("📝 Generando Contrato y Cargando Inventario Tecnolam/Mabe...");

    const inventarioReal = [
        { item: "Cocina de tope", marca: "Tecnolam", estado: "Excelente" },
        { item: "Nevera", marca: "Mabe", estado: "Como nueva" },
        { item: "Campana", marca: "Challenger", estado: "Funcional" },
        { item: "Aire Acondicionado", marca: "LG", extras: "Con Control" },
        { item: "Televisor 21”", marca: "Samsung", extras: "Con Control" },
        { item: "Decodificador Directv", extras: "Con Control" },
        { item: "Cama matrimonial", extras: "Con Colchón" },
        { item: "Control Remoto Nova", cantidad: 1 },
        { item: "Muebles", cantidad: 2 }
    ];

    const { error: errCont } = await supabase.from('contratos').insert([{
        propiedad_id: propiedad.id,
        prospecto_id: prospecto.id,
        agente_id: agente_id,
        oficina_id: oficina_id,
        monto_usd: 250,
        monto_garantia: 500,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
        status: 'activo',
        // Inyección JSONB solicitada por QA
        datos_contrato: {
            propietario: {
                nombre: "THAIS EVILEE VALERO MARTINEZ",
                cedula: "V-13.062.283",
                domicilio: "COLINAS DE CAMPO MOVIL, Nº 21-14, BARINAS"
            },
            clausulas_especiales: [
                "No se permiten mascotas",
                "Apagar aire al salir",
                "Uso exclusivo vivienda"
            ],
            inventario_json: inventarioReal
        }
    }]);

    if (errCont) {
        console.error("❌ Error al insertar contrato:", errCont);
    } else {
        console.log("✅ Seeding completado con éxito.");
        console.log("🏠 Propiedad: Alto Barinas (Res. Colinas)");
        console.log("👤 Arrendataria: Olismary Lacruz");
        console.log("📝 Inventario Tecnolam/Mabe: Cargado en JSONB");
    }
}

seedNexusRealBarinas();
