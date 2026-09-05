import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Room } from "@/lib/types";

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }

  return browserClient;
}

export async function fetchRooms() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, max_capacity, current_occupancy, updated_at")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Room[];
}

export async function adjustOccupancy(roomId: string, delta: number) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("adjust_occupancy", {
    p_room_id: roomId,
    p_delta: delta,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row as Room;
}
