import { supabase } from '../supabase';

/**
 * BCVService: Motor de Moneda de NexusReal
 * Centraliza la obtención y sincronización de la tasa oficial del BCV.
 * Incluye blindaje para fallos de conexión (Caché Offline).
 */
export const BCVService = {

    /**
     * Obtiene la tasa oficial más reciente.
     * Prioriza la base de datos y usa localStorage como fallback para conexiones 3G/Lentas.
     */
    async obtenerTasaOficial() {
        try {
            const { data, error } = await supabase
                .from('historial_tasas')
                .select('valor')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.warn("Nexus BCV: Error de DB, recurriendo a caché local.");
                return this.obtenerTasaCache();
            }

            // Sincronizamos el caché con el valor más fresco
            localStorage.setItem('nexus_tasa_cache', data.valor.toString());
            return data.valor;
        } catch (e) {
            console.error("Nexus BCV Fallback:", e);
            return this.obtenerTasaCache();
        }
    },

    /**
     * Fallback de seguridad para asegurar que la app nunca muestre 0 o error en precios.
     */
    obtenerTasaCache() {
        const cache = localStorage.getItem('nexus_tasa_cache');
        return cache ? parseFloat(cache) : 48.50; // Valor de seguridad (Hardcoded Fallback)
    },

    /**
     * Suscripción en Tiempo Real (WebSockets).
     * Permite que toda la agencia vea el cambio de precio al instante sin refrescar.
     */
    subscribirseATasa(onUpdate) {
        return supabase
            .channel('cambios-tasa-bcv')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'historial_tasas' },
                (payload) => {
                    const nuevaTasa = payload.new.valor;
                    localStorage.setItem('nexus_tasa_cache', nuevaTasa.toString());
                    onUpdate(nuevaTasa);
                }
            )
            .subscribe();
    }
};
