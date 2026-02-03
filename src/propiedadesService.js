import { supabase } from './supabase';

export const propiedadesService = {
  async obtenerTodas() {
    const { data, error } = await supabase.from('propiedades').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async crear(datos, usuario) {
    const { error } = await supabase.from('propiedades').insert([{
      ...datos,
      agente_nombre: usuario.user_metadata?.nombre || usuario.email,
      agente_id: usuario.id
    }]);
    if (error) throw error;
  },

  async eliminar(id) {
    const { error } = await supabase.from('propiedades').delete().eq('id', id);
    if (error) throw error;
  },

  async subirFoto(file) {
    const nombreArchivo = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('fotos_propiedades').upload(nombreArchivo, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('fotos_propiedades').getPublicUrl(nombreArchivo);
    return publicUrl;
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { ...data.user, rol: data.user.user_metadata?.rol || 'Agente' };
  },

  async logout() { await supabase.auth.signOut(); },

  async obtenerUsuario() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return { ...user, rol: user.user_metadata?.rol || 'Agente' };
  }
};