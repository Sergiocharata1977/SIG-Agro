import jsPDF from 'jspdf';
import type {
    ReportConfig,
    CampaniaReportData,
    CostoReportData,
    ScoutingReportData,
    RendimientoReportData,
    ReportType
} from '@/types/reports';

// Colores corporativos
const COLORS = {
    primary: '#16a34a', // green-600
    secondary: '#1f2937', // gray-800
    text: '#374151', // gray-700
    lightGray: '#e5e7eb', // gray-200
    white: '#ffffff',
};

// Configuración base del PDF
const PDF_CONFIG = {
    margin: 20,
    lineHeight: 7,
    headerHeight: 40,
    footerHeight: 20,
};

export class PDFGenerator {
    private doc: jsPDF;
    private currentY: number = PDF_CONFIG.margin;
    private pageWidth: number;
    private pageHeight: number;
    private config: ReportConfig;

    constructor(config: ReportConfig) {
        this.doc = new jsPDF('p', 'mm', 'a4');
        this.pageWidth = this.doc.internal.pageSize.getWidth();
        this.pageHeight = this.doc.internal.pageSize.getHeight();
        this.config = config;
        this.addHeader();
    }

    private addHeader() {
        // Barra de color superior
        this.doc.setFillColor(COLORS.primary);
        this.doc.rect(0, 0, this.pageWidth, 10, 'F');

        // Logo placeholder - en producción usar imagen real
        this.doc.setFillColor(COLORS.secondary);
        this.doc.circle(25, 25, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(10);
        this.doc.text('SIG', 21, 27);

        // Título y organización
        this.doc.setTextColor(COLORS.secondary);
        this.doc.setFontSize(18);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(this.config.title, 40, 22);

        if (this.config.subtitle) {
            this.doc.setFontSize(12);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(this.config.subtitle, 40, 30);
        }

        // Información de organización
        this.doc.setFontSize(10);
        this.doc.setTextColor(COLORS.text);
        this.doc.text(this.config.organizationName, this.pageWidth - PDF_CONFIG.margin, 18, { align: 'right' });
        this.doc.text(`Generado: ${this.formatDate(this.config.generatedAt)}`, this.pageWidth - PDF_CONFIG.margin, 25, { align: 'right' });
        this.doc.text(`Por: ${this.config.generatedBy}`, this.pageWidth - PDF_CONFIG.margin, 32, { align: 'right' });

        // Línea separadora
        this.doc.setDrawColor(COLORS.lightGray);
        this.doc.line(PDF_CONFIG.margin, 40, this.pageWidth - PDF_CONFIG.margin, 40);

        this.currentY = 50;
    }

    private addFooter() {
        const pageCount = this.doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            this.doc.setFontSize(8);
            this.doc.setTextColor(COLORS.text);
            this.doc.text(
                `Página ${i} de ${pageCount}`,
                this.pageWidth / 2,
                this.pageHeight - 10,
                { align: 'center' }
            );
            this.doc.text(
                'SIG Agro - Don Cándido IA',
                PDF_CONFIG.margin,
                this.pageHeight - 10
            );
        }
    }

    private checkPageBreak(requiredSpace: number = 30) {
        if (this.currentY + requiredSpace > this.pageHeight - PDF_CONFIG.footerHeight) {
            this.doc.addPage();
            this.currentY = PDF_CONFIG.margin;
            return true;
        }
        return false;
    }

    private formatDate(date: Date): string {
        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    }

    addSection(title: string) {
        this.checkPageBreak(20);
        this.doc.setFillColor(COLORS.primary);
        this.doc.rect(PDF_CONFIG.margin, this.currentY, this.pageWidth - PDF_CONFIG.margin * 2, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, PDF_CONFIG.margin + 3, this.currentY + 5.5);
        this.currentY += 12;
        this.doc.setTextColor(COLORS.text);
        this.doc.setFont('helvetica', 'normal');
    }

    addText(text: string, options?: { bold?: boolean; size?: number }) {
        this.checkPageBreak();
        this.doc.setFontSize(options?.size || 10);
        this.doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
        this.doc.text(text, PDF_CONFIG.margin, this.currentY);
        this.currentY += PDF_CONFIG.lineHeight;
    }

    addKeyValue(key: string, value: string) {
        this.checkPageBreak();
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`${key}:`, PDF_CONFIG.margin, this.currentY);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(value, PDF_CONFIG.margin + 40, this.currentY);
        this.currentY += PDF_CONFIG.lineHeight;
    }

    addTable(headers: string[], rows: string[][], columnWidths?: number[]) {
        this.checkPageBreak(30);
        const tableWidth = this.pageWidth - PDF_CONFIG.margin * 2;
        const colWidth = columnWidths || headers.map(() => tableWidth / headers.length);

        // Header
        this.doc.setFillColor(COLORS.secondary);
        this.doc.rect(PDF_CONFIG.margin, this.currentY, tableWidth, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'bold');

        let xPos = PDF_CONFIG.margin + 2;
        headers.forEach((header, i) => {
            this.doc.text(header, xPos, this.currentY + 5.5);
            xPos += colWidth[i];
        });
        this.currentY += 8;

        // Rows
        this.doc.setTextColor(COLORS.text);
        this.doc.setFont('helvetica', 'normal');

        rows.forEach((row, rowIndex) => {
            this.checkPageBreak(8);

            // Alternate row background
            if (rowIndex % 2 === 0) {
                this.doc.setFillColor(247, 247, 247);
                this.doc.rect(PDF_CONFIG.margin, this.currentY, tableWidth, 7, 'F');
            }

            xPos = PDF_CONFIG.margin + 2;
            row.forEach((cell, i) => {
                const truncated = cell.length > 30 ? cell.substring(0, 27) + '...' : cell;
                this.doc.text(truncated, xPos, this.currentY + 5);
                xPos += colWidth[i];
            });
            this.currentY += 7;
        });

        this.currentY += 5;
    }

    addSummaryBox(items: { label: string; value: string; color?: string }[]) {
        this.checkPageBreak(40);
        const boxWidth = (this.pageWidth - PDF_CONFIG.margin * 2 - 10 * (items.length - 1)) / items.length;

        items.forEach((item, i) => {
            const x = PDF_CONFIG.margin + i * (boxWidth + 10);
            this.doc.setFillColor(item.color || COLORS.lightGray);
            this.doc.roundedRect(x, this.currentY, boxWidth, 25, 3, 3, 'F');

            this.doc.setTextColor(COLORS.text);
            this.doc.setFontSize(9);
            this.doc.text(item.label, x + boxWidth / 2, this.currentY + 8, { align: 'center' });

            this.doc.setFontSize(14);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(item.value, x + boxWidth / 2, this.currentY + 18, { align: 'center' });
            this.doc.setFont('helvetica', 'normal');
        });

        this.currentY += 32;
    }

    addSpace(height: number = 10) {
        this.currentY += height;
    }

    // Generadores específicos por tipo de reporte
    generateCampaniaReport(data: CampaniaReportData) {
        // Información general
        this.addSection('Información de la Campaña');
        this.addKeyValue('Nombre', data.campania.nombre);
        this.addKeyValue('Cultivo', data.campania.cultivo);
        this.addKeyValue('Estado', data.campania.estado.toUpperCase());
        this.addKeyValue('Fecha Inicio', data.campania.fechaInicio);
        if (data.campania.fechaFin) {
            this.addKeyValue('Fecha Fin', data.campania.fechaFin);
        }

        this.addSpace();

        // Resumen
        this.addSummaryBox([
            { label: 'Superficie Total', value: `${data.resumen.superficieTotal} ha`, color: '#dcfce7' },
            { label: 'Costo Total', value: this.formatCurrency(data.resumen.costoTotal), color: '#fef3c7' },
            { label: 'Operaciones', value: data.resumen.operacionesCount.toString(), color: '#dbeafe' }
        ]);

        // Lotes
        if (data.lotes.length > 0) {
            this.addSection('Lotes Asociados');
            this.addTable(
                ['Nombre', 'Campo', 'Superficie'],
                data.lotes.map(l => [l.nombre, l.campo, `${l.superficie} ha`]),
                [70, 70, 30]
            );
        }

        // Operaciones
        if (data.operaciones.length > 0) {
            this.addSection('Operaciones Realizadas');
            this.addTable(
                ['Fecha', 'Tipo', 'Lote', 'Costo'],
                data.operaciones.map(o => [o.fecha, o.tipo, o.lote, this.formatCurrency(o.costo)]),
                [35, 45, 50, 40]
            );
        }
    }

    generateCostoReport(data: CostoReportData) {
        this.addSection('Período del Reporte');
        this.addKeyValue('Desde', data.periodo.inicio);
        this.addKeyValue('Hasta', data.periodo.fin);

        this.addSpace();

        // Totales
        this.addSummaryBox([
            { label: 'Total Gastos', value: this.formatCurrency(data.totales.gastos), color: '#fee2e2' },
            { label: 'Total Ingresos', value: this.formatCurrency(data.totales.ingresos), color: '#dcfce7' },
            { label: 'Balance', value: this.formatCurrency(data.totales.balance), color: data.totales.balance >= 0 ? '#dcfce7' : '#fee2e2' }
        ]);

        // Por categoría
        if (data.categorias.length > 0) {
            this.addSection('Desglose por Categoría');
            this.addTable(
                ['Categoría', 'Monto', 'Porcentaje'],
                data.categorias.map(c => [c.nombre, this.formatCurrency(c.monto), `${c.porcentaje.toFixed(1)}%`]),
                [80, 50, 40]
            );
        }

        // Detalle operaciones
        if (data.operaciones.length > 0) {
            this.addSection('Detalle de Operaciones');
            this.addTable(
                ['Fecha', 'Concepto', 'Categoría', 'Monto'],
                data.operaciones.map(o => [o.fecha, o.concepto, o.categoria, this.formatCurrency(o.monto)]),
                [30, 60, 40, 40]
            );
        }
    }

    generateScoutingReport(data: ScoutingReportData) {
        this.addSection('Período del Reporte');
        this.addKeyValue('Desde', data.periodo.inicio);
        this.addKeyValue('Hasta', data.periodo.fin);

        this.addSpace();

        // Resumen
        this.addSummaryBox([
            { label: 'Total Registros', value: data.resumen.totalRegistros.toString(), color: '#dbeafe' },
            { label: 'Alertas Altas', value: data.resumen.alertasAltas.toString(), color: data.resumen.alertasAltas > 0 ? '#fee2e2' : '#dcfce7' }
        ]);

        // Registros
        if (data.registros.length > 0) {
            this.addSection('Registros de Monitoreo');
            this.addTable(
                ['Fecha', 'Lote', 'Tipo', 'Severidad', 'Descripción'],
                data.registros.map(r => [r.fecha, r.lote, r.tipo, r.severidad.toUpperCase(), r.descripcion.substring(0, 30)]),
                [25, 30, 25, 25, 65]
            );
        }
    }

    generateRendimientoReport(data: RendimientoReportData) {
        this.addSection('Información de Cosecha');
        this.addKeyValue('Campaña', data.campania);

        this.addSpace();

        // Promedios
        this.addSummaryBox([
            { label: 'Rend. Promedio', value: `${data.promedios.rendimientoPromedio.toFixed(0)} kg/ha`, color: '#dcfce7' },
            { label: 'Humedad Prom.', value: `${data.promedios.humedadPromedio.toFixed(1)}%`, color: '#dbeafe' },
            { label: 'Producción Total', value: `${(data.promedios.rendimientoTotal / 1000).toFixed(1)} tn`, color: '#fef3c7' }
        ]);

        // Detalle por lote
        if (data.cosechas.length > 0) {
            this.addSection('Detalle por Lote');
            this.addTable(
                ['Lote', 'Campo', 'Superficie', 'Rendimiento', 'Humedad', 'Calidad'],
                data.cosechas.map(c => [
                    c.lote,
                    c.campo,
                    `${c.superficie} ha`,
                    `${c.rendimiento} kg/ha`,
                    `${c.humedad}%`,
                    c.calidad
                ]),
                [30, 30, 25, 30, 25, 30]
            );
        }
    }

    // Guardar y descargar
    save(filename: string) {
        this.addFooter();
        this.doc.save(filename);
    }

    getBlob(): Blob {
        this.addFooter();
        return this.doc.output('blob');
    }

    getBase64(): string {
        this.addFooter();
        return this.doc.output('datauristring');
    }
}

// Función helper para generar reportes
export async function generateReport(
    type: ReportType,
    data: CampaniaReportData | CostoReportData | ScoutingReportData | RendimientoReportData,
    config: ReportConfig
): Promise<void> {
    const generator = new PDFGenerator(config);

    switch (type) {
        case 'campania':
            generator.generateCampaniaReport(data as CampaniaReportData);
            break;
        case 'costos':
            generator.generateCostoReport(data as CostoReportData);
            break;
        case 'scouting':
            generator.generateScoutingReport(data as ScoutingReportData);
            break;
        case 'rendimiento':
            generator.generateRendimientoReport(data as RendimientoReportData);
            break;
    }

    const filename = `${type}_${new Date().toISOString().split('T')[0]}.pdf`;
    generator.save(filename);
}
