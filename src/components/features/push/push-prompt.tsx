"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellRing, X, Check, Loader2 } from "lucide-react";
import { VAPID_PUBLIC_KEY } from "@/lib/push/vapid-public";

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

export function PushPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) {
      return;
    }

    // Register Service Worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Check existing subscription
        return reg.pushManager.getSubscription();
      })
      .then((sub) => {
        if (sub) {
          setIsSubscribed(true);
        } else if (Notification.permission === "default") {
          const dismissed = sessionStorage.getItem("keh_push_prompt_dismissed");
          if (!dismissed) {
            // Show prompt after 3.5 seconds
            const timer = setTimeout(() => setShowPrompt(true), 3500);
            return () => clearTimeout(timer);
          }
        }
      })
      .catch((err) => {
        console.warn("SW register error:", err);
      });
  }, []);

  const handleSubscribe = async () => {
    try {
      setIsSubscribing(true);
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setShowPrompt(false);
        setIsSubscribing(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let vapidPublicKey = VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        try {
          const keyRes = await fetch("/api/push/vapid-public-key");
          const keyJson = await keyRes.json();
          vapidPublicKey = keyJson.publicKey;
        } catch {}
      }
      if (!vapidPublicKey) throw new Error("VAPID public key missing");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      setIsSubscribed(true);
      setIsSubscribing(false);
      setTimeout(() => setShowPrompt(false), 2000);
    } catch (err) {
      console.error("Push subscription failed:", err);
      setIsSubscribing(false);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("keh_push_prompt_dismissed", "true");
  };

  if (!showPrompt || isSubscribed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 print:hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/60 flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 shrink-0 mt-0.5 border border-blue-500/20">
          <BellRing className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
            <span>Get Exam &amp; Paper Alerts on Lockscreen</span>
          </h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
            Get instant alerts when tomorrow&apos;s predicted questions and formula notes drop—even when the browser is closed.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubscribing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isSubscribed ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Bell className="w-3.5 h-3.5" />
              )}
              <span>{isSubscribing ? "Enabling..." : isSubscribed ? "Enabled!" : "Allow Alerts"}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

