import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ColumnaExport {
    header: string;
    key: string;
    formato?: 'texto' | 'numero' | 'moneda' | 'fecha';
}

export interface ConfigExport {
    titulo: string;
    subtitulo?: string;
    columnas: ColumnaExport[];
    datos: Record<string, unknown>[];
    totales?: Record<string, number>;
    nombreArchivo: string;
    organizacion?: string;
}

type RegistroGenerico = Record<string, unknown>;

const FORMATO_MONEDA = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
});

function normalizarNombreArchivo(nombreArchivo: string, extension: 'xlsx' | 'pdf'): string {
    return nombreArchivo.toLowerCase().endsWith(`.${extension}`)
        ? nombreArchivo
        : `${nombreArchivo}.${extension}`;
}

function esRegistro(value: unknown): value is RegistroGenerico {
    return typeof value === 'object' && value !== null;
}

function obtenerValor(registro: RegistroGenerico, key: string): unknown {
    const directo = registro[key];
    if (directo !== undefined) {
        return directo;
    }

    return key.split('.').reduce<unknown>((actual, fragmento) => {
        if (!esRegistro(actual)) {
            return undefined;
        }

        return actual[fragmento];
    }, registro);
}

function obtenerNumero(registro: RegistroGenerico, claves: string[], fallback = 0): number {
    for (const clave of claves) {
        const valor = obtenerValor(registro, clave);
        if (typeof valor === 'number' && Number.isFinite(valor)) {
            return valor;
        }

        if (typeof valor === 'string') {
            const parseado = Number(valor);
            if (Number.isFinite(parseado)) {
                return parseado;
            }
        }
    }

    return fallback;
}

function obtenerTexto(registro: RegistroGenerico, claves: string[], fallback = ''): string {
    for (const clave of claves) {
        const valor = obtenerValor(registro, clave);
        if (typeof valor === 'string' && valor.trim().length > 0) {
            return valor;
        }
        if (typeof valor === 'number' || typeof valor === 'boolean') {
            return String(valor);
        }
    }

    return fallback;
}

function obtenerFechaValor(registro: RegistroGenerico, claves: string[]): Date | undefined {
    for (const clave of claves) {
        const valor = obtenerValor(registro, clave);
        if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
            return valor;
        }

        if (typeof valor === 'string' || typeof valor === 'number') {
            const fecha = new Date(valor);
            if (!Number.isNaN(fecha.getTime())) {
                return fecha;
            }
        }

        if (esRegistro(valor) && typeof valor.toDate === 'function') {
            const fecha = valor.toDate() as Date;
            if (fecha instanceof Date && !Number.isNaN(fecha.getTime())) {
                return fecha;
            }
        }
    }

    return undefined;
}

function formatearFecha(valor: unknown): string {
    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
        return valor.toLocaleDateString('es-AR');
    }

    if (typeof valor === 'string' || typeof valor === 'number') {
        const fecha = new Date(valor);
        if (!Number.isNaN(fecha.getTime())) {
            return fecha.toLocaleDateString('es-AR');
        }
    }

    if (esRegistro(valor) && typeof valor.toDate === 'function') {
        const fecha = valor.toDate() as Date;
        if (fecha instanceof Date && !Number.isNaN(fecha.getTime())) {
            return fecha.toLocaleDateString('es-AR');
        }
    }

    return '';
}

function formatearNumero(valor: unknown): string {
    if (typeof valor === 'number' && Number.isFinite(valor)) {
        return new Intl.NumberFormat('es-AR').format(valor);
    }

    if (typeof valor === 'string') {
        const parseado = Number(valor);
        if (Number.isFinite(parseado)) {
            return new Intl.NumberFormat('es-AR').format(parseado);
        }
    }

    return valor == null ? '' : String(valor);
}

function formatearMoneda(valor: unknown): string {
    if (typeof valor === 'number' && Number.isFinite(valor)) {
        return FORMATO_MONEDA.format(valor);
    }

    if (typeof valor === 'string') {
        const parseado = Number(valor);
        if (Number.isFinite(parseado)) {
            return FORMATO_MONEDA.format(parseado);
        }
    }

    return valor == null ? '' : String(valor);
}

function formatearValor(valor: unknown, formato: ColumnaExport['formato'] = 'texto'): string | number {
    switch (formato) {
        case 'fecha':
            return formatearFecha(valor);
        case 'numero':
            return formatearNumero(valor);
        case 'moneda':
            return formatearMoneda(valor);
        case 'texto':
        default:
            return valor == null ? '' : String(valor);
    }
}

function construirFilasDatos(columnas: ColumnaExport[], datos: RegistroGenerico[]): Array<Array<string | number>> {
    return datos.map((registro) =>
        columnas.map((columna) => formatearValor(obtenerValor(registro, columna.key), columna.formato))
    );
}

function construirFilaTotales(columnas: ColumnaExport[], totales?: Record<string, number>): Array<string | number> | null {
    if (!totales) {
        return null;
    }

    let encontroValor = false;
    const fila = columnas.map((columna, indice) => {
        if (indice === 0) {
            return 'Totales';
        }

        const total = totales[columna.key];
        if (typeof total === 'number' && Number.isFinite(total)) {
            encontroValor = true;
            return formatearValor(total, columna.formato);
        }

        return '';
    });

    return encontroValor ? fila : null;
}

export function exportarExcel(config: ConfigExport): void {
    const workbook = XLSX.utils.book_new();
    const filas: Array<Array<string | number>> = [];

    filas.push([config.titulo]);

    if (config.subtitulo) {
        filas.push([config.subtitulo]);
    }

    if (config.organizacion) {
        filas.push([config.organizacion]);
    }

    filas.push([]);
    filas.push(config.columnas.map((columna) => columna.header));

    const filasDatos = construirFilasDatos(config.columnas, config.datos);
    filas.push(...filasDatos);

    const filaTotales = construirFilaTotales(config.columnas, config.totales);
    if (filaTotales) {
        filas.push(filaTotales);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(filas);
    const rango = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1');
    const filaEncabezados = config.organizacion ? 4 : config.subtitulo ? 3 : 2;

    if (worksheet.A1) {
        worksheet.A1.s = { font: { bold: true, sz: 16 } };
    }

    const celdaEncabezadoSubtitulo = XLSX.utils.encode_cell({ r: 1, c: 0 });
    if (config.subtitulo && worksheet[celdaEncabezadoSubtitulo]) {
        worksheet[celdaEncabezadoSubtitulo].s = { font: { italic: true } };
    }

    for (let columna = 0; columna <= rango.e.c; columna += 1) {
        const ref = XLSX.utils.encode_cell({ r: filaEncabezados, c: columna });
        if (worksheet[ref]) {
            worksheet[ref].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: 'D9EAD3' } },
            };
        }
    }

    worksheet['!cols'] = config.columnas.map((columna) => ({
        wch: Math.max(columna.header.length + 4, 14),
    }));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
    XLSX.writeFile(workbook, normalizarNombreArchivo(config.nombreArchivo, 'xlsx'));
}

export function exportarPDF(config: ConfigExport): void {
    const orientacion = config.columnas.length > 5 ? 'landscape' : 'portrait';
    const doc = new jsPDF({
        orientation: orientacion,
        unit: 'pt',
        format: 'a4',
    });

    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPagina = doc.internal.pageSize.getHeight();
    const fechaGeneracion = new Date().toLocaleDateString('es-AR');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(config.titulo, 40, 40);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    let cursorY = 58;
    if (config.subtitulo) {
        doc.text(config.subtitulo, 40, cursorY);
        cursorY += 14;
    }

    if (config.organizacion) {
        doc.text(config.organizacion, 40, cursorY);
        cursorY += 14;
    }

    doc.text(`Emitido: ${fechaGeneracion}`, anchoPagina - 40, 40, { align: 'right' });

    const filas = construirFilasDatos(config.columnas, config.datos).map((fila) =>
        fila.map((celda) => (celda == null ? '' : String(celda)))
    );

    const filaTotales = construirFilaTotales(config.columnas, config.totales);
    if (filaTotales) {
        filas.push(filaTotales.map((celda) => (celda == null ? '' : String(celda))));
    }

    autoTable(doc, {
        startY: cursorY + 8,
        head: [config.columnas.map((columna) => columna.header)],
        body: filas,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 4,
        },
        headStyles: {
            fillColor: [22, 163, 74],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        footStyles: {
            fillColor: [217, 234, 211],
            textColor: [31, 41, 55],
            fontStyle: 'bold',
        },
        didParseCell: (hookData) => {
            if (filaTotales && hookData.section === 'body' && hookData.row.index === filas.length - 1) {
                hookData.cell.styles.fontStyle = 'bold';
                hookData.cell.styles.fillColor = [240, 247, 237];
            }
        },
        didDrawPage: (hookData) => {
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(
                `Pagina ${hookData.pageNumber}`,
                anchoPagina - 40,
                altoPagina - 20,
                { align: 'right' }
            );
        },
    });

    doc.save(normalizarNombreArchivo(config.nombreArchivo, 'pdf'));
}

function totalizar(asientos: RegistroGenerico[]): Record<string, number> {
    return asientos.reduce<Record<string, number>>(
        (acumulado, asiento) => {
            acumulado.debe += obtenerNumero(asiento, ['totalDebe'], 0);
            acumulado.haber += obtenerNumero(asiento, ['totalHaber'], 0);
            return acumulado;
        },
        { debe: 0, haber: 0 }
    );
}

export function exportarLibroDiario(asientos: unknown[], orgNombre: string): void {
    const datos = (Array.isArray(asientos) ? asientos : []).map((asiento) => {
        const registro = esRegistro(asiento) ? asiento : {};
        const fecha = obtenerFechaValor(registro, ['fecha']);

        return {
            numero: obtenerNumero(registro, ['numero'], 0),
            fecha: fecha ? fecha.toLocaleDateString('es-AR') : '',
            concepto: obtenerTexto(registro, ['concepto', 'descripcion'], ''),
            estado: obtenerTexto(registro, ['estado'], ''),
            debe: obtenerNumero(registro, ['totalDebe'], 0),
            haber: obtenerNumero(registro, ['totalHaber'], 0),
        };
    });

    const totales = totalizar(datos);
    const config: ConfigExport = {
        titulo: 'Libro Diario',
        subtitulo: `Asientos exportados: ${datos.length}`,
        organizacion: orgNombre,
        nombreArchivo: `libro-diario-${new Date().toISOString().slice(0, 10)}`,
        columnas: [
            { header: 'Nro. Asiento', key: 'numero', formato: 'numero' },
            { header: 'Fecha', key: 'fecha', formato: 'texto' },
            { header: 'Concepto', key: 'concepto', formato: 'texto' },
            { header: 'Estado', key: 'estado', formato: 'texto' },
            { header: 'Debe', key: 'debe', formato: 'moneda' },
            { header: 'Haber', key: 'haber', formato: 'moneda' },
        ],
        datos,
        totales,
    };

    exportarExcel(config);
    exportarPDF(config);
}

export function exportarMayorCuenta(cuenta: string, movimientos: unknown[], orgNombre: string): void {
    let saldoAcumulado = 0;
    const datos = (Array.isArray(movimientos) ? movimientos : []).map((movimiento) => {
        const registro = esRegistro(movimiento) ? movimiento : {};
        const debe = obtenerNumero(registro, ['debe'], 0);
        const haber = obtenerNumero(registro, ['haber'], 0);
        saldoAcumulado = obtenerNumero(registro, ['saldoAcumulado'], saldoAcumulado + debe - haber);

        return {
            fecha: formatearFecha(obtenerValor(registro, 'fecha')),
            asientoNumero: obtenerNumero(registro, ['asientoNumero', 'numero'], 0),
            concepto: obtenerTexto(registro, ['concepto', 'descripcion'], ''),
            debe,
            haber,
            saldoAcumulado,
        };
    });

    const config: ConfigExport = {
        titulo: `Mayor de Cuenta: ${cuenta}`,
        subtitulo: `Movimientos exportados: ${datos.length}`,
        organizacion: orgNombre,
        nombreArchivo: `mayor-${cuenta.replace(/[^\w-]+/g, '-').toLowerCase()}`,
        columnas: [
            { header: 'Fecha', key: 'fecha', formato: 'texto' },
            { header: 'Asiento', key: 'asientoNumero', formato: 'numero' },
            { header: 'Concepto', key: 'concepto', formato: 'texto' },
            { header: 'Debe', key: 'debe', formato: 'moneda' },
            { header: 'Haber', key: 'haber', formato: 'moneda' },
            { header: 'Saldo', key: 'saldoAcumulado', formato: 'moneda' },
        ],
        datos,
        totales: {
            debe: datos.reduce((total, item) => total + item.debe, 0),
            haber: datos.reduce((total, item) => total + item.haber, 0),
            saldoAcumulado: datos.at(-1)?.saldoAcumulado ?? 0,
        },
    };

    exportarExcel(config);
    exportarPDF(config);
}

export function exportarCuentaCorriente(
    tercero: string,
    movimientos: unknown[],
    saldo: number,
    orgNombre: string
): void {
    const datos = (Array.isArray(movimientos) ? movimientos : []).map((movimiento) => {
        const registro = esRegistro(movimiento) ? movimiento : {};
        return {
            fecha: formatearFecha(obtenerValor(registro, 'fecha')),
            tipoOperacion: obtenerTexto(registro, ['tipoOperacion', 'tipo', 'concepto'], ''),
            descripcion: obtenerTexto(registro, ['descripcion', 'concepto'], ''),
            debe: obtenerNumero(registro, ['montoCliente', 'debe'], 0),
            haber: Math.abs(obtenerNumero(registro, ['montoProveedor', 'haber'], 0)),
        };
    });

    const config: ConfigExport = {
        titulo: `Cuenta Corriente: ${tercero}`,
        subtitulo: `Saldo actual: ${FORMATO_MONEDA.format(saldo)}`,
        organizacion: orgNombre,
        nombreArchivo: `cuenta-corriente-${tercero.replace(/[^\w-]+/g, '-').toLowerCase()}`,
        columnas: [
            { header: 'Fecha', key: 'fecha', formato: 'texto' },
            { header: 'Tipo', key: 'tipoOperacion', formato: 'texto' },
            { header: 'Descripcion', key: 'descripcion', formato: 'texto' },
            { header: 'Debe', key: 'debe', formato: 'moneda' },
            { header: 'Haber', key: 'haber', formato: 'moneda' },
        ],
        datos,
        totales: {
            debe: datos.reduce((total, item) => total + item.debe, 0),
            haber: datos.reduce((total, item) => total + item.haber, 0),
        },
    };

    exportarExcel(config);
    exportarPDF(config);
}

export function exportarFlujoCaja(flujo: unknown, orgNombre: string): void {
    const registro = esRegistro(flujo) ? flujo : {};
    const ingresos = obtenerNumero(registro, ['ingresos', 'totalIngresos'], 0);
    const egresos = obtenerNumero(registro, ['egresos', 'totalEgresos'], 0);
    const neto = obtenerNumero(registro, ['neto', 'saldo', 'resultado'], ingresos - egresos);

    const datos: RegistroGenerico[] = [
        { concepto: 'Ingresos', monto: ingresos },
        { concepto: 'Egresos', monto: egresos },
        { concepto: 'Flujo neto', monto: neto },
    ];

    const periodo = obtenerTexto(registro, ['periodo', 'descripcion'], 'Resumen general');
    const config: ConfigExport = {
        titulo: 'Flujo de Caja',
        subtitulo: periodo,
        organizacion: orgNombre,
        nombreArchivo: `flujo-caja-${new Date().toISOString().slice(0, 10)}`,
        columnas: [
            { header: 'Concepto', key: 'concepto', formato: 'texto' },
            { header: 'Monto', key: 'monto', formato: 'moneda' },
        ],
        datos,
        totales: { monto: neto },
    };

    exportarExcel(config);
    exportarPDF(config);
}
