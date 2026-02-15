export type DssSeverity = 'info' | 'warning' | 'critical';
export type DssExecutionStatus = 'triggered' | 'passed' | 'error' | 'skipped';

export interface DssRuleCondition {
  metric: string;
  operator: '>' | '>=' | '<' | '<=' | '==' | '!=';
  value: number;
}

export interface DssRule {
  id: string;
  title: string;
  description: string;
  severity: DssSeverity;
  confidence: number;
  recommendation: string;
  explanation: string;
  conditions: DssRuleCondition[];
  allConditionsRequired?: boolean;
  enabled: boolean;
}

export interface DssRuleSet {
  version: string;
  name: string;
  description: string;
  rules: DssRule[];
}

export interface DssAlert {
  id: string;
  ruleId: string;
  title: string;
  severity: DssSeverity;
  confidence: number;
  recommendation: string;
  explanation: string;
  triggeredAt: string;
}

export interface DssExecutionLogEntry {
  ruleId: string;
  status: DssExecutionStatus;
  evaluationMs: number;
  conditions: DssRuleCondition[];
  matchedConditions: number;
  message?: string;
  errorCode?: DssErrorCode;
}

export interface DssSlaConfig {
  maxRules: number;
  maxTotalEvaluationMs: number;
  maxRuleEvaluationMs: number;
}

export type DssErrorCode =
  | 'RULESET_INVALID'
  | 'SLA_RULE_LIMIT_EXCEEDED'
  | 'SLA_TOTAL_EVALUATION_EXCEEDED'
  | 'SLA_RULE_EVALUATION_EXCEEDED'
  | 'RULE_EVALUATION_ERROR';

export interface DssEvaluationInput {
  organizationId: string;
  campaignId?: string;
  fieldId?: string;
  plotId?: string;
  metrics: Record<string, number>;
}

export interface DssEvaluationResult {
  rulesetVersion: string;
  alerts: DssAlert[];
  executionLog: DssExecutionLogEntry[];
  totalEvaluationMs: number;
  errors: DssErrorCode[];
  sla: DssSlaConfig;
}
