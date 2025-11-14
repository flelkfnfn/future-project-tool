"use client";

import { useEffect, useState, useRef } from "react";
import { ensurePushEnabled, disablePush } from "@/lib/notifications/client";
import { toast } from "sonner";
import { LuBell, LuBellOff, LuSave, LuFolderOpen } from "react-icons/lu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsClient() {
  const [pushStatus, setPushStatus] = useState<
    "unknown" | "enabled" | "disabled" | "denied" | "unsupported"
  >("unknown");
  const [enablingPush, setEnablingPush] = useState<boolean>(false);
  const [disablingPush, setDisablingPush] = useState<boolean>(false);
  const [storagePath, setStoragePath] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const savedPath = localStorage.getItem("storagePath");
    if (savedPath) {
      setStoragePath(savedPath);
    }
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

  const handleSaveStoragePath = () => {
    localStorage.setItem("storagePath", storagePath);
    toast.success("저장 경로를 저장했습니다.");
  };

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Due to browser security, we only get the folder name, not the full path.
      // The webkitRelativePath will give us the path relative to the selected folder,
      // but the actual folder name is usually the first part of this path.
      const folderName = files[0].webkitRelativePath.split('/')[0];
      setStoragePath(folderName);
      toast.info("브라우저 보안 정책으로 인해 폴더 이름만 가져올 수 있습니다.");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>푸시 알림</CardTitle>
          <CardDescription>
            {pushStatus === "enabled" ? "활성화됨" : "비활성화됨"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              새로운 알림을 받을지 여부를 설정합니다.
            </p>
            <button
              type="button"
              aria-label={pushStatus === "enabled" ? "알림 끄기" : "알림 켜기"}
              onClick={handleTogglePush}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur transition-colors ${
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
                <LuBell className="w-5 h-5 text-emerald-600" />
              ) : (
                <LuBellOff className="w-5 h-5 text-gray-500 dark:text-gray-300" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>파일 저장 위치</CardTitle>
          <CardDescription>
            페이지와 파일이 저장될 기본 경로를 설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              value={storagePath}
              onChange={(e) => setStoragePath(e.target.value)}
              placeholder="예: C:\Users\YourUser\Documents"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFolderSelect}
              // @ts-ignore
              webkitdirectory=""
              directory=""
              hidden
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <LuFolderOpen className="mr-2 h-4 w-4" />
              폴더 선택
            </Button>
            <Button onClick={handleSaveStoragePath}>
              <LuSave className="mr-2 h-4 w-4" />
              저장
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


