'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  AlertCircle,
  FileImage,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from 'lucide-react';
import { obtenerAdjuntos, subirAdjunto, eliminarAdjunto } from '@/services/adjuntos';
import type { Adjunto, TipoAdjunto } from '@/types/adjuntos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GestorAdjuntosProps {
  orgId: string;
  entidadTipo: string;
  entidadId: string;
  usuarioId: string;
  soloLectura?: boolean;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const TIPOS_ADJUNTO: Array<{ value: TipoAdjunto; label: string }> = [
  { value: 'factura', label: 'Factura' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'remito', label: 'Remito' },
  { value: 'orden_compra', label: 'Orden de compra' },
  { value: 'comprobante_transferencia', label: 'Comprobante de transferencia' },
  { value: 'cheque_escaneado', label: 'Cheque escaneado' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'presupuesto', label: 'Presupuesto' },
  { value: 'liquidacion', label: 'Liquidacion' },
  { value: 'informe', label: 'Informe' },
  { value: 'otro', label: 'Otro' },
];

function formatFecha(value: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
}

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getAdjuntoIcon(adjunto: Adjunto) {
  if (adjunto.contentType.startsWith('image/')) {
    return FileImage;
  }

  if (adjunto.contentType === 'application/pdf') {
    return FileText;
  }

  return Paperclip;
}

function isAllowedFile(file: File): boolean {
  return file.type.startsWith('image/') || file.type === 'application/pdf';
}

export function GestorAdjuntos({
  orgId,
  entidadTipo,
  entidadId,
  usuarioId,
  soloLectura = false,
}: GestorAdjuntosProps) {
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [tipoAdjunto, setTipoAdjunto] = useState<TipoAdjunto>('otro');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;

    async function cargar() {
      if (!orgId || !entidadTipo || !entidadId) {
        if (active) {
          setAdjuntos([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await obtenerAdjuntos(orgId, entidadTipo, entidadId);
        if (active) {
          setAdjuntos(data);
        }
      } catch (loadError) {
        console.error('Error cargando adjuntos:', loadError);
        if (active) {
          setError('No se pudieron cargar los adjuntos.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void cargar();

    return () => {
      active = false;
    };
  }, [entidadId, entidadTipo, orgId]);

  const selectedFileSummary = useMemo(() => {
    if (!archivoSeleccionado) {
      return null;
    }

    return `${archivoSeleccionado.name} (${formatBytes(archivoSeleccionado.size)})`;
  }, [archivoSeleccionado]);

  const clearUploadForm = () => {
    setArchivoSeleccionado(null);
    setTipoAdjunto('otro');
    setDescripcion('');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setError(null);
    setSuccess(null);

    if (!file) {
      setArchivoSeleccionado(null);
      return;
    }

    if (!isAllowedFile(file)) {
      setError('Solo se permiten imagenes o archivos PDF.');
      event.target.value = '';
      setArchivoSeleccionado(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('El archivo supera el maximo permitido de 10 MB.');
      event.target.value = '';
      setArchivoSeleccionado(null);
      return;
    }

    setArchivoSeleccionado(file);
  };

  const handleUpload = async () => {
    if (!archivoSeleccionado) {
      setError('Selecciona un archivo antes de subirlo.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const nuevoAdjunto = await subirAdjunto(
        orgId,
        entidadTipo,
        entidadId,
        archivoSeleccionado,
        tipoAdjunto,
        usuarioId,
        descripcion.trim() || undefined
      );

      setAdjuntos((prev) => [nuevoAdjunto, ...prev]);
      clearUploadForm();
      setSuccess('Adjunto subido correctamente.');
    } catch (uploadError) {
      console.error('Error subiendo adjunto:', uploadError);
      setError('No se pudo subir el adjunto.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (adjuntoId: string) => {
    setDeletingId(adjuntoId);
    setError(null);
    setSuccess(null);

    try {
      await eliminarAdjunto(orgId, adjuntoId);
      setAdjuntos((prev) => prev.filter((adjunto) => adjunto.id !== adjuntoId));
      setSuccess('Adjunto eliminado correctamente.');
    } catch (deleteError) {
      console.error('Error eliminando adjunto:', deleteError);
      setError('No se pudo eliminar el adjunto.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-slate-900">Adjuntos</CardTitle>
        <CardDescription>
          Consulta archivos relacionados con esta entidad y gestiona nuevas cargas.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando adjuntos...</span>
            </div>
          ) : adjuntos.length ? (
            <div className="space-y-3">
              {adjuntos.map((adjunto) => {
                const Icon = getAdjuntoIcon(adjunto);
                return (
                  <div
                    key={adjunto.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <a
                          href={adjunto.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
                        >
                          {adjunto.nombre}
                        </a>
                        <p className="text-xs text-slate-500">
                          {formatFecha(adjunto.createdAt)} - {adjunto.subidoPorNombre || adjunto.subidoPor} -{' '}
                          {formatBytes(adjunto.tamaño)}
                        </p>
                        {adjunto.descripcion ? (
                          <p className="text-xs text-slate-600">{adjunto.descripcion}</p>
                        ) : null}
                      </div>
                    </div>

                    {!soloLectura ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(adjunto.id)}
                        disabled={deletingId === adjunto.id}
                        className="self-start text-red-600 hover:bg-red-50 hover:text-red-700 sm:self-center"
                      >
                        {deletingId === adjunto.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="ml-2">Eliminar</span>
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
              No hay adjuntos cargados para esta entidad.
            </div>
          )}
        </div>

        {!soloLectura ? (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="space-y-2">
              <Label htmlFor={`adjunto-${entidadTipo}-${entidadId}`}>Archivo</Label>
              <Input
                ref={inputRef}
                id={`adjunto-${entidadTipo}-${entidadId}`}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <p className="text-xs text-slate-500">Formatos permitidos: imagenes o PDF. Maximo 10 MB.</p>
              {selectedFileSummary ? <p className="text-sm text-slate-700">{selectedFileSummary}</p> : null}
            </div>

            {archivoSeleccionado ? (
              <>
                <div className="space-y-2">
                  <Label>Tipo de adjunto</Label>
                  <Select
                    value={tipoAdjunto}
                    onValueChange={(value) => setTipoAdjunto(value as TipoAdjunto)}
                    disabled={uploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_ADJUNTO.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`descripcion-adjunto-${entidadId}`}>Descripcion opcional</Label>
                  <textarea
                    id={`descripcion-adjunto-${entidadId}`}
                    rows={3}
                    value={descripcion}
                    onChange={(event) => setDescripcion(event.target.value)}
                    disabled={uploading}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Agrega un comentario breve sobre este archivo"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={() => void handleUpload()} disabled={uploading}>
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {uploading ? 'Subiendo...' : 'Subir'}
                  </Button>

                  <Button type="button" variant="outline" onClick={clearUploadForm} disabled={uploading}>
                    Limpiar
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
