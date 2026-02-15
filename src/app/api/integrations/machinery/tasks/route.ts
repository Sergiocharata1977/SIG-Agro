import { NextRequest, NextResponse } from 'next/server';
import { crearTareaMaquinaria } from '@/services/integration-hub';
import type { MachineryTaskPayload } from '@/types/integrations';

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as MachineryTaskPayload;

    if (!payload?.organizationId || !payload?.externalTaskId || !payload?.plotId || !payload?.taskType) {
      return NextResponse.json(
        { error: 'organizationId, externalTaskId, plotId y taskType son requeridos' },
        { status: 400 }
      );
    }

    const result = await crearTareaMaquinaria(payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error machinery tasks:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
