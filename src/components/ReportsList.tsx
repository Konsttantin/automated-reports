import { useMemo, useState } from 'react';
import type { Translation } from '../i18n';
import type { ReportPreview } from '../types';
import { SectionHeading } from './SectionHeading';

interface ReportsListProps {
  reports: ReportPreview[];
  t: Translation;
}

export function ReportsList({ reports, t }: ReportsListProps) {
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const visibleReports = useMemo(
    () => reports.filter((report) => report.disease.toLowerCase().includes(query.toLowerCase())),
    [query, reports],
  );

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1400);
  };

  return (
    <section className="reports-section">
      <div className="reports-toolbar">
        <div>
          <SectionHeading icon="reports" title={t.reports} />
        </div>
        <div className="toolbar-actions">
          <input
            aria-label={t.reportSearch}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.reportSearch}
            type="search"
            value={query}
          />
          <button
            className="secondary-button"
            disabled={visibleReports.length === 0}
            onClick={() => copyText('all', visibleReports.map((report) => report.text).join('\n\n'))}
            type="button"
          >
            {copiedId === 'all' ? t.copied : t.copyAll}
          </button>
        </div>
      </div>
      <div className="report-list">
        {visibleReports.length === 0 && <div className="empty-reports">{t.noReports}</div>}
        {visibleReports.map((report, index) => (
          <article className="report-card" key={report.disease}>
            <div className="report-number">{String(index + 1).padStart(2, '0')}</div>
            <div className="report-content">
              <h3>{report.disease}</h3>
              <p>{report.text}</p>
            </div>
            <button className="copy-button" onClick={() => copyText(report.disease, report.text)} type="button">
              {copiedId === report.disease ? t.copied : t.copyReport}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
