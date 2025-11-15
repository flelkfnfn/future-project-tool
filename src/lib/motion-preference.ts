export type MotionPreference = "system" | "reduced";

export const MOTION_PREFERENCE_COOKIE = "motion_pref";
export const DEFAULT_MOTION_PREFERENCE: MotionPreference = "system";

export function parseMotionPreference(value?: string | null): MotionPreference {
  if (value === "reduced") return "reduced";
  return DEFAULT_MOTION_PREFERENCE;
}

export type ResolvedMotionSetting = "reduced" | "full";

export function resolveMotionSetting(
  preference: MotionPreference,
  systemPrefersReduced: boolean
): ResolvedMotionSetting {
  if (preference === "reduced") return "reduced";
  return systemPrefersReduced ? "reduced" : "full";
}
