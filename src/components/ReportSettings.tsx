import type { Translation } from '../i18n';
import type { ReportSettingsValue, SelectOption } from '../types';
import { DiseaseSelect } from './DiseaseSelect';
import { SectionHeading } from './SectionHeading';

interface ReportSettingsProps {
  diseases: readonly string[];
  disabled: boolean;
  ageGroupOptions: SelectOption[];
  monthOptions: SelectOption[];
  onChange: (settings: ReportSettingsValue) => void;
  onGenerate: () => void;
  settings: ReportSettingsValue;
  t: Translation;
}

export function ReportSettings({
  ageGroupOptions,
  diseases,
  disabled,
  monthOptions,
  onChange,
  onGenerate,
  settings,
  t,
}: ReportSettingsProps) {
  const update = <Key extends keyof ReportSettingsValue>(key: Key, value: ReportSettingsValue[Key]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <section className="panel settings-panel">
      <SectionHeading icon="settings" title={t.settings} />
      <div className="form-grid">
        <label>
          <span>{t.month}</span>
          <select value={settings.month} onChange={(event) => update('month', event.target.value)}>
            {monthOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span>{t.ageGroup}</span>
          <select value={settings.ageGroup} onChange={(event) => update('ageGroup', event.target.value)}>
            {ageGroupOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span>{t.threshold}</span>
          <input
            min="1"
            onChange={(event) => update('threshold', Math.max(1, Number(event.target.value)))}
            type="number"
            value={settings.threshold}
          />
        </label>
        <DiseaseSelect
          diseases={diseases}
          onChange={(value) => update('selectedDiseases', value)}
          selectedDiseases={settings.selectedDiseases}
          t={t}
        />
      </div>
      <button
        className="primary-button"
        disabled={disabled || settings.selectedDiseases.length === 0}
        onClick={onGenerate}
        type="button"
      >
        {disabled ? t.generating : t.generate}
      </button>
    </section>
  );
}
