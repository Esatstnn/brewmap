"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { coffeeMenu } from "@/data/coffee-menu";

const RegionMap = dynamic(() => import("./dashboard/_components/region-map"), {
  ssr: false,
});

const ankaraDistrictCoordinates: Record<string, [number, number]> = {
  Yenimahalle: [39.9672, 32.8106],
  Cankaya: [39.9179, 32.8627],
  Kecioren: [39.9749, 32.8663],
  Etimesgut: [39.9495, 32.6886],
  Sincan: [39.9668, 32.5823],
};

export default function HomePage() {
  const [district, setDistrict] = useState("Yenimahalle");
  const [toast, setToast] = useState("");

  const districtCenter = ankaraDistrictCoordinates[district];
  const featuredCafes = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, index) => ({
        id: index + 1,
        name: `${district} ${["Kahve Duragi", "Bean Point", "Latte Lab", "Mocha Spot", "Roast Hub", "Brew Corner"][index]}`,
        eta: `${5 + index * 2} dk`,
      })),
    [district]
  );

  function handleReserve(cafeName: string) {
    setToast(`${cafeName} secildi. Rezervasyon icin giris yapmaniz gerekiyor.`);
    setTimeout(() => setToast(""), 2200);
  }

  return (
    <main className="fade-in min-h-screen bg-[#fffcf2] px-4 py-8 text-[#451a03]">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex items-center justify-between rounded-2xl border border-amber-200 bg-white px-5 py-4 shadow-orange-900/10 shadow-lg">
          <div className="flex items-center gap-3">
            <Image
              src="/images/brewmap-icon.png"
              alt="BrewMap logo"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full border border-amber-200 bg-white p-1 object-cover"
              priority
            />
            <h1 className="brand-script text-3xl leading-none">
              <span className="text-[#451a03]">Brew</span>{" "}
              <span className="text-[#d97706]">Map</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-amber-300 px-3 py-2 text-sm hover:bg-orange-100"
            >
              Giris
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#451a03] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#d97706]"
            >
              Kayit Ol
            </Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-orange-900/10 shadow-lg">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Interaktif Kafe Haritasi</h2>
                <p className="text-sm text-amber-900/70">
                  Ilce sec, kafeleri haritada incele ve rezervasyon baslat.
                </p>
              </div>
              <select
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm outline-none ring-amber-700 focus:ring-2"
              >
                {Object.keys(ankaraDistrictCoordinates).map((districtOption) => (
                  <option key={districtOption} value={districtOption}>
                    {districtOption}
                  </option>
                ))}
              </select>
            </div>

            <RegionMap
              district={district}
              center={districtCenter}
              onReserve={(cafe) => handleReserve(cafe.name)}
            />
          </div>

          <aside className="space-y-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-orange-900/10 shadow-lg">
            <h3 className="text-xl font-semibold">Populer Kafeler</h3>
            <ul className="space-y-3">
              {featuredCafes.map((cafe) => (
                <li
                  key={cafe.id}
                  className="rounded-xl border border-amber-100 bg-orange-50 p-3"
                >
                  <p className="font-medium">{cafe.name}</p>
                  <p className="text-xs text-amber-900/70">Ortalama ulasim: {cafe.eta}</p>
                  <button
                    type="button"
                    onClick={() => handleReserve(cafe.name)}
                    className="mt-2 rounded-lg bg-[#451a03] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#d97706]"
                  >
                    Rezervasyon Yap
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-orange-900/10 shadow-lg">
          <h3 className="text-xl font-semibold">Menu Onerileri</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {coffeeMenu.slice(0, 3).map((group) => (
              <div key={group.category} className="rounded-xl border border-amber-100 bg-orange-50 p-3">
                <p className="font-medium">{group.category}</p>
                <p className="mt-1 text-xs text-amber-900/70">
                  {group.items.slice(0, 4).join(" - ")}
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>

      {toast ? (
        <div className="fixed bottom-5 right-5 z-[9999] rounded-xl border border-amber-300 bg-orange-50 px-4 py-3 text-sm text-amber-900 shadow-lg">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
