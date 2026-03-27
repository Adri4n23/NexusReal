import { supabase } from '../supabase';
import { BCVService } from './BCVService';
import { propiedadesService } from '../propiedadesService';

export const ContratoService = {
    /**
     * INYECTOR DE DATOS: Obtiene y estructura toda la información basándose en las variables críticas
     */
    async obtenerDatosParaContrato(propiedadId, prospectoId, duracionMeses = 6, datos_wizard = null) {
        try {
            // Validacion de Licencia Pro (Security by Design)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const licencia = await propiedadesService.verificar_suscripcion_agente(user.id);
                if (licencia.status !== 'activo') {
                    throw new Error("LICENCIA_REQUERIDA: Necesitas una Licencia Pro activa para usar el Generador de Contratos.");
                }
            }

            // 1. Obtener prospecto (Arrendatario)
            const { data: prospecto, error: errPros } = await supabase
                .from('prospectos')
                .select('*')
                .eq('id', prospectoId)
                .single();

            if (errPros) throw errPros;

            // 2. Obtener propiedad (Inmueble)
            const { data: propiedad, error: errProp } = await supabase
                .from('propiedades')
                .select('*')
                .eq('id', propiedadId)
                .single();

            if (errProp) throw errProp;

            // Motor Financiero Dual - Sincronización
            const tasa_bcv_aplicada = await BCVService.obtenerTasaOficial();
            
            // Ubicación y Temporalidad
            const fechaActual = new Date();
            const fechaFin = new Date();
            fechaFin.setMonth(fechaFin.getMonth() + duracionMeses);

            const mesesTexto = duracionMeses === 12 ? "UN (01) AÑO" : "SEIS (06) MESES";

            // Formateo de fechas para el texto legal
            const opcionesFecha = { day: '2-digit', month: 'long', year: 'numeric' };
            const fecha_suscripcion = fechaActual.toLocaleDateString('es-VE', opcionesFecha).toUpperCase();
            const fecha_fin_contrato = fechaFin.toLocaleDateString('es-VE', opcionesFecha).toUpperCase();

            // Cálculos financieros usando la Regla #1 (Dualidad Inmutable)
            const canon_mensual_usd = propiedad.precio || 0;
            const deposito_garantia_usd = canon_mensual_usd * 2; // Por defecto 2 meses
            const canon_mensual_ves = (canon_mensual_usd * tasa_bcv_aplicada).toLocaleString('es-VE', { minimumFractionDigits: 2 });
            const deposito_garantia_ves = (deposito_garantia_usd * tasa_bcv_aplicada).toLocaleString('es-VE', { minimumFractionDigits: 2 });

            return {
                // 1. Identidad de las Partes
                arrendador_nombre: propiedad.propietario_nombre || "THAIS EVILEE VALERO MARTINEZ", // Adaptable caso específico
                arrendador_ci: propiedad.propietario_cedula || "V.-13.062.283",
                arrendatario_nombre: (prospecto.nombre || "NOMBRE NO REGISTRADO").toUpperCase(),
                arrendatario_ci: prospecto.cedula || "V-00.000.000",
                abogado_nombre: datos_wizard?.abogado_nombre || "ABOGADO DE GUARDIA",
                abogado_ipsa: datos_wizard?.abogado_ipsa || "000.000",

                // 2. Ubicación y Temporalidad
                ciudad_contrato: "BARINAS",
                estado_contrato: "BARINAS",
                direccion_exacta: (datos_wizard?.direccion_exacta || propiedad.zona || "CONJUNTO RESIDENCIAL COLINAS DE CAMPO MOVIL, Nº 21-14, CALLE 1").toUpperCase(),
                fecha_suscripcion: fecha_suscripcion,
                duracion_contrato: mesesTexto,
                fecha_fin_contrato: fecha_fin_contrato,

                // 3. Motor Financiero Dual
                deposito_garantia_usd: deposito_garantia_usd,
                canon_mensual_usd: canon_mensual_usd,
                tasa_bcv_aplicada: tasa_bcv_aplicada,
                canon_mensual_ves: canon_mensual_ves,
                deposito_garantia_ves: deposito_garantia_ves, // Variable derivada extra
                dia_cobro: "05",

                // 4. Inventario Detallado (Estructura JSONB)
                // En el futuro vendrá de "propiedad.inventario" de Supabase
                lista_equipos: propiedad.inventario || [
                    { cantidad: 1, item: "Cocina de tope", marca: "Tecnolam", estado: "Bueno" },
                    { cantidad: 1, item: "Nevera", marca: "Mabe", estado: "Nuevo" },
                    { cantidad: 1, item: "Cama matrimonial con colchón", marca: "Genérica", estado: "Usado" }
                ],

                // 5. Normas de Convivencia (Inyección Dinámica prioritaria)
                restricciones: datos_wizard?.restricciones || {
                    mascotas: false,
                    fiestas: false,
                    ruidos: false
                },
                reglas_acceso: datos_wizard?.reglas_llaves || "Mantener el portón y la puerta cerradas con llaves. El portón eléctrico se utilizará solo para la entrada de vehículos.",

                // Extras útiles mapeados del diseño original
                estado_civil_arrendatario: (prospecto.estado_civil || "SOLTERA").toUpperCase(),
                tipo_inmueble: (propiedad.tipo_inmueble || "APARTAMENTO").toUpperCase(),
                descripcion_ambientes: `${propiedad.habitaciones} HABITACIONES, ${propiedad.banos} BAÑOS, SALA, COCINA Y COMEDOR`,
                dia_firma: fechaActual.getDate(),
                mes_firma: fechaActual.toLocaleString('es-VE', { month: 'long' }).toUpperCase(),
                año_firma: fechaActual.getFullYear(),
                numero_referencia: Math.floor(Math.random() * 1000).toString().padStart(4, '0')
            };
        } catch (error) {
            console.error("Error inyectando datos de contrato:", error);
            throw error;
        }
    },

    /**
     * DOCUMENTO 1: CONTRATO DE ARRENDAMIENTO
     */
    generarCuerpoContrato(datos) {
        return `
CONTRATO DE ARRENDAMIENTO

ENTRE EL CIUDADANO(A) ${datos.arrendador_nombre}, VENEZOLANO(A), MAYOR DE EDAD, TITULAR DE LA CEDULA DE IDENTIDAD ${datos.arrendador_ci}, DE ESTE DOMICILIO Y CIVILMENTE HABIL, QUIEN EN LO SUCESIVO Y EN LOS EFECTOS DE ESTE CONTRATO SE DENOMINARÁ “EL ARRENDADOR”, POR UNA PARTE, Y POR LA OTRA, EL/LA CIUDADANO(A) ${datos.arrendatario_nombre}, VENEZOLANO(A), MAYOR DE EDAD, ${datos.estado_civil_arrendatario}, TITULAR DE LA CEDULA DE IDENTIDAD NUMERO ${datos.arrendatario_ci}, DEL MISMO DOMICILIO Y CIVILMENTE HABIL, QUIEN A LOS MISMOS EFECTOS DE ESTE CONTRATO SE DENOMINARÁ “EL ARRENDATARIO” SE HA CONVENIDO CELEBRAR COMO EN EFECTO SE CELEBRA EL SIGUIENTE CONTRATO DE ARRENDAMIENTO.

PRIMERA: “EL ARRENDADOR” DA EN ARRENDAMIENTO A “EL ARRENDATARIO” UN INMUEBLE CONSISTENTE EN UN (01) ${datos.tipo_inmueble} EL CUAL FORMA PARTE INTEGRANTE DE UNA VIVIENDA UBICADA EN: ${datos.direccion_exacta}, ESTADO ${datos.estado_contrato}, CONSTITUIDO POR ${datos.descripcion_ambientes} Y LOS BIENES MUEBLES IDENTIFICADOS EN EL INVENTARIO ANEXO.

SEGUNDA: EL INMUEBLE ANTES DESCRITO SERA EXCLUSIVAMENTE PARA SER USADO COMO VIVIENDA NO PUDIENDO TENER OTRO USO DISTINTO AL MISMO.

TERCERA: EL CANON DE ARRENDAMIENTO MENSUAL LO HEMOS CONVENIDO DE MUTUO ACUERDO POR LA CANTIDAD DE ${datos.canon_mensual_usd} DOLARES AMERICANOS (${datos.canon_mensual_usd} USD), EQUIVALENTES A Bs. ${datos.canon_mensual_ves} SEGÚN LA TASA OFICIAL DEL BCV AL MOMENTO DEL PAGO, DE FORMA ADELANTADA LOS DIAS ${datos.dia_cobro} DE CADA MES Y HASTA EL TERMINO DEL CONTRATO. “EL ARRENDADOR” DECLARA RECIBIR ${datos.deposito_garantia_usd} USD (EQUIVALENTES A Bs. ${datos.deposito_garantia_ves}) EN CALIDAD DE DEPOSITO DE GARANTÍA, NO IMPUTABLES AL CANON DE ARRENDAMIENTO YA QUE ESTÁN DESTINADOS A GARANTIZAR EL FIEL CUMPLIMIENTO DE ESTE CONTRATO Y EL BUEN ESTADO DEL INMUEBLE, SUS ACCESORIOS Y TODOS LOS BIENES DESCRITOS EN EL INVENTARIO. EL MONTO SERA DEVUELTO AL FINALIZAR EL CONTRATO PREVIA DEDUCCIÓN DE LOS DAÑOS Y PERJUICIOS SI LOS HUBIERE.

CUARTA: “EL ARRENDATARIO” DECLARA QUE RECIBE EL PRESENTE INMUEBLE ARRENDADO Y LOS BIENES MUEBLES DESCRITOS EN PERFECTO ESTADO Y SE OBLIGA A ENTREGARLO A LA FINALIZACIÓN DEL PRESENTE CONTRATO EN IGUALES CONDICIONES.

QUINTA: LA DURACIÓN DEL PRESENTE CONTRATO SERÁ DE ${datos.duracion_contrato} FIJOS, CONTADOS A PARTIR DEL ${datos.fecha_suscripcion} HASTA EL ${datos.fecha_fin_contrato}, PUDIENDO SER PRORROGABLE. EL HECHO DE NO PRECEDER LA DESOCUPACIÓN NO IMPLICA TÁCITA RECONDUCCIÓN AL TÉRMINO.

SEXTA: “EL ARRENDATARIO” SE OBLIGA A NO HACER MODIFICACIONES, ALTERACIONES, NI MEJORAS DE NINGUN GÉNERO EN EL INMUEBLE ARRENDADO, SIN CONSENTIMIENTO POR ESCRITO DE “EL ARRENDADOR”.

SEPTIMA: A LOS FINES DE VIGILANCIA E INSPECCIÓN DEL INMUEBLE “EL ARRENDADOR” SE RESERVA EL DERECHO DE VISITARLO PREVIO AVISO Y DETERMINAR DAÑOS QUE DEBAN SER REPARADOS.

OCTAVA: “EL ARRENDATARIO” ASUME LA RESPONSABILIDAD POR LOS DAÑOS QUE PUEDAN SOBREVENIR POR FALTA DE NOTIFICACIÓN OPORTUNA SOBRE NECESIDADES DE REPARACIÓN MAYOR.

NOVENA: LOS GASTOS REFERIDOS A ENERGIA ELECTRICA, GAS, INTERNET, AGUA Y ASEO SERÁN REGULADOS SEGÚN LOS ACUERDOS PRIVADOS PREVIAMENTE ESTABLECIDOS ENTRE LAS PARTES.

DECIMA: COMO QUIERA QUE ESTE CONTRATO SE HA CELEBRADO INTUITU PERSONAE, QUEDA CONVENIDO QUE “EL ARRENDATARIO” NO PODRÁ CEDERLO, TRASPASARLO O SUBARRENDARLO EN TODO O EN PARTE.

DECIMA PRIMERA: EL INCUMPLIMIENTO DE CUALQUIERA DE LAS CLAUSULAS DARÁ DERECHO A “EL ARRENDADOR” PARA CONSIDERAR RESCINDIDO EL PRESENTE CONTRATO Y RECLAMAR DAÑOS.

DECIMA SEGUNDA: PARA LO NO PREVISTO, ESTE CONTRATO SE REGIRÁ POR LAS DISPOSICIONES LEGALES APLICABLES.

DECIMA TERCERA: DOCUMENTO REDACTADO Y VISADO POR EL ABOGADO(A) ${datos.abogado_nombre}, INSCRITO(A) EN EL IPSA BAJO EL NRO. ${datos.abogado_ipsa}.

EN FE DE LO EXPUESTO, FIRMAMOS DE FORMA PRIVADA, EN ${datos.ciudad_contrato}, EL ${datos.fecha_suscripcion}.

__________________________              __________________________
     EL ARRENDADOR                           EL ARRENDATARIO
    `.trim();
    },

    /**
     * DOCUMENTO 2: RECIBO DE PAGO
     */
    generarReciboPago(datos) {
        return `
RECIBO

YO, ${datos.arrendador_nombre} CI ${datos.arrendador_ci} HE RECIBIDO DE ${datos.arrendatario_nombre}, CI ${datos.arrendatario_ci}, LA CANTIDAD DE: ${datos.deposito_garantia_usd} $ CORRESPONDIENTE AL DEPOSITO COMO GARANTIA DE LOS MUEBLES Y EQUIPOS DEL INMUEBLE EN ALQUILER SEGÚN TÉRMINOS DEL CONTRATO SECUNDARIO (EQUIVALENTE A Bs. ${datos.deposito_garantia_ves} CON TASA OFICIAL BCV APLICADA: ${datos.tasa_bcv_aplicada}).

QUEDANDO PENDIENTE ${datos.canon_mensual_usd} $ (EQUIVALENTE A Bs. ${datos.canon_mensual_ves}) CORRESPONDIENTE AL PRIMER MES POR ADELANTADO DEL CANON DE ARRENDAMIENTO.

EN ${datos.ciudad_contrato}, EL ${datos.fecha_suscripcion}.

__________________________              __________________________
     POR RECIBIDO                          POR ENTREGADO
    `.trim();
    },

    /**
     * DOCUMENTO 3: INVENTARIO Y NORMAS
     */
    generarInventario(datos) {
        // Formatear el JSON array a texto legible
        let inventarioTexto = "NO SE REGISTRARON EQUIPOS";
        if (datos.lista_equipos && datos.lista_equipos.length > 0) {
            inventarioTexto = datos.lista_equipos
                .map(eq => `- ${eq.cantidad} ${eq.item} marca ${eq.marca} (Estado: ${eq.estado})`)
                .join('\n');
        }

        return `
INVENTARIO DE BIENES Y NORMAS DE CONVIVENCIA
INMUEBLE N° ${datos.numero_referencia} | FECHA: ${datos.fecha_suscripcion}

EL INMUEBLE / APARTAMENTO SE ENCUENTRA EQUIPADO CON:
${inventarioTexto}

RESTRICCIONES Y CONVIVENCIA:
- Mascotas: ${datos.restricciones.mascotas ? "PERMITIDAS" : "NO PERMITIDAS"}
- Fiestas o Reuniones: ${datos.restricciones.fiestas ? "PERMITIDAS" : "NO PERMITIDAS"}
- Ruidos Molestos: ${datos.restricciones.ruidos ? "PERMITIDOS" : "PROHIBIDOS (Obligatorio mantener niveles de música y sonido bajos)"}

REGLAS DE ACCESO:
${datos.reglas_acceso}

NORMATIVAS GENERALES:
- No dejar amontonar la basura en las áreas comunes.
- En el momento de entregar el inmueble, el mobiliario debe estar en el estado exacto plasmado.
- Estacionar el vehículo correctamente y apagar todo sistema de enfriamiento al salir.

__________________________              __________________________
     EL ARRENDADOR                           EL ARRENDATARIO
    `.trim();
    }
};
