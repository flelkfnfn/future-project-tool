export type ThemePreference = "system" | "light" | "dark";

export const THEME_PREFERENCE_COOKIE = "theme_pref";
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

export function parseThemePreference(
  value?: string | null
): ThemePreference {
  if (value === "light" || value === "dark") {
    return value;
  }
  return DEFAULT_THEME_PREFERENCE;
}

export type ResolvedTheme = "light" | "dark";

export function resolveThemeSetting(
  preference: ThemePreference,
  systemPrefersDark: boolean
): ResolvedTheme {
  if (preference === "light" || preference === "dark") {
    return preference;
  }
  return systemPrefersDark ? "dark" : "light";
}
