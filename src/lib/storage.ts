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

export function getSavedStudySets(): LectureStudySet[] {
  if (typeof window === 'undefined') return [SAMPLE_STUDY_SET];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDY_SETS);
    if (!raw) {
      // Initialize with sample study set
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
