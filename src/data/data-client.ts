import type { MonthDataset } from '../domain';
import type { GeneratedDatasetMetadata } from '../types';

let metadataPromise: Promise<GeneratedDatasetMetadata> | null = null;
const monthCache = new Map<string, Promise<MonthDataset>>();

function dataUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}data/${fileName}`;
}

async function fetchJson<Type>(fileName: string): Promise<Type> {
  const response = await fetch(dataUrl(fileName));
  if (!response.ok) {
    throw new Error(`Failed to load ${fileName}: HTTP ${response.status}.`);
  }
  return response.json() as Promise<Type>;
}

function validateMetadata(metadata: GeneratedDatasetMetadata) {
  if (metadata.schemaVersion !== 1) throw new Error('Unsupported dataset schema version.');
  if (metadata.regionCount !== 25 || metadata.regions.length !== 25) {
    throw new Error('Dataset must contain 25 regions.');
  }
  if (metadata.months.length < 2) throw new Error('Dataset must contain at least two months.');
  if (metadata.diseases.length === 0 || metadata.ageGroups.length === 0) {
    throw new Error('Dataset catalogs must not be empty.');
  }
}

export async function loadMetadata(): Promise<GeneratedDatasetMetadata> {
  if (!metadataPromise) {
    metadataPromise = fetchJson<GeneratedDatasetMetadata>('metadata.json')
      .then((metadata) => {
        validateMetadata(metadata);
        return metadata;
      })
      .catch((error) => {
        metadataPromise = null;
        throw error;
      });
  }
  return metadataPromise;
}

export async function loadMonth(descriptor: { month: string; file: string }): Promise<MonthDataset> {
  const cached = monthCache.get(descriptor.file);
  if (cached) return cached;

  const request = fetchJson<MonthDataset>(descriptor.file)
    .then((dataset) => {
      if (dataset.month !== descriptor.month || !Array.isArray(dataset.rows)) {
        throw new Error(`Invalid monthly dataset: ${descriptor.file}.`);
      }
      return dataset;
    })
    .catch((error) => {
      monthCache.delete(descriptor.file);
      throw error;
    });

  monthCache.set(descriptor.file, request);
  return request;
}

export function getPublicDataUrl(fileName: string): string {
  return dataUrl(fileName);
}
