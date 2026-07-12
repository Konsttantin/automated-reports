import { calculateChange } from './calculate-change';
import type {
  AnalysisOptions,
  DiseaseMetrics,
  IncidenceRow,
  MonthDataset,
} from './types';

type DiseaseIndex = Map<string, Map<string, IncidenceRow>>;

function assertNonEmptyUniqueValues(values: readonly string[], label: string) {
  if (values.length === 0) throw new Error(`${label} must not be empty.`);
  if (new Set(values).size !== values.length) throw new Error(`${label} must contain unique values.`);
  if (values.some((value) => value.trim() === '')) throw new Error(`${label} must not contain empty values.`);
}

function indexMonth(
  dataset: MonthDataset,
  ageGroup: string,
  allowedTerritories: ReadonlySet<string>,
): DiseaseIndex {
  const index: DiseaseIndex = new Map();

  for (const row of dataset.rows) {
    if (row.age_group !== ageGroup) continue;
    if (!allowedTerritories.has(row.oblast)) {
      throw new Error(`${dataset.month}: unexpected territory "${row.oblast}".`);
    }

    const diseaseRows = index.get(row.disease) ?? new Map<string, IncidenceRow>();
    if (diseaseRows.has(row.oblast)) {
      throw new Error(`${dataset.month}: duplicate row for "${row.disease}" in "${row.oblast}".`);
    }
    diseaseRows.set(row.oblast, row);
    index.set(row.disease, diseaseRows);
  }

  return index;
}

function requireRow(
  index: DiseaseIndex,
  disease: string,
  territory: string,
  month: string,
): IncidenceRow {
  const row = index.get(disease)?.get(territory);
  if (!row) {
    throw new Error(`${month}: missing row for "${disease}" in "${territory}".`);
  }
  return row;
}

function validateOptions(options: AnalysisOptions) {
  if (!Number.isInteger(options.threshold) || options.threshold < 1) {
    throw new Error('Threshold must be a positive integer.');
  }
  if (options.ageGroup.trim() === '') throw new Error('Age group must not be empty.');
  if (options.nationalAggregate.trim() === '') throw new Error('National aggregate must not be empty.');
  if (options.current.month === options.previous.month) {
    throw new Error('Current and previous months must be different.');
  }
  assertNonEmptyUniqueValues(options.regions, 'Regions');
  if (options.regions.includes(options.nationalAggregate)) {
    throw new Error('The national aggregate must not be included in regions.');
  }
}

function analyzeDisease(
  disease: string,
  currentIndex: DiseaseIndex,
  previousIndex: DiseaseIndex,
  options: AnalysisOptions,
): DiseaseMetrics {
  const currentNational = requireRow(
    currentIndex,
    disease,
    options.nationalAggregate,
    options.current.month,
  );
  const previousNational = requireRow(
    previousIndex,
    disease,
    options.nationalAggregate,
    options.previous.month,
  );

  const regionPairs = options.regions.map((region) => ({
    region,
    current: requireRow(currentIndex, disease, region, options.current.month),
    previous: requireRow(previousIndex, disease, region, options.previous.month),
  }));

  const positiveGrowthCount = regionPairs.filter(
    ({ current, previous }) => current.incidence > previous.incidence,
  ).length;

  const regionsAboveNational = regionPairs
    .filter(({ current }) => current.incidence > currentNational.incidence)
    .map(({ region }) => region);

  const topRegions = regionPairs
    .filter(({ current }) => current.cases > 0)
    .sort((left, right) => (
      right.current.incidence - left.current.incidence
      || right.current.cases - left.current.cases
      || left.region.localeCompare(right.region, 'uk')
    ))
    .slice(0, 3)
    .map(({ current, previous, region }) => ({
      region,
      cases: current.cases,
      incidence: current.incidence,
      incidenceChange: calculateChange(current.incidence, previous.incidence),
    }));

  const zeroCaseRegions = regionPairs
    .filter(({ current }) => current.cases === 0)
    .map(({ region }) => region);

  return {
    disease,
    currentCases: currentNational.cases,
    previousCases: previousNational.cases,
    caseChange: calculateChange(currentNational.cases, previousNational.cases),
    nationalIncidence: currentNational.incidence,
    positiveGrowth: {
      count: positiveGrowthCount,
      percentage: Math.round((positiveGrowthCount / options.regions.length) * 100),
      totalRegions: options.regions.length,
    },
    regionsAboveNational,
    topRegions,
    zeroCaseRegions,
  };
}

export function analyzeDiseases(options: AnalysisOptions): DiseaseMetrics[] {
  validateOptions(options);

  const selectedDiseases = [...new Set(options.selectedDiseases)];
  if (selectedDiseases.length === 0) return [];

  const allowedTerritories = new Set([...options.regions, options.nationalAggregate]);
  const currentIndex = indexMonth(options.current, options.ageGroup, allowedTerritories);
  const previousIndex = indexMonth(options.previous, options.ageGroup, allowedTerritories);

  return selectedDiseases.flatMap((disease) => {
    const currentNational = requireRow(
      currentIndex,
      disease,
      options.nationalAggregate,
      options.current.month,
    );

    if (currentNational.cases < options.threshold) return [];
    return [analyzeDisease(disease, currentIndex, previousIndex, options)];
  });
}
