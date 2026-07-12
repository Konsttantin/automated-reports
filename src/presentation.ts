import type { Language, SelectOption } from './types';

const monthNames: Record<Language, readonly string[]> = {
  uk: [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
  ],
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
};

const ageGroupLabels: Record<Language, Record<string, string>> = {
  uk: {
    'Всього випадків': 'Всього випадків',
    'До 1-го року': 'До 1-го року',
    '1-4 роки': '1–4 роки',
    '5-9 років': '5–9 років',
    '10-14 років': '10–14 років',
    '15-17 років': '15–17 років',
    '0-17 років': '0–17 років',
  },
  en: {
    'Всього випадків': 'All cases',
    'До 1-го року': 'Under 1 year',
    '1-4 роки': '1–4 years',
    '5-9 років': '5–9 years',
    '10-14 років': '10–14 years',
    '15-17 років': '15–17 years',
    '0-17 років': '0–17 years',
  },
};

export function formatMonthLabel(month: string, language: Language): string {
  const match = /^(\d{4})-(\d{2})-01$/.exec(month);
  const monthIndex = match ? Number(match[2]) - 1 : -1;
  if (!match || monthIndex < 0 || monthIndex > 11) return month;
  return `${monthNames[language][monthIndex]} ${match[1]}`;
}

export function formatAgeGroupLabel(ageGroup: string, language: Language): string {
  return ageGroupLabels[language][ageGroup] ?? ageGroup;
}

export function createMonthOptions(months: readonly string[], language: Language): SelectOption[] {
  return months.map((month) => ({ value: month, label: formatMonthLabel(month, language) }));
}

export function createAgeGroupOptions(ageGroups: readonly string[], language: Language): SelectOption[] {
  return ageGroups.map((ageGroup) => ({ value: ageGroup, label: formatAgeGroupLabel(ageGroup, language) }));
}
