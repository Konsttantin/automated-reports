import type { DiseaseMetrics, NumericChange } from '../domain';
import { getDiseaseGenitive } from './disease-forms';
import {
  formatCases,
  formatNumber,
  formatUkrainianList,
  getAgeGroupPhrase,
  parseReportMonth,
} from './language-forms';
import { getRegionLocative } from './region-forms';

export interface ReportContext {
  currentMonth: string;
  previousMonth: string;
  ageGroup: string;
}

export interface GeneratedReport {
  disease: string;
  text: string;
}

function formatCaseComparison(change: NumericChange, previousMonth: string): string {
  const month = parseReportMonth(previousMonth);
  const comparisonPeriod = `${month.instrumental} ${month.year} року`;

  if (change.kind === 'from-zero') {
    return `Порівняно з ${comparisonPeriod} приріст кількості випадків становив +${formatCases(change.absolute)} (з 0 до ${formatNumber(change.current, 0)}).`;
  }
  if (change.kind === 'unchanged-zero') {
    return `Порівняно з ${comparisonPeriod} кількість випадків не змінилася.`;
  }
  if (change.percentage > 0) {
    return `Порівняно з минулим місяцем, ${comparisonPeriod}, кількість випадків зросла на ${change.percentage}%.`;
  }
  if (change.percentage < 0) {
    return `Порівняно з минулим місяцем, ${comparisonPeriod}, кількість випадків зменшилася на ${Math.abs(change.percentage)}%.`;
  }
  return `Порівняно з минулим місяцем, ${comparisonPeriod}, кількість випадків не змінилася.`;
}

function formatIncidenceChange(change: NumericChange): string {
  if (change.kind === 'from-zero') return `+${formatNumber(change.absolute, 2)}`;
  if (change.kind === 'unchanged-zero') return '0';
  return `${change.percentage > 0 ? '+' : ''}${change.percentage}%`;
}

function formatAboveNationalSentence(metrics: DiseaseMetrics): string {
  if (metrics.regionsAboveNational.length === 0) {
    return 'Перевищення національного показника захворюваності у регіонах не спостерігалося.';
  }

  const regions = metrics.regionsAboveNational.map(getRegionLocative);
  return `Перевищення національного показника захворюваності у поточному місяці спостерігалося у ${formatUkrainianList(regions)}.`;
}

function formatTopRegionsSentence(metrics: DiseaseMetrics): string | null {
  if (metrics.topRegions.length === 0) return null;

  const regions = metrics.topRegions.map((region) => (
    `${getRegionLocative(region.region)} (усього ${formatCases(region.cases)}, ПЗ — ${formatNumber(region.incidence, 1)}, зміна ПЗ — ${formatIncidenceChange(region.incidenceChange)})`
  ));
  const subject = metrics.topRegions.length === 1 ? 'Найвищий показник' : 'Найвищі показники';

  return `${subject} захворюваності на 100 000 населення у поточному місяці зафіксовано у ${formatUkrainianList(regions)}.`;
}

function formatZeroCasesSentence(metrics: DiseaseMetrics, diseaseForm: string): string | null {
  if (metrics.zeroCaseRegions.length === 0) return null;
  const regions = metrics.zeroCaseRegions.map(getRegionLocative);
  return `Випадки ${diseaseForm} не реєструвалися у ${formatUkrainianList(regions)}.`;
}

export function generateReport(metrics: DiseaseMetrics, context: ReportContext): GeneratedReport {
  const currentMonth = parseReportMonth(context.currentMonth);
  const diseaseForm = getDiseaseGenitive(metrics.disease);
  const ageGroupPhrase = getAgeGroupPhrase(context.ageGroup);
  const sentences = [
    `${metrics.disease}: Протягом ${currentMonth.genitive} ${currentMonth.year} року зареєстровано ${formatCases(metrics.currentCases)} ${diseaseForm}${ageGroupPhrase}.`,
    formatCaseComparison(metrics.caseChange, context.previousMonth),
    `У ${metrics.positiveGrowth.percentage}% регіонів спостерігався позитивний приріст показника захворюваності.`,
    `Показник захворюваності на 100 000 населення по Україні становив ${formatNumber(metrics.nationalIncidence)}.`,
    formatAboveNationalSentence(metrics),
    formatTopRegionsSentence(metrics),
    formatZeroCasesSentence(metrics, diseaseForm),
  ].filter((sentence): sentence is string => sentence !== null);

  return {
    disease: metrics.disease,
    text: sentences.join(' '),
  };
}

export function generateReports(
  metrics: readonly DiseaseMetrics[],
  context: ReportContext,
): GeneratedReport[] {
  return metrics.map((item) => generateReport(item, context));
}
