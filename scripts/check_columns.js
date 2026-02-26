import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bgqfakzcyejvbddbdape.supabase.co";
const SUPABASE_KEY = "sb_publishable_E5tzUn4nyMT3OVDUI0gghA_OfBWmbT_";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTasa() {
    const { data, error } = await supabase
        .from('historial_tasas')
        .select('*')
        .limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Datos de la tabla:");
        console.log(data);
    }
}

checkTasa();
