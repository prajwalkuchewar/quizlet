import { Difficulty } from "../models/Study";

export type Theme = "light" | "dark";

export type StudyPrefs = {
  defaultCount: number;
  defaultDifficulty: Difficulty;
};

const THEME_KEY = "quizlet.theme";
const STUDY_PREFS_KEY = "quizlet.studyPrefs";

export const DEFAULT_STUDY_PREFS: StudyPrefs = {
  defaultCount: 10,
  defaultDifficulty: "beginner",
};

export const getTheme = (): Theme =>
  localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";

export const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_KEY, theme);
};

export const getStudyPrefs = (): StudyPrefs => {
  try {
    const stored = JSON.parse(localStorage.getItem(STUDY_PREFS_KEY) ?? "null");
    return { ...DEFAULT_STUDY_PREFS, ...stored };
  } catch {
    return DEFAULT_STUDY_PREFS;
  }
};

export const saveStudyPrefs = (prefs: StudyPrefs) => {
  localStorage.setItem(STUDY_PREFS_KEY, JSON.stringify(prefs));
};
