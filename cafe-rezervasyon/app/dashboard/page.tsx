"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FloorPlan from "./_components/floor-plan";
import { flatCoffeeMenu } from "@/data/coffee-menu";
import { supabase } from "@/lib/supabase/client";

const RegionMap = dynamic(() => import("./_components/region-map"), {
  ssr: false,
});

const ankaraDistrictCoordinates: Record<string, [number, number]> = {
  Cankaya: [39.9179, 32.8627],
  Kecioren: [39.9749, 32.8663],
  Mamak: [39.9311, 32.9195],
  Etimesgut: [39.9495, 32.6886],
  Sincan: [39.9668, 32.5823],
  Golbasi: [39.7899, 32.8075],
  Altindag: [39.9551, 32.8543],
  Pursaklar: [40.0402, 32.9006],
  Yenimahalle: [39.9672, 32.8106],
  Polatli: [39.5772, 32.1413],
  Cubuk: [40.2386, 33.0322],
  Beypazari: [40.1673, 31.9198],
  Nallihan: [40.1889, 31.3517],
  Akyurt: [40.1292, 33.0873],
  Kahramankazan: [40.1656, 32.6398],
  Elmadag: [39.9205, 33.2307],
  Bala: [39.5546, 33.1237],
  Kalecik: [40.0977, 33.4088],
  Kizilcahamam: [40.4698, 32.6509],
  Haymana: [39.4312, 32.4969],
  Evren: [39.0249, 33.8064],
  Gudul: [40.2106, 32.2452],
  Ayas: [40.0183, 32.3338],
  Camlidere: [40.4908, 32.4747],
  Sereflikochisar: [38.9397, 33.5422],
};

const cityDistricts: Record<string, string[]> = {
  Ankara: Object.keys(ankaraDistrictCoordinates),
};
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase();

type SelectedCafe = {
  id: number;
  name: string;
  occupancy: number;
};

type AreaType = "smoking" | "non-smoking";
type ModalStep = "plan" | "form" | "payment";

export default function DashboardPage() {
  const router = useRouter();
  const [city, setCity] = useState("Ankara");
  const [district, setDistrict] = useState("Yenimahalle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedCafe, setSelectedCafe] = useState<SelectedCafe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("plan");
  const [guestCount, setGuestCount] = useState(2);
  const [reservationTime, setReservationTime] = useState("17:00");
  const [drink, setDrink] = useState(flatCoffeeMenu[0] ?? "Espresso");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [reservationLoading, setReservationLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [cafeDbId, setCafeDbId] = useState<string | null>(null);
  const [occupiedTableKeys, setOccupiedTableKeys] = useState<Set<string>>(
    new Set()
  );
  const [selectedAreaType, setSelectedAreaType] = useState<AreaType | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function checkAdminRole() {
      const { data } = await supabase.auth.getUser();
      const userEmail = data.user?.email?.toLowerCase() ?? "";
      setUserEmail(data.user?.email ?? "");
      setIsAdmin(ADMIN_EMAIL.length > 0 && userEmail === ADMIN_EMAIL);
    }

    void checkAdminRole();
  }, []);

  async function openReservationModal(cafe: SelectedCafe) {
    setSelectedCafe(cafe);
    setIsModalOpen(true);
    setModalStep("plan");
    setPlanLoading(true);
    setSuccessMessage("");
    setError("");
    setSelectedAreaType(null);
    setSelectedTableId(null);
    setOccupiedTableKeys(new Set());

    const districtAddress = `${district}, ${city}`;

    let nextCafeId: string | null = null;
    const { data: existingCafe, error: cafeSelectError } = await supabase
      .from("cafes")
      .select("id")
      .eq("name", cafe.name)
      .eq("address", districtAddress)
      .maybeSingle();

    if (cafeSelectError) {
      setError(cafeSelectError.message);
      setPlanLoading(false);
      return;
    }

    if (existingCafe?.id) {
      nextCafeId = existingCafe.id;
    } else {
      const { data: insertedCafe, error: cafeInsertError } = await supabase
        .from("cafes")
        .insert({
          name: cafe.name,
          address: districtAddress,
          city,
          description: `Mock kafe - ${district}`,
          is_active: true,
        })
        .select("id")
        .single();

      if (cafeInsertError || !insertedCafe) {
        setError(cafeInsertError?.message ?? "Kafe bilgisi hazirlanamadi.");
        setPlanLoading(false);
        return;
      }

      nextCafeId = insertedCafe.id;
    }

    setCafeDbId(nextCafeId);

    const { data: occupiedRows, error: occupiedError } = await supabase
      .from("reservations")
      .select("table_id, area_type, status, reservation_time")
      .eq("cafe_id", nextCafeId)
      .in("status", ["pending", "confirmed"]);

    if (occupiedError) {
      setError(occupiedError.message);
      setPlanLoading(false);
      return;
    }

    const occupiedSet = new Set<string>();
    for (const row of occupiedRows ?? []) {
      const areaType = row.area_type as AreaType | null;
      const tableId = row.table_id as number | null;
      if (!areaType || !tableId) continue;
      occupiedSet.add(`${areaType}:${tableId}`);
    }
    setOccupiedTableKeys(occupiedSet);
    setPlanLoading(false);
  }

  function closeReservationModal() {
    setIsModalOpen(false);
    setModalStep("plan");
    setSelectedCafe(null);
    setCafeDbId(null);
    setPlanLoading(false);
  }

  function startFormStep() {
    if (!selectedAreaType || !selectedTableId) {
      setError("Lutfen kat planindan bir masa secin.");
      return;
    }
    setError("");
    setModalStep("form");
  }

  function startPaymentStep() {
    if (!selectedCafe) return;
    if (!reservationTime) {
      setError("Lutfen saat seciniz.");
      return;
    }
    setError("");
    setModalStep("payment");
  }

  async function handleCreateReservationWithPayment() {
    if (!selectedCafe || !cafeDbId || !selectedAreaType || !selectedTableId) return;
    setReservationLoading(true);
    setError("");
    setSuccessMessage("");

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      setError("Kullanici bilgisi alinamadi. Lutfen tekrar giris yapin.");
      setReservationLoading(false);
      return;
    }

    const [hours, minutes] = reservationTime.split(":").map(Number);
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);

    const { error: reservationError } = await supabase.from("reservations").insert({
      user_id: user.id,
      cafe_id: cafeDbId,
      reservation_time: scheduledDate.toISOString(),
      guest_count: guestCount,
      selected_drink: drink,
      district,
      occupancy_snapshot: selectedCafe.occupancy,
      table_id: selectedTableId,
      area_type: selectedAreaType,
      notes: `Masa: ${selectedTableId} | Alan: ${selectedAreaType} | Odeme: Basarili (Mock)`,
      status: "confirmed",
    });

    if (reservationError) {
      setError(reservationError.message);
      setReservationLoading(false);
      return;
    }

    setReservationLoading(false);
    setSuccessMessage("Odeme Basarili, Randevunuz Alindi.");
    setGuestCount(2);
    setReservationTime("17:00");
    setDrink(flatCoffeeMenu[0] ?? "Espresso");
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvc("");
    setSelectedAreaType(null);
    setSelectedTableId(null);
    closeReservationModal();
  }

  async function handleLogout() {
    setLoading(true);
    setError("");

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      setLoading(false);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  const selectedDistricts = cityDistricts[city] ?? [];
  const showMap = city === "Ankara" && district.length > 0;
  const districtCenter = ankaraDistrictCoordinates[district];

  return (
    <main className="fade-in min-h-screen bg-[#fffcf2] px-4 py-6 text-[#451a03] sm:py-8">
      <section className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-b border-amber-900/20 bg-white px-5 py-4 shadow-orange-900/10 shadow-lg">
          <div className="flex items-center gap-3">
            <Image
              src="/images/brewmap-icon.png"
              alt="BrewMap logo"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full border border-amber-200 bg-white p-1 object-cover shadow-sm shadow-orange-900/10"
              priority
            />
            <h1 className="brand-script text-3xl leading-none">
              <span className="text-[#451a03]">Brew</span>{" "}
              <span className="text-[#d97706]">Map</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-amber-200 bg-orange-50 px-3 py-1.5 text-sm text-amber-900">
              {userEmail || "Kullanici"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-[#451a03] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d97706] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Cikis Yapiliyor..." : "Cikis Yap"}
            </button>
          </div>
        </header>

        <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-orange-900/10 shadow-xl sm:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Kafe Rezervasyon Paneli
          </h2>
          <p className="text-sm text-amber-800/80">
            Bolge secimi yaparak yakindaki kafeleri harita uzerinde kesfet.
          </p>
          {isAdmin ? (
            <div>
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="mt-2 inline-flex rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-[#451a03] transition hover:bg-orange-100"
              >
                Admin Paneline Git
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[340px,1fr]">
          <div className="rounded-2xl border border-amber-200 bg-orange-50 p-4 shadow-orange-900/10 shadow-md sm:p-5">
            <h3 className="text-lg font-semibold text-slate-900">Bolge Secimi</h3>
            <div className="mt-4 grid gap-4">
            <div>
              <label className="mb-2 block text-sm text-amber-900">Il</label>
              <select
                value={city}
                onChange={(event) => {
                  const nextCity = event.target.value;
                  const nextDistrict = cityDistricts[nextCity]?.[0] ?? "";
                  setCity(nextCity);
                  setDistrict(nextDistrict);
                }}
                className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none ring-amber-700 transition focus:ring-2"
              >
                {Object.keys(cityDistricts).map((cityOption) => (
                  <option key={cityOption} value={cityOption}>
                    {cityOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-amber-900">Ilce</label>
              <select
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none ring-amber-700 transition focus:ring-2"
              >
                {selectedDistricts.map((districtOption) => (
                  <option key={districtOption} value={districtOption}>
                    {districtOption}
                  </option>
                ))}
              </select>
            </div>
          </div>
          </div>
        <div>
          {showMap && districtCenter ? (
            <div className="rounded-2xl border border-amber-300 bg-white p-2 shadow-orange-900/10 shadow-lg">
              <RegionMap
                district={district}
                center={districtCenter}
                onReserve={(cafe) => openReservationModal(cafe)}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-amber-300 bg-orange-50 px-4 py-10 text-center text-sm text-amber-800/80 shadow-sm">
              Haritayi goruntulemek icin il ve ilce seciniz.
            </div>
          )}
        </div>
        </div>

        {successMessage ? (
          <p className="mt-6 rounded-lg border border-amber-300 bg-orange-50 px-3 py-2 text-sm text-amber-900">
            {successMessage}
          </p>
        ) : null}

        </div>
      </section>

      {isModalOpen && selectedCafe ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-4xl rounded-2xl border border-amber-200 bg-white p-6 text-slate-900 shadow-orange-900/10 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {modalStep === "plan"
                    ? "Masa Secimi"
                    : modalStep === "form"
                      ? "Rezervasyon Formu"
                      : "Odeme Yap (Mock)"}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedCafe.name} - %{selectedCafe.occupancy} Dolu
                </p>
              </div>
              <button
                type="button"
                onClick={closeReservationModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-300 bg-white text-xl font-semibold text-amber-900 transition hover:bg-amber-50"
                aria-label="Modali kapat"
              >
                ×
              </button>
            </div>

            {modalStep === "plan" ? (
              <div className="mt-5 space-y-4">
                {planLoading ? (
                  <div className="rounded-xl border border-amber-200 bg-orange-50 px-4 py-10 text-center text-sm text-amber-900">
                    Kat plani hazirlaniyor...
                  </div>
                ) : (
                  <>
                    <FloorPlan
                      occupiedKeys={occupiedTableKeys}
                      selectedArea={selectedAreaType}
                      selectedTable={selectedTableId}
                      onSelectTable={(areaType, tableId) => {
                        setSelectedAreaType(areaType);
                        setSelectedTableId(tableId);
                      }}
                    />
                    <button
                      type="button"
                      onClick={startFormStep}
                      className="w-full rounded-xl bg-[#451a03] px-4 py-3 font-semibold text-white transition hover:bg-[#d97706]"
                    >
                      Masa Secimini Onayla
                    </button>
                  </>
                )}
              </div>
            ) : modalStep === "form" ? (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-700">Masa Numarasi</label>
                  <input
                    type="text"
                    readOnly
                    value={selectedTableId ? `Masa ${selectedTableId}` : ""}
                    className="w-full rounded-xl border border-amber-300 bg-orange-50 px-4 py-3 text-sm text-amber-900 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-700">Alan Tipi</label>
                  <input
                    type="text"
                    readOnly
                    value={
                      selectedAreaType === "smoking"
                        ? "Sigara Icilen Alan (Outdoor)"
                        : "Sigara Icilmeyen Alan (Indoor)"
                    }
                    className="w-full rounded-xl border border-amber-300 bg-orange-50 px-4 py-3 text-sm text-amber-900 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-700">Kisi Sayisi</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={guestCount}
                    onChange={(event) => setGuestCount(Number(event.target.value))}
                    className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none ring-amber-700 transition focus:ring-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-700">Saat</label>
                  <input
                    type="time"
                    value={reservationTime}
                    onChange={(event) => setReservationTime(event.target.value)}
                    className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none ring-amber-700 transition focus:ring-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-700">Icecek Secimi</label>
                  <select
                    value={drink}
                    onChange={(event) => setDrink(event.target.value)}
                    className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none ring-amber-700 transition focus:ring-2"
                  >
                    {flatCoffeeMenu.map((drinkOption) => (
                      <option key={drinkOption} value={drinkOption}>
                        {drinkOption}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={startPaymentStep}
                  className="w-full rounded-xl bg-[#451a03] px-4 py-3 font-semibold text-white transition hover:bg-[#d97706]"
                >
                  Randevu Olustur
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-700">Kart Uzerindeki Isim</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(event) => setCardName(event.target.value)}
                    placeholder="ESAT YILMAZ"
                    className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none ring-amber-700 transition focus:ring-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-700">Kart Numarasi</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(event) => setCardNumber(event.target.value)}
                    placeholder="4111 1111 1111 1111"
                    className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none ring-amber-700 transition focus:ring-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">SKT</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(event) => setCardExpiry(event.target.value)}
                      placeholder="12/28"
                      className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none ring-amber-700 transition focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">CVC</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(event) => setCardCvc(event.target.value)}
                      placeholder="123"
                      className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none ring-amber-700 transition focus:ring-2"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateReservationWithPayment}
                  disabled={reservationLoading}
                  className="w-full rounded-xl bg-[#451a03] px-4 py-3 font-semibold text-white transition hover:bg-[#d97706] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reservationLoading ? "Islem Suruyor..." : "Ode"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="fixed bottom-5 right-5 z-[10000] max-w-sm rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
          {error}
        </div>
      ) : null}
    </main>
  );
}
