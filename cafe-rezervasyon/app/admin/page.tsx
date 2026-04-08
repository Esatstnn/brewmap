"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/lib/supabase/client";

type ReservationRow = {
  id: string;
  user_id: string | null;
  cafe_id: string | null;
  district: string | null;
  selected_drink: string | null;
  occupancy_snapshot: number | null;
  table_id: number | null;
  area_type: "smoking" | "non-smoking" | null;
  reservation_time: string | null;
  status: string | null;
};

type CafeRow = {
  id: string;
  name: string;
  address: string;
};

type DistrictDatum = {
  name: string;
  total: number;
};

type CoffeeDatum = {
  name: string;
  total: number;
};

type OccupancyDatum = {
  district: string;
  avg: number;
  count: number;
};

type AreaDatum = {
  name: string;
  total: number;
};

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const indoorTables = [1, 2, 3, 4, 5, 6];
const outdoorTables = [7, 8, 9, 10, 11, 12];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [cafes, setCafes] = useState<CafeRow[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [selectedTime, setSelectedTime] = useState("20:00");
  const [userNameById, setUserNameById] = useState<Record<string, string>>({});

  async function loadAdminData(showLoader = false) {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError("");

    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData?.user?.email ?? "";
    const allowedEmail = (ADMIN_EMAIL ?? "").trim().toLowerCase();

    if (!userEmail) {
      router.replace("/login");
      return;
    }

    if (!allowedEmail || userEmail.toLowerCase() !== allowedEmail) {
      router.replace("/dashboard");
      return;
    }

    const [cafesResult, reservationsResult] = await Promise.all([
      supabase.from("cafes").select("id, name, address").order("name"),
      supabase
        .from("reservations")
        .select(
          "id, user_id, cafe_id, district, selected_drink, occupancy_snapshot, table_id, area_type, reservation_time, status"
        )
        .order("created_at", { ascending: false })
        .limit(1200),
    ]);

    if (cafesResult.error) {
      setError(cafesResult.error.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (reservationsResult.error) {
      setError(reservationsResult.error.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const cafeRows = (cafesResult.data as CafeRow[]) ?? [];
    const reservationRows = (reservationsResult.data as ReservationRow[]) ?? [];
    setCafes(cafeRows);
    setRows(reservationRows);

    if (!selectedCafeId && cafeRows.length > 0) {
      setSelectedCafeId(cafeRows[0].id);
    }

    const userIds = Array.from(
      new Set(
        reservationRows
          .map((item) => item.user_id)
          .filter((value): value is string => Boolean(value))
      )
    );

    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", userIds);

      const mapping: Record<string, string> = {};
      for (const user of usersData ?? []) {
        mapping[user.id as string] = (user.full_name as string) || "Kullanici";
      }
      setUserNameById(mapping);
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    void loadAdminData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-reservations-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => {
          void loadAdminData(false);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCafeId]);

  const districtData = useMemo<DistrictDatum[]>(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const district = row.district ?? "Bilinmiyor";
      map.set(district, (map.get(district) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [rows]);

  const coffeeData = useMemo<CoffeeDatum[]>(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const drink = row.selected_drink ?? "Bilinmiyor";
      map.set(drink, (map.get(drink) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [rows]);

  const occupancyData = useMemo<OccupancyDatum[]>(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const row of rows) {
      if (typeof row.occupancy_snapshot !== "number") continue;
      const district = row.district ?? "Bilinmiyor";
      const existing = map.get(district) ?? { total: 0, count: 0 };
      existing.total += row.occupancy_snapshot;
      existing.count += 1;
      map.set(district, existing);
    }

    return Array.from(map.entries())
      .map(([district, value]) => ({
        district,
        avg: Number((value.total / value.count).toFixed(1)),
        count: value.count,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [rows]);

  const areaData = useMemo<AreaDatum[]>(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = row.area_type === "smoking" ? "Sigara Icilen" : "Sigara Icilmeyen";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, total]) => ({ name, total }));
  }, [rows]);

  const selectedDateTime = useMemo(
    () => new Date(`${selectedDate}T${selectedTime}:00`),
    [selectedDate, selectedTime]
  );

  const selectedCafeRows = useMemo(
    () =>
      rows.filter(
        (item) =>
          item.cafe_id === selectedCafeId &&
          (item.status === "confirmed" || item.status === "pending")
      ),
    [rows, selectedCafeId]
  );

  const liveOccupiedMap = useMemo(() => {
    const map = new Map<
      string,
      { name: string; time: string; status: string; userId: string | null }
    >();
    for (const item of selectedCafeRows) {
      if (!item.table_id || !item.area_type || !item.reservation_time) continue;
      const reservationDate = new Date(item.reservation_time);
      const sameDay =
        reservationDate.getFullYear() === selectedDateTime.getFullYear() &&
        reservationDate.getMonth() === selectedDateTime.getMonth() &&
        reservationDate.getDate() === selectedDateTime.getDate();
      const sameHour = reservationDate.getHours() === selectedDateTime.getHours();
      if (!sameDay || !sameHour) continue;
      map.set(`${item.area_type}:${item.table_id}`, {
        name: userNameById[item.user_id ?? ""] ?? "Bilinmeyen Kullanici",
        time: reservationDate.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: item.status ?? "confirmed",
        userId: item.user_id,
      });
    }
    return map;
  }, [selectedCafeRows, selectedDateTime, userNameById]);

  function renderLiveTable(areaType: "smoking" | "non-smoking", tableId: number) {
    const reservation = liveOccupiedMap.get(`${areaType}:${tableId}`);
    const occupied = Boolean(reservation);

    return (
      <div
        key={`${areaType}:${tableId}`}
        className={`flex h-12 w-12 items-center justify-center rounded-lg border text-xs font-semibold ${
          occupied
            ? "border-red-300 bg-red-400 text-white"
            : "border-green-300 bg-green-400 text-white"
        }`}
        title={
          occupied
            ? `${reservation?.name} | ${reservation?.time}`
            : `Masa ${tableId} bos`
        }
      >
        {tableId}
      </div>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffcf2] text-[#451a03]">
        Veri yukleniyor...
      </main>
    );
  }

  return (
    <main className="fade-in min-h-screen bg-[#fffcf2] px-4 py-8 text-[#451a03]">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-white px-6 py-5 shadow-orange-900/10 shadow-lg">
          <div>
            <h1 className="text-2xl font-semibold text-[#451a03]">Admin Dashboard</h1>
            <p className="text-sm text-amber-900/70">
              Rezervasyon ve doluluk analizleri tek ekranda.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-amber-300 px-3 py-2 text-sm text-[#451a03] hover:bg-orange-100"
          >
            Kullanici Paneli
          </button>
        </div>

        <div className="grid gap-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-orange-900/10 shadow-md lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">Kafe Secimi</label>
            <select
              value={selectedCafeId}
              onChange={(event) => setSelectedCafeId(event.target.value)}
              className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm outline-none ring-amber-700 focus:ring-2"
            >
              {cafes.map((cafe) => (
                <option key={cafe.id} value={cafe.id}>
                  {cafe.name} - {cafe.address}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Tarih</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm outline-none ring-amber-700 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Saat</label>
            <input
              type="time"
              value={selectedTime}
              onChange={(event) => setSelectedTime(event.target.value)}
              className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm outline-none ring-amber-700 focus:ring-2"
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-orange-900/10 shadow-md">
            <h2 className="mb-4 text-lg font-semibold">Ilce Bazli Yogunluk</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" />
                  <XAxis dataKey="name" stroke="#7c2d12" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#7c2d12" />
                  <Tooltip />
                  <Bar dataKey="total" fill="#451a03" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-orange-900/10 shadow-md">
            <h2 className="mb-4 text-lg font-semibold">En Cok Tercih Edilen Kahveler</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={coffeeData} dataKey="total" nameKey="name" outerRadius={110} fill="#d97706" />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-amber-900">
              {coffeeData.slice(0, 5).map((coffee) => (
                <li key={coffee.name} className="flex items-center justify-between">
                  <span>{coffee.name}</span>
                  <span className="font-medium">{coffee.total}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-orange-900/10 shadow-md">
            <h2 className="mb-4 text-lg font-semibold">
              Sigara Icilen vs Icilmeyen Alan Tercihi
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={areaData}
                    dataKey="total"
                    nameKey="name"
                    outerRadius={95}
                    fill="#d97706"
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-orange-900/10 shadow-md">
            <h2 className="mb-4 text-lg font-semibold">Canli Masa Durumu</h2>
            <p className="mb-4 text-sm text-amber-900/80">
              {selectedDate} {selectedTime} saatine gore dolu masalar.
              {refreshing ? " Veriler guncelleniyor..." : ""}
            </p>

            <div className="space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                <p className="mb-3 text-sm font-medium text-green-800">
                  Sigara Icilmeyen Alan (Indoor)
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {indoorTables.map((tableId) =>
                    renderLiveTable("non-smoking", tableId)
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="mb-3 text-sm font-medium text-amber-800">
                  Sigara Icilen Alan (Outdoor / Terrace)
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {outdoorTables.map((tableId) =>
                    renderLiveTable("smoking", tableId)
                  )}
                </div>
              </div>
              <p className="text-xs text-amber-900/80">
                Kirmizi masalara fareyle gelince rezervasyonu yapan kisi ve saati
                gorunur.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-orange-900/10 shadow-md">
          <h2 className="mb-4 text-lg font-semibold">Doluluk Analizi</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-amber-200 text-amber-900/80">
                  <th className="px-3 py-2">Ilce</th>
                  <th className="px-3 py-2">Ortalama Doluluk</th>
                  <th className="px-3 py-2">Kayit Sayisi</th>
                </tr>
              </thead>
              <tbody>
                {occupancyData.map((item) => (
                  <tr key={item.district} className="border-b border-amber-100">
                    <td className="px-3 py-2">{item.district}</td>
                    <td className="px-3 py-2">%{item.avg}</td>
                    <td className="px-3 py-2">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
