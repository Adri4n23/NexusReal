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

  async actualizar(id, datos) {
    const { error } = await supabase.from('propiedades').update(datos).eq('id', id);
    if (error) throw error;
  },

  async subirFoto(file) {
    // Generamos un nombre único para evitar conflictos
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('fotos_propiedades')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('fotos_propiedades')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }
};