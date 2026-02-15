import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateTask, mockTaskEvent } = vi.hoisted(() => ({
  mockCreateTask: vi.fn(),
  mockTaskEvent: vi.fn(),
}));

vi.mock('@/services/integration-hub', () => ({
  crearTareaMaquinaria: mockCreateTask,
  registrarEventoMaquinaria: mockTaskEvent,
}));

import { POST as postTask } from '@/app/api/integrations/machinery/tasks/route';
import { POST as postEvent } from '@/app/api/integrations/machinery/events/route';

describe('POST /api/integrations/machinery/*', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crea tarea maquinaria', async () => {
    mockCreateTask.mockResolvedValue({ success: true, id: 'task-1' });

    const request = new Request('http://localhost/api/integrations/machinery/tasks', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-1',
        externalTaskId: 'ext-task-1',
        plotId: 'plot-1',
        taskType: 'riego',
        parameters: { mm: 20 },
        scheduledAt: new Date().toISOString(),
      }),
    });

    const response = await postTask(request as never);
    expect(response.status).toBe(200);
  });

  it('registra evento maquinaria', async () => {
    mockTaskEvent.mockResolvedValue({ success: true, id: 'event-1' });

    const request = new Request('http://localhost/api/integrations/machinery/events', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-1',
        externalEventId: 'evt-1',
        externalTaskId: 'ext-task-1',
        status: 'completed',
        timestamp: new Date().toISOString(),
      }),
    });

    const response = await postEvent(request as never);
    expect(response.status).toBe(200);
  });
});
