interface MonthForm {
  genitive: string;
  instrumental: string;
}

const monthForms: Record<string, MonthForm> = {
  '01': { genitive: 'січня', instrumental: 'січнем' },
  '02': { genitive: 'лютого', instrumental: 'лютим' },
  '03': { genitive: 'березня', instrumental: 'березнем' },
  '04': { genitive: 'квітня', instrumental: 'квітнем' },
  '05': { genitive: 'травня', instrumental: 'травнем' },
  '06': { genitive: 'червня', instrumental: 'червнем' },
  '07': { genitive: 'липня', instrumental: 'липнем' },
  '08': { genitive: 'серпня', instrumental: 'серпнем' },
  '09': { genitive: 'вересня', instrumental: 'вереснем' },
  '10': { genitive: 'жовтня', instrumental: 'жовтнем' },
  '11': { genitive: 'листопада', instrumental: 'листопадом' },
  '12': { genitive: 'грудня', instrumental: 'груднем' },
};

const ageGroupPhrases: Record<string, string> = {
  'Всього випадків': '',
  'До 1-го року': ' серед дітей віком до 1 року',
  '1-4 роки': ' серед дітей віком від 1 до 4 років',
  '5-9 років': ' серед дітей віком від 5 до 9 років',
  '10-14 років': ' серед дітей віком від 10 до 14 років',
  '15-17 років': ' серед дітей віком від 15 до 17 років',
  '0-17 років': ' серед дітей віком до 17 років включно',
};

export function parseReportMonth(month: string) {
  const match = /^(\d{4})-(\d{2})-01$/.exec(month);
  if (!match || !monthForms[match[2]]) throw new Error(`Invalid report month "${month}".`);
  return { year: match[1], ...monthForms[match[2]] };
}

export function getAgeGroupPhrase(ageGroup: string): string {
  const phrase = ageGroupPhrases[ageGroup];
  if (phrase === undefined) throw new Error(`Missing report phrase for age group "${ageGroup}".`);
  return phrase;
}

export function formatNumber(value: number, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) throw new Error('Cannot format a non-finite number.');
  return new Intl.NumberFormat('uk-UA', {
    maximumFractionDigits,
    useGrouping: true,
  }).format(value);
}

export function formatCases(value: number): string {
  if (!Number.isInteger(value) || value < 0) throw new Error('Cases must be a non-negative integer.');
  const lastTwo = value % 100;
  const last = value % 10;
  const noun = last === 1 && lastTwo !== 11
    ? 'випадок'
    : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)
      ? 'випадки'
      : 'випадків';
  return `${formatNumber(value, 0)} ${noun}`;
}

export function formatUkrainianList(values: readonly string[]): string {
  if (values.length === 0) return '';
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(', ')} та ${values.at(-1)}`;
}
