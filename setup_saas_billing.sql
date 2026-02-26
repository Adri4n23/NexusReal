-- ==========================================
-- NEXUSREAL SAAS: MOTOR DE LICENCIAS Y PAGOS
-- ==========================================

-- 1. Asegurar columnas en Organizaciones
ALTER TABLE organizaciones ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'active'; 
ALTER TABLE organizaciones ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days');
ALTER TABLE organizaciones ADD COLUMN IF NOT EXISTS mensaje_bloqueo TEXT DEFAULT 'Tu licencia ha expirado. Por favor, realiza el pago de renovación para continuar usando NexusReal.';

-- 2. Tabla de Auditoría de Pagos (El Muro de Verificación)
CREATE TABLE IF NOT EXISTS suscripciones_pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oficina_id UUID REFERENCES organizaciones(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL,
    monto DECIMAL(10,2) NOT NULL DEFAULT 30.00,
    metodo TEXT NOT NULL, -- 'zelle', 'pago_movil', 'stripe'
    comprobante_url TEXT,
    status TEXT DEFAULT 'pendiente', -- pendiente, aprobado, rechazado
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Índices de Búsqueda Rápida
CREATE INDEX IF NOT EXISTS idx_pagos_status ON suscripciones_pagos(status);
CREATE INDEX IF NOT EXISTS idx_pagos_oficina_date ON suscripciones_pagos(oficina_id, created_at DESC);

-- 4. Notificaciones de Sistema Automáticas
-- Esto asegura que el SuperAdmin sepa cuándo hay plata que revisar
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 5. RLS para Pagos (Solo dueños de organización pueden ver sus pagos)
ALTER TABLE suscripciones_pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nexus_SaaS_Ver_Pagos" ON suscripciones_pagos;
CREATE POLICY "Nexus_SaaS_Ver_Pagos" ON suscripciones_pagos
FOR SELECT TO authenticated
USING (
    (oficina_id = (auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::uuid)
    OR (auth.jwt() -> 'user_metadata' ->> 'rol' = 'superadmin')
);

DROP POLICY IF EXISTS "Nexus_SaaS_Insertar_Pagos" ON suscripciones_pagos;
CREATE POLICY "Nexus_SaaS_Insertar_Pagos" ON suscripciones_pagos
FOR INSERT TO authenticated
WITH CHECK (
    (oficina_id = (auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::uuid)
);
