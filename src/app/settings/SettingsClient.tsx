"use client";

import { useEffect, useState, useTransition } from "react";
import { ensurePushEnabled, disablePush } from "@/lib/notifications/client";
import { toast } from "sonner";
import { LuBell, LuBellOff, LuSparkles } from "react-icons/lu";
import { updateHomeVariant } from "./actions";
import type { HomeVariant } from "@/lib/home-variant";

type SettingsClientProps = {
  defaultVariant: HomeVariant;
};

export default function SettingsClient({
  defaultVariant,
}: SettingsClientProps) {
  const [pushStatus, setPushStatus] = useState<
    "unknown" | "enabled" | "disabled" | "denied" | "unsupported"
  >("unknown");
  const [enablingPush, setEnablingPush] = useState<boolean>(false);
  const [disablingPush, setDisablingPush] = useState<boolean>(false);
  const [homeVariant, setHomeVariant] = useState<HomeVariant>(defaultVariant);
  const [savingVariant, startSavingVariant] = useTransition();

  useEffect(() => {
    setHomeVariant(defaultVariant);
  }, [defaultVariant]);

  useEffect(() => {
    const evalStatus = async () => {
      try {
        if (
          typeof window === "undefined" ||
          !("serviceWorker" in navigator) ||
          typeof Notification === "undefined"
        ) {
          setPushStatus("unsupported");
          return;
        }
        const perm = Notification.permission;
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (perm === "denied") {
          setPushStatus("denied");
        } else if (perm === "granted" && sub) {
          setPushStatus("enabled");
        } else {
          setPushStatus("disabled");
        }
      } catch {
        setPushStatus("unsupported");
      }
    };
    evalStatus();
  }, []);

  const handleTogglePush = async () => {
    if (pushStatus === "unsupported") {
      toast.error("현재 브라우저에서는 알림을 지원하지 않습니다.");
      return;
    }
    if (pushStatus === "enabled") {
      try {
        setDisablingPush(true);
        const ok = await disablePush();
        if (ok) {
          setPushStatus("disabled");
          toast.success("알림을 껐습니다.");
        } else {
          toast.error("알림을 끄지 못했습니다.");
        }
      } finally {
        setDisablingPush(false);
      }
      return;
    }
    if (pushStatus === "denied") {
      toast.error("브라우저 설정에서 알림 권한을 허용해 주세요.");
      return;
    }
    try {
      setEnablingPush(true);
      const ok = await ensurePushEnabled();
      if (ok) {
        setPushStatus("enabled");
        toast.success("알림을 켰습니다.");
      } else {
        const perm =
          typeof Notification !== "undefined"
            ? Notification.permission
            : "default";
        setPushStatus(perm === "denied" ? "denied" : "disabled");
        toast.error("알림을 켜지 못했습니다.");
      }
    } finally {
      setEnablingPush(false);
    }
  };

  const handleHomeVariantChange = (nextVariant: HomeVariant) => {
    if (homeVariant === nextVariant) return;
    const previous = homeVariant;
    setHomeVariant(nextVariant);
    startSavingVariant(async () => {
      try {
        await updateHomeVariant(nextVariant);
        toast.success(
          nextVariant === "modern"
            ? "모던 홈 화면을 활성화했습니다."
            : "클래식 홈 화면을 선택했습니다."
        );
      } catch (error) {
        console.error(error);
        setHomeVariant(previous);
        toast.error("홈 화면 모드를 저장하지 못했습니다.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200/80 bg-white/80 p-4 shadow-sm dark:border-gray-800/70 dark:bg-gray-900/70">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <LuSparkles className="h-4 w-4 text-blue-500" aria-hidden />
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                홈 화면 모드
              </h3>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              로그인 시 기본으로 보여줄 메인 홈 스타일을 선택하세요.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-gray-200/80 bg-gray-50/70 p-1 dark:border-gray-700 dark:bg-gray-800/50">
            {(["classic", "modern"] as HomeVariant[]).map((variant) => {
              const selected = homeVariant === variant;
              return (
                <button
                  key={variant}
                  type="button"
                  aria-pressed={selected}
                  disabled={savingVariant}
                  onClick={() => handleHomeVariantChange(variant)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                    selected
                      ? "bg-white text-blue-600 shadow-sm dark:bg-gray-900"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {variant === "classic" ? "클래식" : "모던"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-200/80 bg-white/80 p-4 shadow-sm dark:border-gray-800/70 dark:bg-gray-900/70">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            알림
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pushStatus === "enabled" ? "활성화됨" : "비활성화됨"}
          </p>
        </div>
        <button
          type="button"
          aria-label={pushStatus === "enabled" ? "알림 끄기" : "알림 켜기"}
          onClick={handleTogglePush}
          className={`flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-600 shadow-md transition-colors dark:border-gray-700 dark:bg-gray-800/80 ${
            pushStatus === "enabled"
              ? "hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              : "hover:bg-gray-50 dark:hover:bg-gray-700/60"
          }`}
          disabled={
            enablingPush ||
            disablingPush ||
            pushStatus === "unsupported" ||
            pushStatus === "denied"
          }
        >
          {pushStatus === "enabled" ? (
            <LuBell className="h-5 w-5 text-emerald-600" />
          ) : (
            <LuBellOff className="h-5 w-5 text-gray-500 dark:text-gray-300" />
          )}
        </button>
      </div>
    </div>
  );
}
