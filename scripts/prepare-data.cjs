const fs = require('node:fs');
const path = require('node:path');
const XLSX = require('xlsx');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'data');
const SOURCE_FILE_NAME = 'source.xlsx';
const SOURCE_FILE = path.join(OUTPUT_DIR, SOURCE_FILE_NAME);
const METADATA_FILE = path.join(OUTPUT_DIR, 'metadata.json');

const REQUIRED_COLUMNS = [
  'oblast',
  'month',
  'disease',
  'age_group',
  'cases',
  'population',
  'incidence',
];

const NATIONAL_AGGREGATE = 'Україна';
const EXCLUDED_TERRITORIES = new Set([
  'Автономна Республіка Крим',
  'Севастополь',
]);

const AGE_GROUP_ORDER = [
  'До 1-го року',
  '1-4 роки',
  '5-9 років',
  '10-14 років',
  '15-17 років',
  '0-17 років',
  'Всього випадків',
];

function fail(message) {
  throw new Error(`[prepare-data] ${message}`);
}

function normalizeText(value, column, rowNumber) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`Row ${rowNumber}: "${column}" must be a non-empty string.`);
  }

  return value.trim();
}

function normalizeNumber(value, column, rowNumber, { integer = false } = {}) {
  const number = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));

  if (!Number.isFinite(number) || number < 0) {
    fail(`Row ${rowNumber}: "${column}" must be a non-negative number.`);
  }

  if (integer && !Number.isInteger(number)) {
    fail(`Row ${rowNumber}: "${column}" must be an integer.`);
  }

  return number;
}

function normalizeMonth(value, rowNumber) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) fail(`Row ${rowNumber}: invalid Excel date in "month".`);
    return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }

  const month = String(value).trim().slice(0, 10);
  if (!/^2023-(0[1-9]|1[0-2])-01$/.test(month)) {
    fail(`Row ${rowNumber}: unsupported month "${value}".`);
  }

  return month;
}

function sortUkrainian(values) {
  return [...values].sort((left, right) => left.localeCompare(right, 'uk'));
}

function readWorksheet() {
  if (!fs.existsSync(SOURCE_FILE)) {
    fail(`Source file not found: ${SOURCE_FILE_NAME}`);
  }

  const workbook = XLSX.readFile(SOURCE_FILE, { cellDates: false });
  if (workbook.SheetNames.length === 0) fail('The workbook has no worksheets.');

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const headerRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    range: 0,
    blankrows: false,
  });
  const headers = headerRows[0] ?? [];

  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  const unexpectedColumns = headers.filter((column) => !REQUIRED_COLUMNS.includes(column));

  if (missingColumns.length > 0) {
    fail(`Missing columns: ${missingColumns.join(', ')}`);
  }
  if (unexpectedColumns.length > 0) {
    fail(`Unexpected columns: ${unexpectedColumns.join(', ')}`);
  }

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: true,
  });

  return { rows, sheetName };
}

function normalizeRows(sourceRows) {
  const rowsByMonth = new Map();
  const uniqueKeys = new Set();
  const territories = new Set();
  const diseases = new Set();
  const ageGroups = new Set();
  let excludedRowCount = 0;

  sourceRows.forEach((sourceRow, index) => {
    const rowNumber = index + 2;
    const oblast = normalizeText(sourceRow.oblast, 'oblast', rowNumber);

    if (EXCLUDED_TERRITORIES.has(oblast)) {
      excludedRowCount += 1;
      return;
    }

    const month = normalizeMonth(sourceRow.month, rowNumber);
    const disease = normalizeText(sourceRow.disease, 'disease', rowNumber);
    const ageGroup = normalizeText(sourceRow.age_group, 'age_group', rowNumber);
    const cases = normalizeNumber(sourceRow.cases, 'cases', rowNumber, { integer: true });
    const population = normalizeNumber(sourceRow.population, 'population', rowNumber, { integer: true });
    const incidence = normalizeNumber(sourceRow.incidence, 'incidence', rowNumber);
    const uniqueKey = `${oblast}\u0000${month}\u0000${disease}\u0000${ageGroup}`;

    if (uniqueKeys.has(uniqueKey)) {
      fail(`Row ${rowNumber}: duplicate oblast/month/disease/age_group combination.`);
    }
    uniqueKeys.add(uniqueKey);

    territories.add(oblast);
    diseases.add(disease);
    ageGroups.add(ageGroup);

    const monthRows = rowsByMonth.get(month) ?? [];
    monthRows.push({
      oblast,
      disease,
      age_group: ageGroup,
      cases,
      population,
      incidence,
    });
    rowsByMonth.set(month, monthRows);
  });

  return {
    ageGroups,
    diseases,
    excludedRowCount,
    rowsByMonth,
    territories,
  };
}

function validateDataset({ ageGroups, diseases, rowsByMonth, territories }) {
  const months = [...rowsByMonth.keys()].sort();
  const regions = [...territories].filter((territory) => territory !== NATIONAL_AGGREGATE);
  const unexpectedAgeGroups = [...ageGroups].filter((group) => !AGE_GROUP_ORDER.includes(group));
  const missingAgeGroups = AGE_GROUP_ORDER.filter((group) => !ageGroups.has(group));

  if (!territories.has(NATIONAL_AGGREGATE)) {
    fail(`National aggregate "${NATIONAL_AGGREGATE}" is missing.`);
  }
  if (regions.length !== 25) {
    fail(`Expected 25 regions, found ${regions.length}.`);
  }
  if (months.length !== 12) {
    fail(`Expected 12 months, found ${months.length}.`);
  }
  if (diseases.size !== 67) {
    fail(`Expected 67 diseases, found ${diseases.size}.`);
  }
  if (unexpectedAgeGroups.length > 0 || missingAgeGroups.length > 0) {
    fail(`Age group catalog does not match the expected seven groups.`);
  }

  const expectedRowsPerMonth = territories.size * diseases.size * ageGroups.size;
  for (const month of months) {
    const actualRows = rowsByMonth.get(month).length;
    if (actualRows !== expectedRowsPerMonth) {
      fail(`${month}: expected ${expectedRowsPerMonth} rows, found ${actualRows}.`);
    }
  }

  return { months, regions };
}

function sortMonthRows(rows) {
  const ageOrder = new Map(AGE_GROUP_ORDER.map((group, index) => [group, index]));

  rows.sort((left, right) => (
    left.oblast.localeCompare(right.oblast, 'uk')
    || left.disease.localeCompare(right.disease, 'uk')
    || ageOrder.get(left.age_group) - ageOrder.get(right.age_group)
  ));
}

function writeArtifacts(dataset, sheetName) {
  const { ageGroups, diseases, excludedRowCount, rowsByMonth, territories } = dataset;
  const { months, regions } = validateDataset(dataset);
  const totalRows = [...rowsByMonth.values()].reduce((sum, rows) => sum + rows.length, 0);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const monthFiles = months.map((month) => {
    const rows = rowsByMonth.get(month);
    sortMonthRows(rows);
    const fileName = `${month}.json`;
    const payload = { month, rows };
    fs.writeFileSync(path.join(OUTPUT_DIR, fileName), JSON.stringify(payload), 'utf8');
    return { month, file: fileName, rowCount: rows.length };
  });

  const metadata = {
    schemaVersion: 1,
    source: {
      fileName: SOURCE_FILE_NAME,
      publicFile: SOURCE_FILE_NAME,
      sheetName,
      rowCount: totalRows,
      excludedRowCount,
    },
    nationalAggregate: NATIONAL_AGGREGATE,
    regionCount: regions.length,
    regions: sortUkrainian(regions),
    territories: sortUkrainian(territories),
    diseases: sortUkrainian(diseases),
    ageGroups: AGE_GROUP_ORDER,
    months: monthFiles,
  };

  fs.writeFileSync(METADATA_FILE, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');

  return metadata;
}

function main() {
  console.time('Prepared data');
  const { rows, sheetName } = readWorksheet();
  const dataset = normalizeRows(rows);
  const metadata = writeArtifacts(dataset, sheetName);

  console.log(`Source rows: ${rows.length.toLocaleString('en-US')}`);
  console.log(`Output rows: ${metadata.source.rowCount.toLocaleString('en-US')}`);
  console.log(`Months: ${metadata.months.length}`);
  console.log(`Regions: ${metadata.regionCount}`);
  console.log(`Diseases: ${metadata.diseases.length}`);
  console.log(`Age groups: ${metadata.ageGroups.length}`);
  console.log(`Output directory: ${path.relative(ROOT_DIR, OUTPUT_DIR)}`);
  console.timeEnd('Prepared data');
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
