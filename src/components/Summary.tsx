import type { Translation } from '../i18n';
import type { ReportSettingsValue } from '../types';
import { SectionHeading } from './SectionHeading';

interface SummaryProps {
  passedThreshold: number;
  reportCount: number;
  rowCount: number;
  selectedAgeLabel: string;
  selectedMonthLabel: string;
  settings: ReportSettingsValue;
  t: Translation;
}

export function Summary({
  passedThreshold,
  reportCount,
  rowCount,
  selectedAgeLabel,
  selectedMonthLabel,
  settings,
  t,
}: SummaryProps) {
  const items = [
    [t.rowsProcessed, rowCount.toLocaleString('uk-UA')],
    [t.selectedMonth, selectedMonthLabel],
    [t.diseasesSelected, settings.selectedDiseases.length.toString()],
    [t.selectedAge, selectedAgeLabel],
    [t.passedThreshold, passedThreshold.toString()],
    [t.reportsGenerated, reportCount.toString()],
  ];

  return (
    <section className="summary-section">
      <SectionHeading icon="summary" title={t.summary} />
      <div className="summary-grid">
        {items.map(([label, value]) => (
          <div className="summary-item" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
