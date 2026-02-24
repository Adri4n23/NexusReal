-- V3: ACTUALIZACIÓN PARA CHECKLIST DE ALTO VALOR
-- Ejecuta esto en Supabase para agregar los nuevos campos necesarios

-- 1. Agregar campos de Ficha Técnica y Geolocalización
alter table propiedades add column if not exists metraje numeric; -- Para m2
alter table propiedades add column if not exists mapa_url text; -- Para Link de Google Maps

-- 2. Asegurarnos que existan los campos de Cierre (si no se crearon antes)
alter table propiedades add column if not exists precio_cierre numeric;
alter table propiedades add column if not exists fecha_cierre timestamp with time zone;
alter table propiedades add column if not exists agente_cierre text;

-- 3. (Opcional) Si quisiéramos galería en el futuro, usaríamos un array, pero por ahora mantenemos imagen_url simple
-- alter table propiedades add column if not exists galeria text[]; 
