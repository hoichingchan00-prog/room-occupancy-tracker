export function occupancyPercent(current: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((current / max) * 100));
}

export type CapacityTone = "ok" | "busy" | "full";

/** Status color from headcount: green 0–10, yellow 11–30, red 31+. */
export function occupancyTone(currentCount: number): CapacityTone {
  if (currentCount >= 31) return "full";
  if (currentCount >= 11) return "busy";
  return "ok";
}

export function toneLabel(tone: CapacityTone) {
  if (tone === "full") return "人間地獄 🔥 (冷氣都唔夠凍)";
  if (tone === "busy") return "熱鬧過年宵 🧧 (剛剛好)";
  return "小貓三四隻 🐱 (靜到聽到心跳)";
}