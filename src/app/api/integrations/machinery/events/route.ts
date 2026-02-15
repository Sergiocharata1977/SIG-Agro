import { NextRequest, NextResponse } from 'next/server';
import { registrarEventoMaquinaria } from '@/services/integration-hub';
import type { MachineryTaskEventPayload } from '@/types/integrations';

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as MachineryTaskEventPayload;

    if (!payload?.organizationId || !payload?.externalEventId || !payload?.externalTaskId || !payload?.status) {
      return NextResponse.json(
        { error: 'organizationId, externalEventId, externalTaskId y status son requeridos' },
        { status: 400 }
      );
    }

    const result = await registrarEventoMaquinaria(payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error machinery events:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
