export type ActiveStatusPreference = "show" | "hide";

export const ACTIVE_STATUS_PREFERENCE_COOKIE = "active_status_preference";
export const ACTIVE_STATUS_STORAGE_KEY = "activeStatusPreference";
export const ACTIVE_STATUS_PREF_EVENT = "active-status-pref-change";
export const DEFAULT_ACTIVE_STATUS_PREFERENCE: ActiveStatusPreference = "show";

export function parseActiveStatusPreference(
  value?: string | null
): ActiveStatusPreference {
  if (value === "hide") {
    return "hide";
  }
  return DEFAULT_ACTIVE_STATUS_PREFERENCE;
}

export function readActiveStatusPreferenceClient():
  | ActiveStatusPreference
  | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(ACTIVE_STATUS_STORAGE_KEY);
    if (stored) {
      return parseActiveStatusPreference(stored);
    }
  } catch {
    // localStorage might be blocked; ignore
  }
  try {
    const cookieValue = readCookie(ACTIVE_STATUS_PREFERENCE_COOKIE);
    if (cookieValue) {
      return parseActiveStatusPreference(cookieValue);
    }
  } catch {
    // document access might fail in unsupported contexts
  }
  return null;
}

export function getActiveStatusPreferenceClient(): ActiveStatusPreference {
  return (
    readActiveStatusPreferenceClient() ?? DEFAULT_ACTIVE_STATUS_PREFERENCE
  );
}

export function persistActiveStatusPreferenceClient(
  preference: ActiveStatusPreference
) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(ACTIVE_STATUS_STORAGE_KEY, preference);
  } catch {
    // Ignore quota/availability errors
  }
  try {
    window.dispatchEvent(
      new CustomEvent<ActiveStatusPreference>(
        ACTIVE_STATUS_PREF_EVENT,
        {
          detail: preference,
        }
      )
    );
  } catch {
    // Ignore dispatch failures (e.g., unsupported CustomEvent)
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined" || !document.cookie) {
    return null;
  }
  const prefix = `${name}=`;
  const parts = document.cookie.split(";").map((segment) => segment.trim());
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.substring(prefix.length));
    }
  }
  return null;
}
