"use client";

import { useEffect, useState } from "react";
import { ensurePushEnabled, disablePush } from "@/lib/notifications/client";
import { toast } from "sonner";
import { LuBell, LuBellOff } from "react-icons/lu";

export default function SettingsClient() {
  const [pushStatus, setPushStatus] = useState<
    "unknown" | "enabled" | "disabled" | "denied" | "unsupported"
  >("unknown");
  const [enablingPush, setEnablingPush] = useState<boolean>(false);
  const [disablingPush, setDisablingPush] = useState<boolean>(false);

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
      toast.error("이 브라우저에서는 알림을 지원하지 않습니다.");
      return;
    }
    if (pushStatus === "enabled") {
      try {
        setDisablingPush(true);
        const ok = await disablePush();
        if (ok) {
          setPushStatus("disabled");
          toast.success("알림을 껐습니다");
        } else {
          toast.error("알림을 끌 수 없습니다");
        }
      } finally {
        setDisablingPush(false);
      }
      return;
    }
    // disabled/unknown/denied -> try enable
    if (pushStatus === "denied") {
      toast.error(
        "브라우저 알림이 차단되어 있습니다. 사이트 권한에서 허용해주세요."
      );
      return;
    }
    try {
      setEnablingPush(true);
      const ok = await ensurePushEnabled();
      if (ok) {
        setPushStatus("enabled");
        toast.success("알림을 켰습니다");
      } else {
        const perm =
          typeof Notification !== "undefined"
            ? Notification.permission
            : "default";
        setPushStatus(perm === "denied" ? "denied" : "disabled");
        toast.error("알림을 켤 수 없습니다");
      }
    } finally {
      setEnablingPush(false);
    }
  };

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
                <h3 className="font-medium">푸시 알림</h3>
                <p className="text-sm text-gray-500">
                    {pushStatus === 'enabled' ? '활성화됨' : '비활성화됨'}
                </p>
            </div>
            <button
                type="button"
                aria-label={pushStatus === "enabled" ? "알림 끄기" : "알림 켜기"}
                onClick={handleTogglePush}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur transition-colors ${
                    pushStatus === "enabled"
                    ? "hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/60"
                }`}
                disabled={enablingPush || disablingPush || pushStatus === 'unsupported' || pushStatus === 'denied'}
                >
                {pushStatus === "enabled" ? (
                    <LuBell className="w-5 h-5 text-emerald-600" />
                ) : (
                    <LuBellOff className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                )}
            </button>
        </div>
    </div>
  );
}
