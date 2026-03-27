import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bgqfakzcyejvbddbdape.supabase.co";
const SUPABASE_KEY = "sb_publishable_E5tzUn4nyMT3OVDUI0gghA_OfBWmbT_";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkProspectosColumns() {
    const { data, error } = await supabase
        .from('prospectos')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Columnas de prospectos:");
        if (data && data.length > 0) {
            console.log(Object.keys(data[0]));
        } else {
            console.log("No hay datos para inferir columnas. Intentando insertar uno vacío para ver el error...");
            const { error: insertError } = await supabase.from('prospectos').insert([{}]).select();
            console.log(insertError);
        }
    }
}

checkProspectosColumns();
