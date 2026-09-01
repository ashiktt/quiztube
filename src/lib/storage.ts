import { LectureStudySet, UserQuizAttempt } from '@/types';
import { SAMPLE_STUDY_SET } from './sampleData';

const STORAGE_KEYS = {
  API_KEY: 'lecture_quiz_gemini_api_key',
  STUDY_SETS: 'lecture_quiz_saved_study_sets',
  CURRENT_SET_ID: 'lecture_quiz_current_study_set_id',
};

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
}

export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key) {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  } else {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
  }
}

export function clearLocalStorageStudySets(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.STUDY_SETS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_SET_ID);
}

export function getSavedStudySets(): LectureStudySet[] {
  if (typeof window === 'undefined') return [SAMPLE_STUDY_SET];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDY_SETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDY_SETS, JSON.stringify([SAMPLE_STUDY_SET]));
      return [SAMPLE_STUDY_SET];
    }
    const parsed = JSON.parse(raw) as LectureStudySet[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [SAMPLE_STUDY_SET];
    }
    return parsed;
  } catch (err) {
    console.error('Error reading study sets from localStorage:', err);
    return [SAMPLE_STUDY_SET];
  }
}

export function saveStudySet(set: LectureStudySet): void {
  if (typeof window === 'undefined') return;
  try {
    const currentSets = getSavedStudySets();
    const existingIndex = currentSets.findIndex(s => s.id === set.id);
    let updated: LectureStudySet[];

    if (existingIndex >= 0) {
      updated = [...currentSets];
      updated[existingIndex] = set;
    } else {
      updated = [set, ...currentSets];
    }

    localStorage.setItem(STORAGE_KEYS.STUDY_SETS, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEYS.CURRENT_SET_ID, set.id);

    // Asynchronously sync to Supabase Cloud
    syncStudySetToCloud(set);
  } catch (err) {
    console.error('Error saving study set to localStorage:', err);
  }
}

export function deleteStudySet(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const currentSets = getSavedStudySets();
    const updated = currentSets.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDY_SETS, JSON.stringify(updated));

    // Asynchronously delete from Supabase Cloud
    deleteStudySetFromCloud(id);
  } catch (err) {
    console.error('Error deleting study set:', err);
  }
}

export function saveQuizAttempt(studySetId: string, attempt: UserQuizAttempt): LectureStudySet | null {
  if (typeof window === 'undefined') return null;
  try {
    const currentSets = getSavedStudySets();
    const targetSet = currentSets.find(s => s.id === studySetId);
    if (!targetSet) return null;

    const attempts = targetSet.attempts || [];
    const updatedSet: LectureStudySet = {
      ...targetSet,
      attempts: [attempt, ...attempts],
    };

    saveStudySet(updatedSet);
    return updatedSet;
  } catch (err) {
    console.error('Error recording quiz attempt:', err);
    return null;
  }
}

/**
 * Sync a study set to Supabase cloud database
 */
export async function syncStudySetToCloud(set: LectureStudySet): Promise<boolean> {
  try {
    const res = await fetch('/api/study-sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(set),
    });
    const data = await res.json();
    return Boolean(data.saved);
  } catch (err) {
    console.warn('Cloud sync background error (using local storage):', err);
    return false;
  }
}

/**
 * Delete a study set from Supabase cloud database
 */
export async function deleteStudySetFromCloud(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/study-sets?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    return Boolean(data.deleted);
  } catch (err) {
    console.warn('Cloud delete error:', err);
    return false;
  }
}

/**
 * Fetches study sets from Supabase cloud (for student) and merges with local storage
 */
export async function fetchAndMergeCloudStudySets(userId?: string): Promise<{ sets: LectureStudySet[]; isCloudConnected: boolean }> {
  try {
    const endpoint = userId ? `/api/study-sets?userId=${encodeURIComponent(userId)}` : '/api/study-sets';
    const res = await fetch(endpoint);
    const data = await res.json();

    if (data.connected && Array.isArray(data.studySets) && data.studySets.length > 0) {
      const localSets = getSavedStudySets();
      const map = new Map<string, LectureStudySet>();

      // Put cloud sets first
      for (const set of data.studySets) {
        map.set(set.id, set);
      }
      // Merge local sets that might not yet be synced
      for (const set of localSets) {
        if (!map.has(set.id)) {
          map.set(set.id, set);
          // push unsynced local set to cloud
          syncStudySetToCloud(set);
        }
      }

      const merged = Array.from(map.values());
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.STUDY_SETS, JSON.stringify(merged));
      }
      return { sets: merged, isCloudConnected: true };
    }

    return { sets: getSavedStudySets(), isCloudConnected: Boolean(data.connected) };
  } catch (err) {
    console.warn('Could not fetch cloud study sets, using local:', err);
    return { sets: getSavedStudySets(), isCloudConnected: false };
  }
}

/**
 * Export all study sets as a downloadable JSON backup
 */
export function exportStudyLibraryBackup(): void {
  const sets = getSavedStudySets();
  const jsonStr = JSON.stringify(sets, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `QuizTube_Study_Library_Backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import and merge study sets from a JSON backup file
 */
export function importStudyLibraryBackup(jsonContent: string): { success: boolean; count: number } {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0 };
    }

    const currentSets = getSavedStudySets();
    const map = new Map<string, LectureStudySet>();

    for (const set of currentSets) {
      map.set(set.id, set);
    }
    for (const set of parsed) {
      if (set && set.id && set.videoTitle) {
        map.set(set.id, set);
        syncStudySetToCloud(set);
      }
    }

    const merged = Array.from(map.values());
    localStorage.setItem(STORAGE_KEYS.STUDY_SETS, JSON.stringify(merged));
    return { success: true, count: parsed.length };
  } catch (err) {
    console.error('Failed to import JSON backup:', err);
    return { success: false, count: 0 };
  }
}
