/**
 * @file Módulo de utilidades financieras para NexusReal.
 * @description Contiene funciones puras y optimizadas para cálculos de comisiones y conversión de moneda.
 * @author Tu Nombre / El Asistente
 */

// =============================================================================
// ERRORES PERSONALIZADOS
// =============================================================================

/**
 * Error personalizado para fallos en la obtención de la tasa de cambio.
 * Permite un manejo de errores más granular en la UI.
 */
export class RateFetchError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RateFetchError';
  }
}

// =============================================================================
// CACHÉ EN MEMORIA PARA LA TASA DE CAMBIO
// =============================================================================

/**
 * Cache en memoria para la tasa de cambio.
 * Previene llamadas excesivas a la base de datos para operaciones repetitivas.
 * @property {number|null} value - El último valor de la tasa conocido.
 * @property {number|null} timestamp - La marca de tiempo de cuándo se obtuvo el valor.
 * @property {number} TTL - Tiempo de vida del caché en milisegundos (5 minutos).
 */
const rateCache = {
  value: null,
  timestamp: null,
  TTL: 5 * 60 * 1000, // 5 minutos
};

// =============================================================================
// FUNCIONES AUXILIARES
// =============================================================================

/**
 * Redondea un número a dos decimales de forma segura para cálculos de moneda.
 * Utiliza Number.EPSILON para mitigar imprecisiones de punto flotante.
 * @param {number} num - El número a redondear.
 * @returns {number} El número redondeado a 2 decimales.
 */
function roundCurrency(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// =============================================================================
// LÓGICA DE NEGOCIO PRINCIPAL
// =============================================================================

/**
 * Calcula la comisión basada en un monto y un porcentaje.
 * Es una función pura, robusta y optimizada para cálculos financieros.
 * @param {number} amount - El monto total sobre el cual se calcula la comisión.
 * @param {number} percentage - El porcentaje de la comisión (ej: 5 para 5%).
 * @returns {number} El valor de la comisión calculado y redondeado.
 */
export function calculateCommission(amount, percentage) {
  // Validación defensiva: asegura que los inputs son números finitos.
  if (typeof amount !== 'number' || typeof percentage !== 'number' || !isFinite(amount) || !isFinite(percentage)) {
    return 0;
  }
  const commission = (amount * percentage) / 100;
  return roundCurrency(commission);
}

/**
 * Convierte un monto de USD a VES consultando la tasa más reciente.
 * Implementa un caché en memoria (TTL de 5 min) para optimizar llamadas sucesivas.
 * @param {number} amountUSD - El monto en USD a convertir.
 * @param {object} supabaseClient - Una instancia del cliente de Supabase.
 * @returns {Promise<number>} El monto equivalente en VES.
 * @throws {RateFetchError} Si no se puede obtener la tasa de cambio desde la base de datos.
 */
export async function convertUSDtoVES(amountUSD, supabaseClient) {
  if (typeof amountUSD !== 'number' || !isFinite(amountUSD)) {
    return 0;
  }

  const now = Date.now();
  // 1. Estrategia de Caché: Primero, intentar leer del caché.
  if (rateCache.value && rateCache.timestamp && (now - rateCache.timestamp < rateCache.TTL)) {
    const cachedAmount = amountUSD * rateCache.value;
    return roundCurrency(cachedAmount);
  }

  // 2. Fallback a la Base de Datos: Si el caché está vacío o expirado.
  const { data, error } = await supabaseClient
    .from('tasas_bcv')
    .select('valor')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Validación de la respuesta de la BD.
  if (error || !data || typeof data.valor !== 'number') {
    throw new RateFetchError('No se pudo obtener la tasa de cambio desde la base de datos.');
  }

  const rate = data.valor;

  // 3. Actualizar el caché para la próxima llamada.
  rateCache.value = rate;
  rateCache.timestamp = now;

  const amountVES = amountUSD * rate;
  return roundCurrency(amountVES);
}

/**
 * Función expuesta únicamente para propósitos de testing.
 * Permite limpiar el caché entre tests para asegurar un estado limpio.
 */
convertUSDtoVES.clearCache = () => {
  rateCache.value = null;
  rateCache.timestamp = null;
};
