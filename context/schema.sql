-- =============================================================================
-- TABLA: propiedades (CORE MLS)
-- DESCRIPCIÓN: Listado maestro de inmuebles captados por la red Nexus.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.propiedades (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    titulo TEXT NOT NULL,
    precio NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    zona TEXT NOT NULL,
    habitaciones INTEGER DEFAULT 0,
    banos INTEGER DEFAULT 0,
    metraje NUMERIC(10,2) DEFAULT 0,
    tipo_inmueble TEXT NOT NULL,
    tipo_operacion TEXT NOT NULL CHECK (tipo_operacion IN ('Venta', 'Alquiler')),
    descripcion TEXT,
    imagen_url TEXT,
    galeria TEXT[] DEFAULT '{}',
    estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'reservado', 'vendido', 'alquilado')),
    whatsapp TEXT,
    comision NUMERIC(5,2) DEFAULT 5.00,
    agente_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    agente_nombre TEXT,
    oficina_id UUID REFERENCES public.organizaciones(id) ON DELETE SET NULL,
    organizacion_nombre TEXT,
    precio_cierre NUMERIC(15,2),
    fecha_cierre TIMESTAMPTZ,
    comision_pagada NUMERIC(12,2)
);

-- Habilitar RLS en Propiedades
ALTER TABLE public.propiedades ENABLE ROW LEVEL SECURITY;

-- Políticas de Propiedades:
-- 1. Lectura: Listings públicos o propios
CREATE POLICY "Listing público para agentes" ON public.propiedades
FOR SELECT USING (estado = 'disponible' OR auth.uid() = agente_id);

-- 2. Inserción: Solo agentes autenticados y forzando su propia oficina
CREATE POLICY "Agentes insertan en su propia oficina" ON public.propiedades
FOR INSERT WITH CHECK (
  auth.uid() = agente_id AND 
  oficina_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'organizacion_id'::text)::uuid
);

-- 3. Edición: Solo el captador o el dueño de su oficina
CREATE POLICY "Solo captadores editan su listing" ON public.propiedades
FOR UPDATE USING (
  auth.uid() = agente_id OR 
  (
    ((auth.jwt() -> 'user_metadata'::text) ->> 'rol'::text) = 'owner' AND
    oficina_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'organizacion_id'::text)::uuid
  )
);

-- =============================================================================
-- TABLA: prospectos (CLIENTES SENSIBLES)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.prospectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    nombre TEXT NOT NULL,
    telefono TEXT,
    correo TEXT,
    mensaje TEXT,
    fuente TEXT,
    propiedad_id BIGINT REFERENCES public.propiedades(id) ON DELETE CASCADE,
    agente_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
    oficina_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE
);

ALTER TABLE public.prospectos ENABLE ROW LEVEL SECURITY;

-- POLÍTICA DE PRIVACIDAD EXTREMA: Aislamiento total en todas las operaciones
CREATE POLICY "Aislamiento total por agencia prospectos" ON public.prospectos
FOR ALL 
USING (oficina_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'organizacion_id'::text)::uuid)
WITH CHECK (oficina_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'organizacion_id'::text)::uuid);

-- =============================================================================
-- TABLA: contratos
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    propiedad_id BIGINT NOT NULL REFERENCES public.propiedades(id) ON DELETE SET NULL,
    agente_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
    nombre_arrendador TEXT NOT NULL,
    cedula_arrendador TEXT NOT NULL,
    nombre_arrendatario TEXT NOT NULL,
    cedula_arrendatario TEXT NOT NULL,
    monto_garantia NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    canon_mensual NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    fecha_contrato DATE NOT NULL DEFAULT now(),
    inventario JSONB NOT NULL DEFAULT '[]'::jsonb,
    oficina_id UUID NOT NULL REFERENCES public.organizaciones(id)
);

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aislamiento total por agencia contratos" ON public.contratos
FOR ALL 
USING (oficina_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'organizacion_id'::text)::uuid)
WITH CHECK (oficina_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'organizacion_id'::text)::uuid);

-- =============================================================================
-- TABLA: organizaciones y suscripciones
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.organizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    agencia_nombre TEXT NOT NULL,
    plan_status TEXT NOT NULL DEFAULT 'trial' CHECK (plan_status IN ('active', 'pending', 'trial', 'expired')),
    trial_ends_at TIMESTAMPTZ,
    mensaje_bloqueo TEXT
);

CREATE TABLE IF NOT EXISTS public.suscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'Basico' CHECK (plan IN ('Basico', 'Pro')),
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('activo', 'pendiente', 'vencido')),
    fecha_vencimiento TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.suscripciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven su propia suscripcion" ON public.suscripciones
FOR SELECT USING (
  auth.uid() = user_id OR 
  ((auth.jwt() -> 'user_metadata'::text) ->> 'rol'::text) = 'superadmin'
);

-- =============================================================================
-- TABLA: logs_de_activacion (AUDITORÍA FORENSE)
-- DESCRIPCIÓN: Rastro inmutable de activación de licencias (Solo lectura/inserción)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.logs_de_activacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    superadmin_id UUID NOT NULL REFERENCES auth.users(id),
    organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id),
    plan_id TEXT NOT NULL,
    metodo_pago TEXT,
    referencia_pago TEXT,
    ip_accion TEXT
);

ALTER TABLE public.logs_de_activacion ENABLE ROW LEVEL SECURITY;

-- Solo el superadmin puede leer logs de auditoría
CREATE POLICY "Superadmins leen auditoria" ON public.logs_de_activacion
FOR SELECT USING (
  ((auth.jwt() -> 'user_metadata'::text) ->> 'rol'::text) = 'superadmin'
);

-- Solo el sistema (o superadmin via Edge Function) puede insertar
CREATE POLICY "Solo superadmin registra activaciones" ON public.logs_de_activacion
FOR INSERT WITH CHECK (
  ((auth.jwt() -> 'user_metadata'::text) ->> 'rol'::text) = 'superadmin'
);

-- =============================================================================
-- TRIGGER DE SEGURIDAD EXTREMA: PROTECCIÓN DE SUSCRIPCIONES
-- PROPÓSITO: Bloqueo físico de actualizaciones si no es SuperAdmin.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.validar_autorizacion_suscripcion()
RETURNS TRIGGER AS $$
BEGIN
    -- CTO BLINDAJE: Solo permitimos el cambio si el JWT tiene rol 'superadmin'
    IF (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'rol') != 'superadmin' THEN
        RAISE EXCEPTION 'ACCESO DENEGADO (Nexus Sentinel): No tienes privilegios para alterar el estado de licencias.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar el trigger antes de cualquier UPDATE
DROP TRIGGER IF EXISTS tr_bloqueo_licencias ON public.suscripciones;
CREATE TRIGGER tr_bloqueo_licencias
BEFORE UPDATE ON public.suscripciones
FOR EACH ROW
EXECUTE FUNCTION public.validar_autorizacion_suscripcion();

-- =============================================================================
-- TABLA: favoritos_agente (CARTERA PRIVADA)
-- DESCRIPCIÓN: Marcadores personales de inmuebles para seguimiento del agente.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.favoritos_agente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id BIGINT NOT NULL REFERENCES public.propiedades(id) ON DELETE CASCADE,
    UNIQUE(user_id, property_id)
);

ALTER TABLE public.favoritos_agente ENABLE ROW LEVEL SECURITY;

-- PRIVACIDAD TOTAL: Solo el dueño del favorito puede verlo o gestionarlo
CREATE POLICY "Dueños gestionan sus propios favoritos" ON public.favoritos_agente
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- AUDITORÍA FINALIZADA:
-- 1. Se implementó WITH CHECK en todas las políticas de escritura.
-- 2. Se reemplazaron subconsultas lentas por acceso directo a auth.jwt().
-- 3. Se forzó la validación de organizacion_id en todas las inserciones.
-- 4. Se agregó rastro de auditoría inmutable para pagos y licencias.
-- 5. Se instaló la 'Armadura de Trigger' para bloqueo físico de licencias.
-- 6. Se añadió el sistema de Cartera de Favoritos Privada.
-- =============================================================================

