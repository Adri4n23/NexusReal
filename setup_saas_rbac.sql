-- ==========================================
-- NEXUSREAL SAAS: MOTOR DE ROLES Y PERMISOS (RBAC)
-- ==========================================

-- 1. ACTIVACIÓN DE RLS EN TABLAS CRÍTICAS
ALTER TABLE propiedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_registro ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones_pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizaciones ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA PROPIEDADES (EL CORAZÓN DEL NEGOCIO)
-- SELECT: Todos en la misma oficina pueden ver el inventario
DROP POLICY IF EXISTS "Nexus_Propiedades_Select" ON propiedades;
CREATE POLICY "Nexus_Propiedades_Select" ON propiedades
FOR SELECT TO authenticated
USING (
    (oficina_id = (auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::uuid)
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin')
);

-- ALL (CRUD): Agentes solo lo suyo, Owners todo lo de la oficina
DROP POLICY IF EXISTS "Nexus_Propiedades_Write" ON propiedades;
CREATE POLICY "Nexus_Propiedades_Write" ON propiedades
FOR ALL TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin')
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'owner' AND oficina_id = (auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::uuid)
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'agent' AND agente_id = auth.uid())
)
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin')
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'owner' AND oficina_id = (auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::uuid)
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'agent' AND agente_id = auth.uid())
);

-- 3. POLÍTICAS PARA VENTAS (SENSIDIBILIDAD FINANCIERA)
-- OWNER puede ver todas, AGENT solo las que él cerró
DROP POLICY IF EXISTS "Nexus_Ventas_Privacy" ON ventas_registro;
CREATE POLICY "Nexus_Ventas_Privacy" ON ventas_registro
FOR ALL TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin')
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'owner' AND oficina_id = (auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::uuid)
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'agent' AND agente_id = auth.uid())
);

-- 4. POLÍTICAS PARA SUSCRIPCIONES Y PAGOS
-- AGENT no tiene permiso aquí. OWNER gestiona sus pagos. SUPERADMIN aprueba.
DROP POLICY IF EXISTS "Nexus_Pagos_Control" ON suscripciones_pagos;
CREATE POLICY "Nexus_Pagos_Control" ON suscripciones_pagos
FOR ALL TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin')
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'owner' AND oficina_id = (auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::uuid)
)
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin')
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'owner' AND oficina_id = (auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::uuid)
);

-- 5. POLÍTICA DE GESTIÓN DE ORGANIZACIONES
-- Solo el OWNER de la agencia puede ver su propia configuración, y el SUPERADMIN todas.
DROP POLICY IF EXISTS "Nexus_Org_Management" ON organizaciones;
CREATE POLICY "Nexus_Org_Management" ON organizaciones
FOR ALL TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin')
    OR (id = (auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::uuid)
);

-- ==========================================
-- 6. FUNCIÓN DE SEGURIDAD PARA BYPASS (Opcional)
-- Para que tú como SUPERADMIN puedas editar metadatos de cualquier usuario
-- ==========================================
CREATE OR REPLACE FUNCTION promote_to_owner(target_user_id UUID, target_org_id UUID)
RETURNS void AS $$
BEGIN
  IF (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin') THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object('rol', 'owner', 'organizacion_id', target_org_id)
    WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Solo el SuperAdmin puede realizar esta acción.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
