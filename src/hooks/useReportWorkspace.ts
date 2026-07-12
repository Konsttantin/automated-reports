import { useCallback, useEffect, useRef, useState } from 'react';
import { loadMetadata } from '../data/data-client';
import {
  createInitialSettings,
  createReportWorkspaceResult,
  type ReportWorkspaceResult,
} from '../data/report-workspace';
import type { GeneratedDatasetMetadata, ReportSettingsValue } from '../types';

export function useReportWorkspace() {
  const [metadata, setMetadata] = useState<GeneratedDatasetMetadata | null>(null);
  const [draftSettings, setDraftSettings] = useState<ReportSettingsValue | null>(null);
  const [result, setResult] = useState<ReportWorkspaceResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const generate = useCallback(async (
    nextMetadata: GeneratedDatasetMetadata,
    settings: ReportSettingsValue,
  ) => {
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);

    try {
      const nextResult = await createReportWorkspaceResult(nextMetadata, settings);
      if (requestId.current === currentRequest) setResult(nextResult);
    } catch (reason) {
      if (requestId.current === currentRequest) {
        setError(reason instanceof Error ? reason.message : 'Unknown data error.');
      }
    } finally {
      if (requestId.current === currentRequest) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    loadMetadata()
      .then((nextMetadata) => {
        if (!active) return;
        const initialSettings = createInitialSettings(nextMetadata);
        setMetadata(nextMetadata);
        setDraftSettings(initialSettings);
        return generate(nextMetadata, initialSettings);
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'Unknown data error.');
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [generate]);

  const generateDraft = useCallback(() => {
    if (!metadata || !draftSettings) return Promise.resolve();
    return generate(metadata, draftSettings);
  }, [draftSettings, generate, metadata]);

  return {
    metadata,
    draftSettings,
    setDraftSettings,
    result,
    isLoading,
    error,
    generateDraft,
  };
}
