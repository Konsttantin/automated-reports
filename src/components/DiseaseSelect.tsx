import { useMemo, useState } from 'react';
import type { Translation } from '../i18n';

interface DiseaseSelectProps {
  diseases: readonly string[];
  selectedDiseases: string[];
  onChange: (diseases: string[]) => void;
  t: Translation;
}

export function DiseaseSelect({ diseases, selectedDiseases, onChange, t }: DiseaseSelectProps) {
  const [query, setQuery] = useState('');
  const visibleDiseases = useMemo(
    () => diseases.filter((disease) => disease.toLowerCase().includes(query.toLowerCase())),
    [diseases, query],
  );

  const toggleDisease = (disease: string) => {
    onChange(
      selectedDiseases.includes(disease)
        ? selectedDiseases.filter((item) => item !== disease)
        : [...selectedDiseases, disease],
    );
  };

  return (
    <div className="field-group">
      <span className="field-label">{t.diseases}</span>
      <details className="disease-select">
        <summary>{selectedDiseases.length} {t.selected}</summary>
        <div className="disease-menu">
          <input
            aria-label={t.findDisease}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.findDisease}
            type="search"
            value={query}
          />
          <div className="selection-actions">
            <button onClick={() => onChange([...diseases])} type="button">{t.selectAll}</button>
            <button onClick={() => onChange([])} type="button">{t.clearAll}</button>
          </div>
          <div className="disease-options">
            {visibleDiseases.length === 0 && <p className="empty-option">{t.noDiseases}</p>}
            {visibleDiseases.map((disease) => (
              <label key={disease}>
                <input
                  checked={selectedDiseases.includes(disease)}
                  onChange={() => toggleDisease(disease)}
                  type="checkbox"
                />
                <span>{disease}</span>
              </label>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
