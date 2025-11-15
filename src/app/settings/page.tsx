import { cookies } from "next/headers";
import SettingsClient from "./SettingsClient";
import {
  HOME_VARIANT_COOKIE,
  parseHomeVariant,
} from "@/lib/home-variant";
import {
  MOTION_PREFERENCE_COOKIE,
  parseMotionPreference,
} from "@/lib/motion-preference";

export default async function SettingsPage() {
  const jar = await cookies();
  const variant = parseHomeVariant(jar.get(HOME_VARIANT_COOKIE)?.value);
  const motionPreference = parseMotionPreference(
    jar.get(MOTION_PREFERENCE_COOKIE)?.value
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-2xl font-bold">설정</h1>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
          Beta
        </span>
      </div>
      <SettingsClient
        defaultVariant={variant}
        defaultMotionPreference={motionPreference}
      />
    </div>
  );
}
