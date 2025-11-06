"use client";

// Base64 URL to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData =
    typeof window !== "undefined"
      ? window.atob(base64)
      : Buffer.from(base64, "base64").toString("binary");
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function ensurePushEnabled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    typeof Notification === "undefined"
  ) {
    console.warn("[Push] Not supported");
    return false;
  }
  const publicKey = (
    process.env.NEXT_PUBLIC_PUSH_VAPID_PUBLIC_KEY || ""
  ).trim();
  if (!publicKey) {
    console.warn("[Push] Missing NEXT_PUBLIC_PUSH_VAPID_PUBLIC_KEY");
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        console.warn("[Push] Permission not granted:", perm);
        return false;
      }
    }
    if (Notification.permission !== "granted") {
      console.warn("[Push] Permission is:", Notification.permission);
      return false;
    }

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const keyBytes = urlBase64ToUint8Array(publicKey);
      // Create a fresh Uint8Array backed by an ArrayBuffer (not SharedArrayBuffer)
      const keyCopy = new Uint8Array(keyBytes.length);
      keyCopy.set(keyBytes);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyCopy,
      });
    }
    const ensuredSub: PushSubscription = sub as PushSubscription;

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ensuredSub),
    });
    if (!res.ok) {
      console.warn("[Push] subscribe API failed", res.status);
      return false;
    }
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    console.error("[Push] enable failed", e);
    return false;
  }
}

export async function disablePush(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || typeof Notification === "undefined")
    return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return true;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return true;
    const endpoint: string = sub.endpoint;
    await sub.unsubscribe();
    const res = await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
    return res.ok;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
}
