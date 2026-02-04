-- CORRECCIÓN DEL SCRIPT PARA SUPABASE
-- Ejecuta esto en el SQL Editor para arreglar la tabla

-- 1. Asegurarnos que existan todos los campos base primero
alter table propiedades add column if not exists agente_id uuid;
alter table propiedades add column if not exists agente_nombre text;
alter table propiedades add column if not exists titulo text;
alter table propiedades add column if not exists precio numeric;
alter table propiedades add column if not exists habitaciones numeric;
alter table propiedades add column if not exists banos numeric;
alter table propiedades add column if not exists zona text;
alter table propiedades add column if not exists comision numeric;
alter table propiedades add column if not exists whatsapp text;
alter table propiedades add column if not exists imagen_url text;

-- 2. Agregar los campos nuevos de la Versión 2.0
alter table propiedades add column if not exists tipo_inmueble text default 'Apartamento';
alter table propiedades add column if not exists tipo_operacion text default 'Venta';
alter table propiedades add column if not exists descripcion text;
alter table propiedades add column if not exists estado text default 'disponible';
alter table propiedades add column if not exists precio_cierre numeric;
alter table propiedades add column if not exists fecha_cierre timestamp with time zone;
alter table propiedades add column if not exists agente_cierre text;

-- 3. Habilitar RLS (Seguridad) - Esto es seguro ejecutarlo varias veces
alter table propiedades enable row level security;

-- 4. Borrar políticas viejas para evitar conflictos y crear las nuevas
drop policy if exists "Propiedades son publicas" on propiedades;
create policy "Propiedades son publicas" on propiedades for select using ( true );

drop policy if exists "Usuarios pueden crear propiedades" on propiedades;
create policy "Usuarios pueden crear propiedades" on propiedades for insert with check ( auth.role() = 'authenticated' );

drop policy if exists "Solo dueño edita su propiedad" on propiedades;
create policy "Solo dueño edita su propiedad" on propiedades for update using ( auth.uid() = agente_id );

-- 5. Configuración de Storage (Fotos)
insert into storage.buckets (id, name, public)
values ('fotos_propiedades', 'fotos_propiedades', true)
on conflict (id) do update set public = true;

drop policy if exists "Fotos Publicas" on storage.objects;
create policy "Fotos Publicas" on storage.objects for select using ( bucket_id = 'fotos_propiedades' );

drop policy if exists "Usuarios suben fotos" on storage.objects;
create policy "Usuarios suben fotos" on storage.objects for insert with check ( bucket_id = 'fotos_propiedades' and auth.role() = 'authenticated' );
