import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { propiedadesService } from '../propiedadesService';

export function ImportadorMasivo({ session, onNotificar, onImportSuccess }) {
    const [dragging, setDragging] = useState(false);
    const [dataPrevia, setDataPrevia] = useState([]);
    const [procesando, setProcesando] = useState(false);
    const fileInputRef = useRef(null);

    const usuario = session?.user;

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            procesarArchivo(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            procesarArchivo(e.target.files[0]);
        }
    };

    const procesarArchivo = (file) => {
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
            onNotificar?.("Formato no válido. Sube un archivo Excel (.xlsx, .xls) o CSV.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Obtener la primera hoja de cálculo
                const primeHoja = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[primeHoja];

                // Convertir la hoja a JSON
                const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // defval ensures empty cells aren't undefined

                if (json.length === 0) {
                    onNotificar?.("El archivo parece estar vacío.", "error");
                    return;
                }

                // Mapeo básico y validación simple para la vista previa
                const mapeado = json.map((fila, index) => ({
                    _id_temp: index,
                    titulo: fila.titulo || fila.Titulo || fila.TITLE || 'Sin título',
                    descripcion: fila.descripcion || fila.Descripcion || fila.DESCRIPTION || '',
                    zona: fila.zona || fila.Zona || fila.ZONA || 'Desconocida',
                    precio: Number(fila.precio || fila.Precio || fila.PRECIO || 0),
                    habitaciones: Number(fila.habitaciones || fila.Habitaciones || fila.HABITACIONES || 0),
                    banos: Number(fila.banos || fila.Banos || fila.BAÑOS || fila.Baños || 0),
                    metraje: Number(fila.metraje || fila.Metraje || fila.METRAJE || 0),
                    tipo_inmueble: fila.tipo_inmueble || fila['Tipo Inmueble'] || fila.TipoInmueble || 'Apartamento',
                    tipo_operacion: fila.tipo_operacion || fila['Tipo Operacion'] || fila.TipoOperacion || 'Venta',
                }));

                setDataPrevia(mapeado);
            } catch (error) {
                console.error("Error al leer el archivo:", error);
                onNotificar?.("Error al procesar el archivo Excel.", "error");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const confirmarCarga = async () => {
        if (dataPrevia.length === 0) return;

        setProcesando(true);
        try {
            await propiedadesService.importarDesdeExcel(dataPrevia, usuario);
            onNotificar?.(`¡Éxito! ${dataPrevia.length} propiedades importadas.`, "success");
            setDataPrevia([]);
            if (onImportSuccess) onImportSuccess();
        } catch (error) {
            console.error("Error en importación masiva:", error);
            onNotificar?.("Hubo un error al guardar las propiedades.", "error");
        } finally {
            setProcesando(false);
        }
    };

    const cancelarImportacion = () => {
        setDataPrevia([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="bg-white rounded-[40px] shadow-xl shadow-blue-900/5 p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-50 text-[#00429d] rounded-2xl flex items-center justify-center">
                    <FileSpreadsheet size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-serif text-slate-900 leading-tight">Importador Masivo</h2>
                    <p className="text-sm font-medium text-slate-500">
                        Sube tu catálogo de propiedades (Excel/CSV) en segundos.
                    </p>
                </div>
            </div>

            {dataPrevia.length === 0 ? (
                <div
                    className={`border-3 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4 ${dragging ? 'border-[#00429d] bg-blue-50/50 scale-[0.98]' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${dragging ? 'bg-[#00429d] text-white shadow-lg shadow-blue-900/20' : 'bg-slate-100 text-slate-400'}`}>
                        <UploadCloud size={40} />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-900">Arrástralo al Círculo Central</p>
                        <p className="text-sm text-slate-500 mt-1">Soporta formatos .xlsx, .xls y .csv</p>
                    </div>
                    <button className="mt-4 px-6 py-3 bg-slate-900 text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-[#00429d] transition-colors">
                        Explorar Archivos
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                        <ImageIcon className="text-amber-500 mt-0.5 shrink-0" size={20} />
                        <div>
                            <p className="text-sm font-bold text-amber-900">Gestión de Imágenes Pendiente</p>
                            <p className="text-xs text-amber-700 mt-1">
                                Las propiedades se subirán con una imagen por defecto. No olvides añadir las fotos en la vista de detalle de cada propiedad para activar el motor de compresión y marcas de agua de NexusReal.
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                Vista Previa ({dataPrevia.length} propiedades leídas)
                            </span>
                            <button
                                onClick={cancelarImportacion}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="Cancelar importación"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold text-slate-900">Propiedad</th>
                                        <th className="px-6 py-3 font-semibold text-slate-900">Precio</th>
                                        <th className="px-6 py-3 font-semibold text-slate-900">Operación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {dataPrevia.slice(0, 10).map((item) => (
                                        <tr key={item._id_temp} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-3">
                                                <p className="font-bold text-slate-900 truncate max-w-[200px]">{item.titulo}</p>
                                                <p className="text-xs text-slate-500 truncate max-w-[200px]">{item.zona} • {item.tipo_inmueble}</p>
                                            </td>
                                            <td className="px-6 py-3 font-medium text-[#00429d]">${item.precio.toLocaleString()}</td>
                                            <td className="px-6 py-3">
                                                <span className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold px-2 py-1 rounded-md">
                                                    {item.tipo_operacion}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {dataPrevia.length > 10 && (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-4 text-center text-xs text-slate-500 font-medium">
                                                ... y {dataPrevia.length - 10} propiedades más.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={cancelarImportacion}
                            disabled={procesando}
                            className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-widest rounded-2xl transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmarCarga}
                            disabled={procesando}
                            className="flex-[2] py-4 bg-[#00429d] hover:bg-blue-800 text-white font-bold uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {procesando ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Procesando Carga...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={20} />
                                    Confirmar Importación ({dataPrevia.length})
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ImportadorMasivo;
