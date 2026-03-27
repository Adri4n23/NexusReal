import { supabase } from '../supabase';

/**
 * Servicio de Gestión de Favoritos (Específico del Agente).
 * Provee métodos para interactuar con la tabla favoritos_agente siguiendo 
 * el patrón de abstracción mandated por NexusReal.
 */
export const FavoritosService = {
  /**
   * Obtiene la lista de IDs de propiedades marcadas como favoritas por el usuario.
   * @param {string} user_id - UUID del agente.
   * @returns {Promise<Array<number>>} Lista de property_id.
   */
  async obtenerFavoritosIds(user_id) {
    if (!user_id) return [];
    
    const { data, error } = await supabase
      .from('favoritos_agente')
      .select('property_id')
      .eq('user_id', user_id);

    if (error) throw error;
    return data.map(item => item.property_id);
  },

  /**
   * Obtiene las propiedades completas marcadas como favoritas.
   * @param {string} user_id - UUID del agente.
   * @returns {Promise<Array>} Lista de objetos de propiedad.
   */
  async obtenerPropiedadesFavoritas(user_id) {
    if (!user_id) return [];

    const { data, error } = await supabase
      .from('favoritos_agente')
      .select(`
        property_id,
        propiedades (*)
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    // Mapeamos para devolver un array plano de propiedades
    return data.map(item => item.propiedades).filter(p => p !== null);
  },

  /**
   * Alterna (Toggle) el estado de favorito de una propiedad.
   * @param {string} user_id - UUID del agente.
   * @param {number} property_id - ID de la propiedad.
   * @param {boolean} es_favorito - Estado actual.
   * @returns {Promise<boolean>} El nuevo estado de favorito.
   */
  async toggleFavorito(user_id, property_id, es_favorito) {
    if (!user_id || !property_id) return false;

    if (es_favorito) {
      // Eliminar de favoritos
      const { error } = await supabase
        .from('favoritos_agente')
        .delete()
        .match({ user_id, property_id });
        
      if (error) throw error;
      return false;
    } else {
      // Agregar a favoritos (Upsert por seguridad del UNIQUE)
      const { error } = await supabase
        .from('favoritos_agente')
        .upsert({ user_id, property_id });

      if (error) throw error;
      return true;
    }
  }
};
