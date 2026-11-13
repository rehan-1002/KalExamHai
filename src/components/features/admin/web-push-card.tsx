"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Send, CheckCircle2, Loader2, Smartphone, ShieldAlert, Sparkles } from "lucide-react";
import { broadcastWebPushAction, testAdminPushAction } from "@/app/admin/actions";
import { VAPID_PUBLIC_KEY } from "@/lib/push/vapid-public";

interface WebPushCardProps {
  subscriptionCount: number;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function WebPushCard({ subscriptionCount }: WebPushCardProps) {
  const router = useRouter();
  const [title, setTitle] = useState("🚨 Tomorrow's Exam Alert!");
  const [body, setBody] = useState("Maths-1 predicted high-probability questions are now live. Revise now!");
  const [url, setUrl] = useState("/student/cram/new?type=kt_buster");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Admin Device Specific Alert State
  const [isDeviceSubscribed, setIsDeviceSubscribed] = useState(false);
  const [isRegisteringDevice, setIsRegisteringDevice] = useState(false);
  const [deviceAlertMsg, setDeviceAlertMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window) {
      if (Notification.permission === "granted") {
        navigator.serviceWorker.ready
          .then((reg) => reg.pushManager.getSubscription())
          .then((sub) => {
            if (sub) setIsDeviceSubscribed(true);
          })
          .catch(() => {});
      }
    }
  }, []);

  const handleRegisterThisDevice = async () => {
    try {
      setIsRegisteringDevice(true);
      setDeviceAlertMsg(null);

      if (!("serviceWorker" in navigator) || !("Notification" in window)) {
        setDeviceAlertMsg("❌ Push notifications are not supported on this browser.");
        setIsRegisteringDevice(false);
        return;
      }

      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setDeviceAlertMsg("⚠️ Notification permission was dismissed or blocked in browser settings.");
        setIsRegisteringDevice(false);
        return;
      }

      await navigator.serviceWorker.register("/sw.js");
      const reg = await navigator.serviceWorker.ready;

      // Use imported public VAPID key with dynamic endpoint fallback
      let vapidKey = VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        try {
          const keyRes = await fetch("/api/push/vapid-public-key");
          const keyJson = await keyRes.json();
          vapidKey = keyJson.publicKey;
        } catch {}
      }

      if (!vapidKey) throw new Error("VAPID public key not configured.");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub, role: "admin" }),
      });

      if (!res.ok) {
        throw new Error("Failed to save push subscription on server");
      }

      setIsDeviceSubscribed(true);
      setIsRegisteringDevice(false);
      setDeviceAlertMsg("✅ Success! This device will now vibrate and pop up whenever a student submits feedback.");
      router.refresh();
      setTimeout(() => setDeviceAlertMsg(null), 6000);
    } catch (err: unknown) {
      setDeviceAlertMsg(`❌ Registration failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setIsRegisteringDevice(false);
    }
  };

  const handleSendTestPing = () => {
    setDeviceAlertMsg(null);
    startTransition(async () => {
      try {
        const res = await testAdminPushAction();
        if (res.ok) {
          setDeviceAlertMsg("🔔 Test notification dispatched! Check your lockscreen / notification bar now.");
          setTimeout(() => setDeviceAlertMsg(null), 5000);
        } else {
          setDeviceAlertMsg(`❌ Test failed: ${res.error}`);
        }
      } catch {
        setDeviceAlertMsg("❌ Network error sending test alert.");
      }
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setStatusMessage(null);
    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("body", body.trim());
    fd.append("url", url.trim());

    startTransition(async () => {
      try {
        const res = await broadcastWebPushAction(fd);
        if (res.ok && "sent" in res) {
          setStatusMessage(`✅ Web push delivered to ${res.sent}/${res.total} subscribed devices!`);
          setTimeout(() => setStatusMessage(null), 4000);
        } else {
          setStatusMessage(`❌ Error: ${res.error}`);
        }
      } catch {
        setStatusMessage("❌ Network error sending push notification.");
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#E7E5E0] shadow-sm p-6 space-y-5">
      {/* 1. Admin Instant Feedback Alert Banner */}
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1F2937]">Founder Instant Feedback Alerts</span>
              {isDeviceSubscribed ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active on this Device
                </span>
              ) : (
                <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Not Enabled on this Device
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Phone vibrates & displays a lockscreen popup the instant any student sends feedback or reports a bug.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {isDeviceSubscribed ? (
            <button
              type="button"
              disabled={isPending}
              onClick={handleSendTestPing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
              <span>Test Ping My Screen</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isRegisteringDevice}
              onClick={handleRegisterThisDevice}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all cursor-pointer"
            >
              {isRegisteringDevice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
              <span>Enable Alerts on this Device</span>
            </button>
          )}
        </div>
      </div>

      {deviceAlertMsg && (
        <div className="text-xs font-medium text-slate-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{deviceAlertMsg}</span>
        </div>
      )}

      {/* 2. Broadcast Web Push to All Subscribed Students */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-3 border-b border-[#E7E5E0]">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-emerald-600 animate-bounce" />
          <div>
            <h3 className="text-sm font-semibold text-[#1F2937]">
              Lockscreen Web Push Broadcast ({subscriptionCount} Devices Subscribed)
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Pushes a vibrating notification directly to students&apos; phones even when the browser is closed.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-[6px] border border-emerald-200 self-start sm:self-auto">
          PWA Push Active
        </span>
      </div>

      <form onSubmit={handleSend} className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Notification Title</label>
            <input
              type="text"
              required
              value={title}
              disabled={isPending}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🚨 Applied Maths-1 Alert"
              className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Tap Redirect URL</label>
            <input
              type="text"
              value={url}
              disabled={isPending}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. /student/cram/new?type=kt_buster"
              className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Notification Message</label>
          <input
            type="text"
            required
            value={body}
            disabled={isPending}
            onChange={(e) => setBody(e.target.value)}
            placeholder="e.g. These 6 repeat questions have 90% chance of appearing in Q1 & Q2!"
            className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] outline-none focus:border-[#2563EB]"
          />
        </div>

        {statusMessage && (
          <div className="text-xs font-medium text-slate-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !title.trim() || !body.trim() || subscriptionCount === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{isPending ? "Sending Push..." : "Send Lockscreen Push to All"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
