export interface IncidenceRow {
  oblast: string;
  disease: string;
  age_group: string;
  cases: number;
  population: number;
  incidence: number;
}

export interface MonthDataset {
  month: string;
  rows: IncidenceRow[];
}

export type NumericChange =
  | {
      kind: 'percentage';
      current: number;
      previous: number;
      percentage: number;
    }
  | {
      kind: 'from-zero';
      current: number;
      previous: 0;
      absolute: number;
    }
  | {
      kind: 'unchanged-zero';
      current: 0;
      previous: 0;
      absolute: 0;
    };

export interface TopRegionMetric {
  region: string;
  cases: number;
  incidence: number;
  incidenceChange: NumericChange;
}

export interface PositiveGrowthMetric {
  count: number;
  percentage: number;
  totalRegions: number;
}

export interface DiseaseMetrics {
  disease: string;
  currentCases: number;
  previousCases: number;
  caseChange: NumericChange;
  nationalIncidence: number;
  positiveGrowth: PositiveGrowthMetric;
  regionsAboveNational: string[];
  topRegions: TopRegionMetric[];
  zeroCaseRegions: string[];
}

export interface AnalysisOptions {
  current: MonthDataset;
  previous: MonthDataset;
  ageGroup: string;
  selectedDiseases: readonly string[];
  threshold: number;
  regions: readonly string[];
  nationalAggregate: string;
}
