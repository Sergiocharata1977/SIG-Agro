import rulesetJson from '@/config/dss-agronomico-ruleset.v1.json';
import type {
  DssAlert,
  DssErrorCode,
  DssEvaluationInput,
  DssEvaluationResult,
  DssExecutionLogEntry,
  DssRule,
  DssRuleCondition,
  DssRuleSet,
  DssSlaConfig,
} from '@/types/dss-agronomico';

const DEFAULT_SLA: DssSlaConfig = {
  maxRules: 100,
  maxTotalEvaluationMs: 250,
  maxRuleEvaluationMs: 25,
};

function compare(metricValue: number, operator: DssRuleCondition['operator'], ruleValue: number): boolean {
  switch (operator) {
    case '>': return metricValue > ruleValue;
    case '>=': return metricValue >= ruleValue;
    case '<': return metricValue < ruleValue;
    case '<=': return metricValue <= ruleValue;
    case '==': return metricValue === ruleValue;
    case '!=': return metricValue !== ruleValue;
    default: return false;
  }
}

function validateRuleSet(ruleset: DssRuleSet): DssErrorCode[] {
  const errors: DssErrorCode[] = [];
  if (!ruleset?.version || !Array.isArray(ruleset.rules)) {
    errors.push('RULESET_INVALID');
  }
  return errors;
}

export class AgronomicDssEngine {
  private readonly ruleset: DssRuleSet;
  private readonly sla: DssSlaConfig;

  constructor(ruleset: DssRuleSet = rulesetJson as DssRuleSet, slaConfig?: Partial<DssSlaConfig>) {
    this.ruleset = ruleset;
    this.sla = { ...DEFAULT_SLA, ...(slaConfig || {}) };
  }

  evaluate(input: DssEvaluationInput): DssEvaluationResult {
    const startTotal = Date.now();
    const errors: DssErrorCode[] = [];
    const executionLog: DssExecutionLogEntry[] = [];
    const alerts: DssAlert[] = [];

    errors.push(...validateRuleSet(this.ruleset));
    if (errors.length > 0) {
      return {
        rulesetVersion: this.ruleset?.version || 'invalid',
        alerts,
        executionLog,
        totalEvaluationMs: Date.now() - startTotal,
        errors,
        sla: this.sla,
      };
    }

    const enabledRules = this.ruleset.rules.filter((rule) => rule.enabled);
    if (enabledRules.length > this.sla.maxRules) {
      errors.push('SLA_RULE_LIMIT_EXCEEDED');
      return {
        rulesetVersion: this.ruleset.version,
        alerts,
        executionLog,
        totalEvaluationMs: Date.now() - startTotal,
        errors,
        sla: this.sla,
      };
    }

    for (const rule of enabledRules) {
      const startRule = Date.now();

      if (Date.now() - startTotal > this.sla.maxTotalEvaluationMs) {
        errors.push('SLA_TOTAL_EVALUATION_EXCEEDED');
        executionLog.push({
          ruleId: rule.id,
          status: 'skipped',
          evaluationMs: Date.now() - startRule,
          conditions: rule.conditions,
          matchedConditions: 0,
          errorCode: 'SLA_TOTAL_EVALUATION_EXCEEDED',
          message: 'Se supero el tiempo total de evaluacion',
        });
        break;
      }

      try {
        const matchedConditions = rule.conditions.filter((condition) => {
          const metricValue = input.metrics[condition.metric];
          if (typeof metricValue !== 'number') return false;
          return compare(metricValue, condition.operator, condition.value);
        }).length;

        const isTriggered = rule.allConditionsRequired === false
          ? matchedConditions > 0
          : matchedConditions === rule.conditions.length;

        const ruleMs = Date.now() - startRule;
        if (ruleMs > this.sla.maxRuleEvaluationMs) {
          errors.push('SLA_RULE_EVALUATION_EXCEEDED');
          executionLog.push({
            ruleId: rule.id,
            status: 'error',
            evaluationMs: ruleMs,
            conditions: rule.conditions,
            matchedConditions,
            errorCode: 'SLA_RULE_EVALUATION_EXCEEDED',
            message: 'Tiempo maximo por regla excedido',
          });
          continue;
        }

        executionLog.push({
          ruleId: rule.id,
          status: isTriggered ? 'triggered' : 'passed',
          evaluationMs: ruleMs,
          conditions: rule.conditions,
          matchedConditions,
          message: isTriggered ? 'Regla disparada' : 'Regla no disparada',
        });

        if (isTriggered) {
          alerts.push(this.buildAlert(rule));
        }
      } catch {
        errors.push('RULE_EVALUATION_ERROR');
        executionLog.push({
          ruleId: rule.id,
          status: 'error',
          evaluationMs: Date.now() - startRule,
          conditions: rule.conditions,
          matchedConditions: 0,
          errorCode: 'RULE_EVALUATION_ERROR',
          message: 'Error evaluando regla',
        });
      }
    }

    return {
      rulesetVersion: this.ruleset.version,
      alerts,
      executionLog,
      totalEvaluationMs: Date.now() - startTotal,
      errors,
      sla: this.sla,
    };
  }

  getRuleSetVersion(): string {
    return this.ruleset.version;
  }

  private buildAlert(rule: DssRule): DssAlert {
    return {
      id: `${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      title: rule.title,
      severity: rule.severity,
      confidence: rule.confidence,
      recommendation: rule.recommendation,
      explanation: rule.explanation,
      triggeredAt: new Date().toISOString(),
    };
  }
}

export function evaluateAgronomicDss(
  input: DssEvaluationInput,
  slaConfig?: Partial<DssSlaConfig>
): DssEvaluationResult {
  const engine = new AgronomicDssEngine(undefined, slaConfig);
  return engine.evaluate(input);
}
