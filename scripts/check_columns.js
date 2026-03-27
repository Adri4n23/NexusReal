import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bgqfakzcyejvbddbdape.supabase.co";
const SUPABASE_KEY = "sb_publishable_E5tzUn4nyMT3OVDUI0gghA_OfBWmbT_";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchema() {
    console.log("Checking Prospectos...");
    const { data: pros, error: errPros } = await supabase.from('prospectos').select('*').limit(1);
    if (errPros) console.error("Error prospectos:", errPros);
    else console.log("Prospectos keys:", pros.length > 0 ? Object.keys(pros[0]) : "Empty");

    console.log("\nChecking Contratos...");
    const { data: cont, error: errCont } = await supabase.from('contratos').select('*').limit(1);
    if (errCont) console.error("Error contratos:", errCont);
    else console.log("Contratos keys:", cont.length > 0 ? Object.keys(cont[0]) : "Empty");
}

checkSchema();
