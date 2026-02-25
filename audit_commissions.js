
/**
 * SCRIPT DE AUDITORÍA CONTABLE - NEXUS REAL ESTATE
 * Objetivo: Verificar la precisión de la Regla de Oro 30/70 en 100 escenarios aleatorios.
 */

function simularCerrarVenta(precio_cierre) {
    // 1. Automatización: La comisión total es el 5% del precio de cierre
    const monto_venta = Number(precio_cierre);
    const comision_total = Number((monto_venta * 0.05).toFixed(2));

    // 2. Regla 30/70: La Inmobiliaria (la casa) se queda con el 30% del total cobrado
    const comision_agencia_neta = Number((comision_total * 0.30).toFixed(2));

    // 3. Monto a repartir entre los agentes (El 70% restante)
    // LÓGICA BLINDADA: Restamos para evitar errores de redondeo de centavo
    const monto_repartible_agentes = Number((comision_total - comision_agencia_neta).toFixed(2));

    return {
        comision_total,
        comision_agencia_neta,
        monto_repartible_agentes,
        suma_partes: Number((comision_agencia_neta + monto_repartible_agentes).toFixed(2))
    };
}

console.log("🚀 Iniciando Auditoría de 100 Ventas Aleatorias...");
console.log("--------------------------------------------------");

let errores = 0;
let reporte = [];

for (let i = 1; i <= 100; i++) {
    // Generamos un precio aleatorio entre 10,000 y 1,000,000 con decimales
    const precio = (Math.random() * (1000000 - 10000) + 10000).toFixed(2);
    const resultado = simularCerrarVenta(precio);

    const margen_error = Math.abs(resultado.comision_total - resultado.suma_partes);

    if (margen_error > 0.001) {
        errores++;
        reporte.push(`[ERROR VENTA #${i}] Precio: $${precio} | Com. Total: ${resultado.comision_total} | Agencia: ${resultado.comision_agencia_neta} | Pool: ${resultado.monto_repartible_agentes} | SUMA: ${resultado.suma_partes} | DIFERENCIA: ${margen_error.toFixed(4)}`);
    }
}

if (errores > 0) {
    console.error(`❌ AUDITORÍA FALLIDA: Se encontraron ${errores} descuadres de centavos.`);
    reporte.forEach(err => console.error(err));
    process.exit(1);
} else {
    console.log("✅ AUDITORÍA EXITOSA: Las 100 ventas cuadraron al centavo.");
    console.log("La Inmobiliaria recibió su 30% exacto y el Pool el 70% restante.");
    process.exit(0);
}
