-- ==========================================
-- NEXUSREAL SAAS ENGINE: MULTI-TENANT ARCHITECTURE
-- ==========================================

-- 1. Extensión de Columnas de Privacidad
ALTER TABLE propiedades ADD COLUMN IF NOT EXISTS oficina_id UUID;
ALTER TABLE ventas_registro ADD COLUMN IF NOT EXISTS oficina_id UUID;
ALTER TABLE prospectos ADD COLUMN IF NOT EXISTS oficina_id UUID;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS oficina_id UUID;
ALTER TABLE ventas_agentes_comision ADD COLUMN IF NOT EXISTS oficina_id UUID;

-- 2. Índices de Rendimiento para el Muro
CREATE INDEX IF NOT EXISTS idx_propiedades_oficina ON propiedades(oficina_id);
CREATE INDEX IF NOT EXISTS idx_ventas_oficina ON ventas_registro(oficina_id);
CREATE INDEX IF NOT EXISTS idx_prospectos_oficina ON prospectos(oficina_id);

-- 3. Activación de Seguridad Extrema (RLS)
ALTER TABLE propiedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_registro ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACCESO (EL MURO)

-- A. Propiedades
DROP POLICY IF EXISTS "Nexus_MultiTenant_Propiedades" ON propiedades;
CREATE POLICY "Nexus_MultiTenant_Propiedades" ON propiedades
FOR ALL TO authenticated
USING (
    (oficina_id = (auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::uuid)
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin')
)
WITH CHECK (
    (oficina_id = (auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::uuid)
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin')
);

-- B. Prospectos (CRM Privado)
DROP POLICY IF EXISTS "Nexus_MultiTenant_Prospectos" ON prospectos;
CREATE POLICY "Nexus_MultiTenant_Prospectos" ON prospectos
FOR ALL TO authenticated
USING (
    (oficina_id = (auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::uuid)
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin')
);

-- C. Registro de Ventas (Solo Dueños y SuperAdmin)
DROP POLICY IF EXISTS "Nexus_MultiTenant_Ventas" ON ventas_registro;
CREATE POLICY "Nexus_MultiTenant_Ventas" ON ventas_registro
FOR ALL TO authenticated
USING (
    ((oficina_id = (auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::uuid) 
     AND (auth.jwt() -> 'user_metadata' ->> 'rol' IN ('admin', 'owner')))
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin')
);

-- D. Notificaciones
DROP POLICY IF EXISTS "Nexus_MultiTenant_Notificaciones" ON notificaciones;
CREATE POLICY "Nexus_MultiTenant_Notificaciones" ON notificaciones
FOR ALL TO authenticated
USING (
    (oficina_id = (auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::uuid)
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin')
);

-- ==========================================
-- 5. Función de Auditoría para SuperAdmin (Opcional)
-- Para que el SuperAdmin pueda ver quién pertenece a qué sin RLS
-- ==========================================
CREATE OR REPLACE VIEW superadmin_overview AS
SELECT 
    o.nombre as agencia,
    count(p.id) as total_propiedades,
    count(v.id) as total_ventas
FROM organizaciones o
LEFT JOIN propiedades p ON p.oficina_id = o.id
LEFT JOIN ventas_registro v ON v.oficina_id = o.id
GROUP BY o.nombre;
