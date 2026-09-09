"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoomCard } from "@/components/RoomCard";
import {
  adjustOccupancy,
  fetchRooms,
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import type { Room } from "@/lib/types";

function mergeRoom(rooms: Room[], next: Room) {
  const exists = rooms.some((room) => room.id === next.id);
  if (!exists) {
    return [...rooms, next].sort((a, b) => a.name.localeCompare(b.name));
  }
  return rooms.map((room) => (room.id === next.id ? next : room));
}

export function OccupancyDashboard() {
  // 1. 員工身分驗證 State
  const [isStaff, setIsStaff] = useState(false);
  const STAFF_PASSWORD = "1234";

  // 2. 解鎖函式
  const handleUnlock = () => {
    if (isStaff) {
      setIsStaff(false);
      return;
    }
    const input = prompt("請輸入員工密碼：");
    if (input === STAFF_PASSWORD) {
      setIsStaff(true);
      alert("驗證成功！已解鎖控制按鈕。");
    } else if (input !== null) {
      alert("密碼錯誤！");
    }
  };

  // 3. 📢 公告欄與不開放狀態 State
  const [notice, setNotice] = useState<string>("歡迎來到 Math Centre！請隨時留意各校舍開放時間。");
  const [isEditingNotice, setIsEditingNotice] = useState<boolean>(false);
  const [tempNotice, setTempNotice] = useState<string>(notice);
  const [closedRooms, setClosedRooms] = useState<Record<string, boolean>>({});

  // 切換房間開放/不開放
  const toggleRoomClosed = (roomId: string) => {
    setClosedRooms((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));
  };

  // 儲存公告欄內容
  const handleSaveNotice = () => {
    setNotice(tempNotice);
    setIsEditingNotice(false);
  };

  const configured = isSupabaseConfigured();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [live, setLive] = useState(false);

  const occupied = useMemo(
    () => rooms.reduce((sum, room) => sum + room.current_occupancy, 0),
    [rooms],
  );
  const seats = useMemo(
    () => rooms.reduce((sum, room) => sum + room.max_capacity, 0),
    [rooms],
  );

  const load = useCallback(async () => {
    if (!configured) return;
    try {
      setError(null);
      const data = await fetchRooms();
      setRooms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load rooms.");
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!configured) return;

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("rooms-occupancy")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        (payload) => {
          if (payload.eventType === "DELETE" && payload.old.id) {
            setRooms((current) =>
              current.filter((room) => room.id !== payload.old.id),
            );
            return;
          }

          const next = payload.new as Room;
          if (!next?.id) return;
          setRooms((current) => mergeRoom(current, next));
        },
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [configured]);

  async function onAdjust(roomId: string, delta: number) {
    setPendingIds((current) => new Set(current).add(roomId));
    setRooms((current) =>
      current.map((room) =>
        room.id === roomId
          ? {
              ...room,
              current_occupancy: Math.max(0, room.current_occupancy + delta),
            }
          : room,
      ),
    );

    try {
      const updated = await adjustOccupancy(roomId, delta);
      setRooms((current) => mergeRoom(current, updated));
    } catch (err) {
      await load();
      setError(err instanceof Error ? err.message : "Could not update occupancy.");
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(roomId);
        return next;
      });
    }
  }

  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Connect Supabase to go live
        </h2>
        <p className="mt-2 text-sm leading-6">
          Copy <code className="rounded bg-white/80 px-1.5 py-0.5">.env.example</code> to{" "}
          <code className="rounded bg-white/80 px-1.5 py-0.5">.env.local</code>, add your
          project URL and anon key, then run{" "}
          <code className="rounded bg-white/80 px-1.5 py-0.5">supabase/schema.sql</code>{" "}
          in the SQL Editor. Restart the dev server after saving env vars.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-2xl bg-white/70"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* 📢 告示欄公告區塊 */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-amber-900 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
            📢 中心公告欄
          </span>
          {isStaff && !isEditingNotice && (
            <button
              type="button"
              onClick={() => { setTempNotice(notice); setIsEditingNotice(true); }}
              className="text-xs text-amber-700 underline hover:text-amber-900 font-medium"
            >
              ✏️ 編輯公告
            </button>
          )}
        </div>

        {isEditingNotice ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={tempNotice}
              onChange={(e) => setTempNotice(e.target.value)}
              className="w-full p-2.5 text-sm rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingNotice(false)}
                className="px-3 py-1 text-xs rounded-lg border border-stone-300 bg-white"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveNotice}
                className="px-3 py-1 text-xs rounded-lg bg-amber-800 text-white font-medium"
              >
                儲存公告
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-amber-900/90 whitespace-pre-wrap leading-relaxed">
            {notice}
          </p>
        )}
      </div>

      {/* 數據統計與連線狀態標頭 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          <span className="font-semibold text-stone-900">{occupied}</span> students
          across <span className="font-semibold text-stone-900">{rooms.length}</span>{" "}
          rooms · {seats} seats
        </p>
        <p className="inline-flex items-center gap-2 text-xs font-medium text-stone-500">
          <span
            className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-stone-300"}`}
          />
          {live ? "Live sync" : "Connecting…"}
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      {rooms.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-8 text-center text-stone-600">
          No rooms yet. Run <code>supabase/schema.sql</code> to seed the math centre.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              pending={pendingIds.has(room.id)}
              onAdjust={(delta) => void onAdjust(room.id, delta)}
              isStaff={isStaff}
              onUnlock={handleUnlock}
              isClosed={closedRooms[room.id] || false}
              onToggleClose={() => toggleRoomClosed(room.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}