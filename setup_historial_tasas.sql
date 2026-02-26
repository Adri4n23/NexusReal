-- TABLA DE HISTORIAL DE TASAS (BCV)
CREATE TABLE IF NOT EXISTS historial_tasas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    valor DECIMAL(10,2) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Permitir inserción desde el script de scraping
ALTER TABLE historial_tasas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Servicio_Scraping_Insert" ON historial_tasas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Publico_Ver_Tasas" ON historial_tasas FOR SELECT TO anon USING (true);
