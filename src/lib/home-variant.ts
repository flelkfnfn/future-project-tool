export type HomeVariant = "classic" | "modern";

export const HOME_VARIANT_COOKIE = "home_variant";
export const DEFAULT_HOME_VARIANT: HomeVariant = "classic";

export function parseHomeVariant(value?: string | null): HomeVariant {
  return value === "modern" ? "modern" : DEFAULT_HOME_VARIANT;
}
