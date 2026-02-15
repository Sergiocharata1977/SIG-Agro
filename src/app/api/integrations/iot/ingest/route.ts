import { NextRequest, NextResponse } from 'next/server';
import { ingestarTelemetriaIoT } from '@/services/integration-hub';
import type { IoTSensorPayload } from '@/types/integrations';

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as IoTSensorPayload;

    if (!payload?.organizationId || !payload?.externalEventId || !payload?.metric) {
      return NextResponse.json({ error: 'organizationId, externalEventId y metric son requeridos' }, { status: 400 });
    }

    const result = await ingestarTelemetriaIoT(payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error iot ingest:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
