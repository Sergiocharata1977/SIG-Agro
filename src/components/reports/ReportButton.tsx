'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PDFGenerator, generateReport } from '@/services/pdf-generator';
import type { ReportType, ReportConfig, CampaniaReportData, CostoReportData, ScoutingReportData, RendimientoReportData } from '@/types/reports';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, Loader2 } from 'lucide-react';

interface ReportButtonProps {
    type: ReportType;
    data: CampaniaReportData | CostoReportData | ScoutingReportData | RendimientoReportData;
    title: string;
    subtitle?: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'default' | 'lg';
    className?: string;
}

export function ReportButton({
    type,
    data,
    title,
    subtitle,
    variant = 'outline',
    size = 'sm',
    className
}: ReportButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const { user, organization } = useAuth();

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const config: ReportConfig = {
                title,
                subtitle,
                organizationName: organization?.name || 'SIG Agro',
                generatedBy: user?.displayName || user?.email || 'Usuario',
                generatedAt: new Date(),
            };

            await generateReport(type, data, config);
        } catch (error) {
            console.error('Error generando reporte:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleGenerate}
            disabled={isGenerating}
            className={className}
        >
            {isGenerating ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                </>
            ) : (
                <>
                    <FileText className="mr-2 h-4 w-4" />
                    Exportar PDF
                </>
            )}
        </Button>
    );
}

// Componente para múltiples tipos de reportes
interface ReportMenuProps {
    availableReports: {
        type: ReportType;
        label: string;
        getData: () => Promise<CampaniaReportData | CostoReportData | ScoutingReportData | RendimientoReportData>;
    }[];
}

export function ReportMenu({ availableReports }: ReportMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [generating, setGenerating] = useState<string | null>(null);
    const { user, organization } = useAuth();

    const handleGenerate = async (report: typeof availableReports[0]) => {
        setGenerating(report.type);
        try {
            const data = await report.getData();
            const config: ReportConfig = {
                title: `Reporte de ${report.label}`,
                organizationName: organization?.name || 'SIG Agro',
                generatedBy: user?.displayName || user?.email || 'Usuario',
                generatedAt: new Date(),
            };
            await generateReport(report.type, data, config);
        } catch (error) {
            console.error('Error generando reporte:', error);
        } finally {
            setGenerating(null);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <Button
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className="gap-2"
            >
                <Download className="h-4 w-4" />
                Reportes
            </Button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-50">
                        <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 px-3 py-2">
                                Exportar Reporte
                            </div>
                            {availableReports.map((report) => (
                                <button
                                    key={report.type}
                                    onClick={() => handleGenerate(report)}
                                    disabled={generating !== null}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md flex items-center gap-2 disabled:opacity-50"
                                >
                                    {generating === report.type ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileText className="h-4 w-4" />
                                    )}
                                    {report.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
