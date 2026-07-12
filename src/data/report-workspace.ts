import { analyzeDiseases, type DiseaseMetrics, type MonthDataset } from '../domain';
import { generateReports, type GeneratedReport } from '../reports';
import type {
  DatasetRow,
  GeneratedDatasetMetadata,
  MonthDescriptor,
  ReportSettingsValue,
} from '../types';
import { loadMonth } from './data-client';

export interface ReportWorkspaceResult {
  settings: ReportSettingsValue;
  current: MonthDataset;
  previous: MonthDataset;
  metrics: DiseaseMetrics[];
  reports: GeneratedReport[];
  previewRows: DatasetRow[];
}

export function createInitialSettings(metadata: GeneratedDatasetMetadata): ReportSettingsValue {
  const latestMonth = metadata.months.at(-1);
  if (!latestMonth) throw new Error('Dataset does not contain reporting months.');

  return {
    month: latestMonth.month,
    ageGroup: metadata.ageGroups.includes('Всього випадків')
      ? 'Всього випадків'
      : metadata.ageGroups[0],
    threshold: 10,
    selectedDiseases: [...metadata.diseases],
  };
}

export function getMonthPair(
  metadata: GeneratedDatasetMetadata,
  currentMonth: string,
): { current: MonthDescriptor; previous: MonthDescriptor } {
  const index = metadata.months.findIndex(({ month }) => month === currentMonth);
  if (index < 1) throw new Error(`Month "${currentMonth}" has no previous month.`);
  return { current: metadata.months[index], previous: metadata.months[index - 1] };
}

export async function createReportWorkspaceResult(
  metadata: GeneratedDatasetMetadata,
  settings: ReportSettingsValue,
): Promise<ReportWorkspaceResult> {
  const descriptors = getMonthPair(metadata, settings.month);
  const [current, previous] = await Promise.all([
    loadMonth(descriptors.current),
    loadMonth(descriptors.previous),
  ]);
  const metrics = analyzeDiseases({
    current,
    previous,
    ageGroup: settings.ageGroup,
    selectedDiseases: settings.selectedDiseases,
    threshold: settings.threshold,
    regions: metadata.regions,
    nationalAggregate: metadata.nationalAggregate,
  });
  const reports = generateReports(metrics, {
    currentMonth: current.month,
    previousMonth: previous.month,
    ageGroup: settings.ageGroup,
  });
  const previewRows = current.rows.slice(0, 10).map((row) => ({
    ...row,
    month: current.month,
  }));

  return {
    settings: {
      ...settings,
      selectedDiseases: [...settings.selectedDiseases],
    },
    current,
    previous,
    metrics,
    reports,
    previewRows,
  };
}
