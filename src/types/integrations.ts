export interface IoTSensorPayload {
  organizationId: string;
  externalEventId: string;
  provider: string;
  sourceDeviceId: string;
  metric: string;
  value: number;
  unit: string;
  measuredAt: string;
  fieldId?: string;
  plotId?: string;
  quality?: 'good' | 'suspect' | 'invalid';
  rawPayload?: string;
}

export interface MachineryTaskPayload {
  organizationId: string;
  taskId?: string;
  externalTaskId: string;
  plotId: string;
  taskType: 'siembra' | 'riego' | 'fertilizacion' | 'aplicacion' | 'cosecha';
  parameters: Record<string, unknown>;
  scheduledAt: string;
}

export interface MachineryTaskEventPayload {
  organizationId: string;
  externalEventId: string;
  externalTaskId: string;
  status: 'received' | 'running' | 'completed' | 'failed';
  timestamp: string;
  details?: string;
}

export interface IntegrationResult {
  success: boolean;
  id: string;
  duplicate?: boolean;
  message?: string;
}
