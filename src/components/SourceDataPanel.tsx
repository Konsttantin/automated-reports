import { interpolate, type Translation } from '../i18n';
import type { DatasetMetadata, DatasetRow } from '../types';
import { SectionHeading } from './SectionHeading';

interface SourceDataPanelProps {
  metadata: DatasetMetadata;
  previewRows: DatasetRow[];
  sourceUrl: string;
  t: Translation;
}

export function SourceDataPanel({ metadata, previewRows, sourceUrl, t }: SourceDataPanelProps) {
  const fileMeta = interpolate(t.fileMeta, {
    rows: metadata.rowCount.toLocaleString('uk-UA'),
    diseases: metadata.diseaseCount,
    months: metadata.monthCount,
  });
  const previewNote = interpolate(t.previewRows, {
    visible: previewRows.length,
    total: metadata.rowCount.toLocaleString('uk-UA'),
  });

  return (
    <section className="panel source-panel">
      <SectionHeading icon="data" title={t.sourceData} />
      <div className="file-card">
        <div className="file-mark">XLSX</div>
        <div className="file-details">
          <strong title={metadata.fileName}>{metadata.fileName}</strong>
          <span>{fileMeta}</span>
        </div>
        <a aria-label={t.downloadExcel} className="icon-button" download href={sourceUrl} title={t.downloadExcel}>↓</a>
      </div>
      <div className="preview-heading">
        <h3>{t.jsonPreview}</h3>
        <span>{previewNote}</span>
      </div>
      <pre className={`json-preview${previewRows.length === 0 ? ' is-empty' : ''}`}>
        {previewRows.length > 0 ? JSON.stringify(previewRows, null, 2) : '[\n  // JSON data will be connected in the next stage\n]'}
      </pre>
    </section>
  );
}
