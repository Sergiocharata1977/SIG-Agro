import { NextRequest, NextResponse } from 'next/server';
import { evaluateAgronomicDss } from '@/services/dss/AgronomicDssEngine';
import type { DssEvaluationInput } from '@/types/dss-agronomico';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DssEvaluationInput;

    if (!body?.organizationId || !body?.metrics || typeof body.metrics !== 'object') {
      return NextResponse.json(
        { error: 'organizationId y metrics son requeridos' },
        { status: 400 }
      );
    }

    const result = evaluateAgronomicDss(body);

    return NextResponse.json({
      success: result.errors.length === 0,
      ...result,
    });
  } catch (error) {
    console.error('Error en /api/agro/dss/evaluate', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
