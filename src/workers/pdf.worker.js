/**
 * Web Worker: Motor de Generación de Archivos PDF (Nexus Worker).
 * Este script se ejecuta en un hilo separado para evitar bloqueos en el UI 
 * durante el formateo de documentos legales extensos.
 */

/* global importScripts, jspdf */
importScripts('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

self.onmessage = async function(e) {
    const { titulo_documento, contenido_texto, nombre_arrendatario, metadata } = e.data;

    try {
        // Inicialización de jsPDF en el contexto del worker
        const { jsPDF } = self.jspdf;
        const doc = new jsPDF();

        // 1. Configuración de Título
        doc.setFont("times", "bold");
        doc.setFontSize(16);
        doc.text(titulo_documento, 105, 20, { align: "center" });

        // 2. Procesamiento de Texto Legal
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        
        // El cálculo de splitTextToSize puede ser pesado, por eso estamos aquí.
        const lineas_formateadas = doc.splitTextToSize(contenido_texto, 170);
        doc.text(lineas_formateadas, 20, 35);

        // 3. Inyección de Branding Nexus en el Footer
        const total_paginas = doc.internal.getNumberOfPages();
        for (let i = 1; i <= total_paginas; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`NexusReal - Documento Validado Legalmente - Página ${i}`, 105, 285, { align: 'center' });
        }

        // Generamos el archivo como un Uint8Array para transferirlo eficientemente
        const output_pdf = doc.output('arraybuffer');
        
        // Enviamos el resultado de vuelta al hilo principal
        self.postMessage({ 
            status: 'success', 
            pdf_data: output_pdf,
            fileName: `${titulo_documento.replace(/\s+/g, '_')}_${nombre_arrendatario}.pdf`
        }, [output_pdf]);

    } catch (error) {
        self.postMessage({ 
            status: 'error', 
            message: error.toString() 
        });
    }
};
