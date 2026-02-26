-- CORRECCIÓN DE POLÍTICAS DE HISTORIAL DE TASAS
-- Necesitamos que tanto visitantes (anon) como usuarios (authenticated) puedan ver y guardar tasas
-- Especialmente el SuperAdmin (authenticated) al usar el panel de ajuste manual.

DROP POLICY IF EXISTS "Servicio_Scraping_Insert" ON historial_tasas;
CREATE POLICY "Nexus_Tasas_Insert" ON historial_tasas 
FOR INSERT TO authenticated, anon 
WITH CHECK (true);

DROP POLICY IF EXISTS "Publico_Ver_Tasas" ON historial_tasas;
CREATE POLICY "Nexus_Tasas_Select" ON historial_tasas 
FOR SELECT TO authenticated, anon 
USING (true);
