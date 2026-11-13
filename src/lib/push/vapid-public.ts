/**
 * Public VAPID key used by browser PushManager to subscribe to web push notifications.
 * This is public by design and safe to expose in client bundles.
 */
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BIlVELI6bnGH1W8YF4fy-gnAbPwzAxDS8RkU_B_TfpknReFrJIl51QvJIuzASvgvsTMw2phZksuGpWGXu7pBXnQ";
