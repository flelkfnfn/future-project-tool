"use server";

import { cookies } from "next/headers";
import {
  HOME_VARIANT_COOKIE,
  type HomeVariant,
} from "@/lib/home-variant";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function updateHomeVariant(nextVariant: HomeVariant) {
  const jar = await cookies();
  jar.set(HOME_VARIANT_COOKIE, nextVariant, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });

  return { variant: nextVariant };
}
