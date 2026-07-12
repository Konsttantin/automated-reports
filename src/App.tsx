import { useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { ReportSettings } from './components/ReportSettings';
import { ReportsList } from './components/ReportsList';
import { SourceDataPanel } from './components/SourceDataPanel';
import { Summary } from './components/Summary';
import { getPublicDataUrl } from './data/data-client';
import { useReportWorkspace } from './hooks/useReportWorkspace';
import { translations } from './i18n';
import {
  createAgeGroupOptions,
  createMonthOptions,
  formatAgeGroupLabel,
  formatMonthLabel,
} from './presentation';
import type { DatasetMetadata, Language } from './types';

function App() {
  const [language, setLanguage] = useState<Language>('uk');
  const {
    metadata,
    draftSettings,
    setDraftSettings,
    result,
    isLoading,
    error,
    generateDraft,
  } = useReportWorkspace();
  const t = translations[language];

  const monthOptions = useMemo(
    () => createMonthOptions(metadata?.months.slice(1).map(({ month }) => month) ?? [], language),
    [language, metadata],
  );
  const ageGroupOptions = useMemo(
    () => createAgeGroupOptions(metadata?.ageGroups ?? [], language),
    [language, metadata],
  );

  if (!metadata || !draftSettings) {
    return (
      <div className="app-shell">
        <AppHeader language={language} onLanguageChange={setLanguage} t={t} />
        <main className="initial-state" role="status">
          <strong>{error ? t.dataError : t.loadingData}</strong>
          {error && <span>{error}</span>}
        </main>
      </div>
    );
  }

  const sourceMetadata: DatasetMetadata = {
    fileName: metadata.source.fileName,
    rowCount: metadata.source.rowCount,
    diseaseCount: metadata.diseases.length,
    monthCount: metadata.months.length,
  };
  const appliedSettings = result?.settings ?? draftSettings;

  return (
    <div className="app-shell">
      <AppHeader language={language} onLanguageChange={setLanguage} t={t} />
      {error && (
        <div className="error-banner" role="alert">
          <strong>{t.dataError}</strong>
          <span>{error}</span>
        </div>
      )}
      <main className="workspace">
        <aside className="sidebar">
          <SourceDataPanel
            metadata={sourceMetadata}
            previewRows={result?.previewRows ?? []}
            sourceUrl={getPublicDataUrl(metadata.source.publicFile)}
            t={t}
          />
          <ReportSettings
            ageGroupOptions={ageGroupOptions}
            diseases={metadata.diseases}
            disabled={isLoading}
            monthOptions={monthOptions}
            onChange={setDraftSettings}
            onGenerate={() => void generateDraft()}
            settings={draftSettings}
            t={t}
          />
        </aside>
        <section className="results-column" aria-busy={isLoading}>
          <Summary
            passedThreshold={result?.metrics.length ?? 0}
            reportCount={result?.reports.length ?? 0}
            rowCount={metadata.source.rowCount}
            selectedAgeLabel={formatAgeGroupLabel(appliedSettings.ageGroup, language)}
            selectedMonthLabel={formatMonthLabel(appliedSettings.month, language)}
            settings={appliedSettings}
            t={t}
          />
          <ReportsList reports={result?.reports ?? []} t={t} />
        </section>
      </main>
    </div>
  );
}

export default App;
