export type Language = 'uk' | 'en';

export interface DatasetMetadata {
  fileName: string;
  rowCount: number;
  diseaseCount: number;
  monthCount: number;
}

export interface MonthDescriptor {
  month: string;
  file: string;
  rowCount: number;
}

export interface GeneratedDatasetMetadata {
  schemaVersion: number;
  source: {
    fileName: string;
    publicFile: string;
    sheetName: string;
    rowCount: number;
    excludedRowCount: number;
  };
  nationalAggregate: string;
  regionCount: number;
  regions: string[];
  territories: string[];
  diseases: string[];
  ageGroups: string[];
  months: MonthDescriptor[];
}

export interface DatasetRow {
  oblast: string;
  month: string;
  disease: string;
  age_group: string;
  cases: number;
  population: number;
  incidence: number;
}

export interface ReportPreview {
  disease: string;
  text: string;
}

export interface ReportSettingsValue {
  month: string;
  ageGroup: string;
  threshold: number;
  selectedDiseases: string[];
}

export interface SelectOption {
  value: string;
  label: string;
}
