"use server";

import { cookies } from "next/headers";
import {
  HOME_VARIANT_COOKIE,
  type HomeVariant,
} from "@/lib/home-variant";
import {
  MOTION_PREFERENCE_COOKIE,
  type MotionPreference,
} from "@/lib/motion-preference";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const COOKIE_OPTIONS = {
  path: "/",
  maxAge: ONE_YEAR_SECONDS,
  sameSite: "lax" as const,
};

export async function updateHomeVariant(nextVariant: HomeVariant) {
  const jar = await cookies();
  jar.set(HOME_VARIANT_COOKIE, nextVariant, COOKIE_OPTIONS);

  return { variant: nextVariant };
}

export async function updateMotionPreference(
  nextPreference: MotionPreference
) {
  const jar = await cookies();
  jar.set(MOTION_PREFERENCE_COOKIE, nextPreference, COOKIE_OPTIONS);
  return { preference: nextPreference };
}
