-- ==========================================
-- NEXUSREAL HQ: MONITOR GLOBAL DE VENTAS
-- ==========================================

CREATE TABLE IF NOT EXISTS global_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event TEXT NOT NULL,
    agency TEXT,
    value DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Permitir que cualquier usuario autenticado registre métricas (para el monitor de ventas)
ALTER TABLE global_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nexus_Metrics_Insert" ON global_metrics;
CREATE POLICY "Nexus_Metrics_Insert" ON global_metrics 
FOR INSERT TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Nexus_Metrics_Select" ON global_metrics;
CREATE POLICY "Nexus_Metrics_Select" ON global_metrics 
FOR SELECT TO authenticated 
USING (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin');
