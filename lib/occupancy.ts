export function occupancyPercent(current: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((current / max) * 100));
}

export type CapacityTone = "ok" | "busy" | "full";

/** Status color from headcount: green 0–5, yellow 6–15, red 16+. */
export function occupancyTone(currentCount: number): CapacityTone {
  if (currentCount >= 16) return "full";
  if (currentCount >= 6) return "busy";
  return "ok";
}

export function toneLabel(tone: CapacityTone) {
  if (tone === "full") return "16+ in room";
  if (tone === "busy") return "6–15 in room";
  return "0–5 in room";
}
