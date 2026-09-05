"use client";

import type { Room } from "@/lib/types";
import {
  occupancyPercent,
  occupancyTone,
  toneLabel,
} from "@/lib/occupancy";

type RoomCardProps = {
  room: Room;
  pending: boolean;
  onAdjust: (delta: number) => void;
  isStaff?: boolean;
  onUnlock?: () => void;
};

const barClass: Record<ReturnType<typeof occupancyTone>, string> = {
  ok: "bg-emerald-500",
  busy: "bg-amber-400",
  full: "bg-rose-500",
};

const badgeClass: Record<ReturnType<typeof occupancyTone>, string> = {
  ok: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  busy: "bg-amber-50 text-amber-900 ring-amber-200",
  full: "bg-rose-50 text-rose-800 ring-rose-200",
};

export function RoomCard({ room, pending, onAdjust, isStaff, onUnlock }: RoomCardProps) {
  const percent = occupancyPercent(room.current_occupancy, room.max_capacity);
  const tone = occupancyTone(room.current_occupancy);
  const atMin = room.current_occupancy <= 0;

  return (
    <article className="flex flex-col rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_10px_30px_-18px_rgba(28,25,23,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Classroom
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl leading-snug text-stone-900 sm:text-[1.35rem]">
            {room.name}
          </h2>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${badgeClass[tone]}`}
        >
          {toneLabel(tone)}
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
            Now in room
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-6xl leading-none tabular-nums text-stone-900">
            {room.current_occupancy}
          </p>
        </div>
        <p className="pb-1 text-sm text-stone-500">
          Max <span className="font-semibold text-stone-700">{room.max_capacity}</span>
        </p>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-stone-500">
          <span>Capacity</span>
          <span className="tabular-nums font-medium">{percent}%</span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-stone-100"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${room.name} has ${room.current_occupancy} people`}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-300 ease-out ${barClass[tone]}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <button
  type="button"
  onClick={onUnlock}
  className="w-full mb-2 py-2 text-xs font-semibold rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors"
>
  {isStaff ? "🔓 員工模式（已解鎖）" : "🔒 員工解鎖"}
</button>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!isStaff || pending || atMin}
          onClick={() => onAdjust(-1)}
          className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-lg font-semibold text-stone-800 transition hover:bg-stone-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          −1
        </button>
        <button
          type="button"
          disabled={!isStaff || pending}
          onClick={() => onAdjust(1)}
          className="rounded-xl bg-[var(--ink)] px-4 py-3 text-lg font-semibold text-[var(--paper)] transition hover:bg-stone-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          +1
        </button>
      </div>
    </article>
  );
}
