# NexusReal - Guía Arquitectónica para Agentes de Desarrollo

Este documento establece los principios arquitectónicos y las reglas de oro para el desarrollo de la plataforma NexusReal. Su cumplimiento es mandatorio para mantener la coherencia, seguridad y escalabilidad del código.

---

## 1. Misión del Proyecto

**Nuestra misión es posicionar a NexusReal como la plataforma MLS (Multiple Listing Service) y CRM líder y de referencia para el sector inmobiliario en Venezuela.**

Esto implica construir una herramienta que no solo sea tecnológicamente robusta y segura, sino que también esté profundamente adaptada a las particularidades y necesidades del mercado local. Cada nueva funcionalidad debe ser evaluada bajo esta premisa: ¿Nos acerca más a ser la herramienta indispensable para el agente inmobiliario venezolano?

---

## 2. Principios y Reglas de Oro del Desarrollo

### Regla #1: Dualidad Monetaria (USD / VES) es Inmutable

Todo manejo de precios en la plataforma debe adherirse estrictamente a esta regla para reflejar la realidad del mercado venezolano.

- **Almacenamiento:** Todos los precios se almacenan en la base de datos en una única moneda: **USD**. Esta es nuestra fuente de verdad financiera.
- **Visualización:** La interfaz de usuario (frontend) es responsable de presentar **siempre** el precio en ambas monedas (USD y VES).
- **Cálculo:** La conversión a Bolívares (VES) debe realizarse en el momento de la visualización, utilizando la tasa de cambio vigente que provee el servicio central. **Nunca se debe almacenar el precio en VES en la base de datos.**

**Flujo Correcto:**
`Precio en USD (desde DB)` → `Tasa BCV (desde servicio)` → `Precio en VES (calculado en el componente)`

### Regla #2: Abstracción de Datos con Supabase

Para mantener un código limpio, seguro y fácil de refactorizar, todas las interacciones con la base de datos deben pasar por una capa de servicio.

- **Punto Único de Contacto:** El archivo `src/propiedadesService.js` (y futuros servicios) es el único lugar donde deben existir consultas directas a Supabase.
- **Prohibición:** Queda estrictamente prohibido realizar llamadas como `supabase.from(...)` directamente desde los componentes de React (`.jsx`).

**Ejemplo Práctico:**

```javascript
// MAL: ¡PROHIBIDO EN COMPONENTES!
const { data } = await supabase.from('propiedades').select('*');

// BIEN: Abstracción a través del servicio
const data = await propiedadesService.obtenerPropiedades();
```

### Regla #3: Documentación JSDoc es Obligatoria

Un código auto-documentado es clave para la velocidad de desarrollo y el onboarding de nuevos miembros al equipo. 

- **Mandato:** Toda nueva función, especialmente aquellas en los archivos de servicio (`*Service.js`), debe incluir un bloque de comentario **JSDoc** que describa su propósito, parámetros y lo que retorna.

**Ejemplo de Implementación:**

```javascript
/**
 * Obtiene una propiedad específica de la base de datos por su ID.
 * @param {string} id - El UUID de la propiedad a buscar.
 * @returns {Promise<object|null>} El objeto completo de la propiedad o null si no se encuentra.
 * @throws {Error} Si ocurre un error en la consulta a la base de datos.
 */
async obtenerPorId(id) {
  const { data, error } = await supabase.from('propiedades').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
```

---

## 3. La Fuente Única de Verdad (Single Source of Truth)

La estructura de nuestra base de datos es el pilar sobre el que se construye toda la aplicación. Es la autoridad final sobre los modelos de datos, sus tipos y sus relaciones.

Cualquier cambio en el modelo de datos (una nueva tabla, una columna modificada, una nueva política de seguridad RLS) debe ser documentado y actualizado primero en el archivo de esquema.

**Ubicación del Esquema:**

`./context/schema.sql`

Este archivo no es un simple documento; es el **plano arquitectónico de nuestros datos**. Sirve como referencia indispensable para cualquier desarrollador que necesite entender la estructura de la información que maneja NexusReal.

Regla de Automatización de Contratos: "Para NexusReal, al procesar contratos, prioriza la extracción de: Arrendador, Arrendatario, Monto de Garantía, Canon de Arrendamiento y la lista detallada del inventario. Usa el esquema de base de datos en /context/schema.sql para mapear estos campos a la tabla contratos.

El generador debe solicitar mediante un modal intermedio: abogado_nombre, abogado_ipsa, regla_llaves y los booleanos de restricciones. Ningún contrato debe generarse sin que estos campos estén validados