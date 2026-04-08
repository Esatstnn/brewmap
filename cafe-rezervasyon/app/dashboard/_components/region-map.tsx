"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

const coffeePinIcon = L.divIcon({
  className: "coffee-pin",
  html: `<div style="width:26px;height:26px;border-radius:9999px;background:#451a03;border:2px solid #d97706;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 14px rgba(69,26,3,.28);font-size:13px;line-height:1;">☕</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

type Cafe = {
  id: number;
  name: string;
  position: [number, number];
  occupancy: number;
};

type RegionMapProps = {
  district: string;
  center: [number, number];
  onReserve: (cafe: Cafe) => void;
};

const cafeNames = [
  "Kahve Duragi",
  "Moka Noktasi",
  "Demli Kose",
  "Bean Avenue",
  "Latte Lab",
  "Roast House",
  "Sokak Kahvecisi",
];

function seededRandom(seed: number) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

export default function RegionMap({ district, center, onReserve }: RegionMapProps) {
  const cafes = useMemo(() => {
    const [lat, lng] = center;
    const districtSeed = district
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const count = districtSeed % 2 === 0 ? 6 : 5;
    const radius = 0.02;

    return Array.from({ length: count }).map((_, index) => {
      const latOffset = (seededRandom(districtSeed + index * 7) - 0.5) * radius;
      const lngOffset = (seededRandom(districtSeed + index * 11) - 0.5) * radius;
      const occupancy = (Math.floor(seededRandom(districtSeed + index * 13) * 9) + 2) * 10;

      const cafe: Cafe = {
        id: index + 1,
        name: `${district} ${cafeNames[index % cafeNames.length]}`,
        position: [lat + latOffset, lng + lngOffset],
        occupancy,
      };

      return cafe;
    });
  }, [center, district]);

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200 shadow-orange-900/10 shadow-md">
      <MapContainer
        key={`${district}-${center[0]}-${center[1]}`}
        center={center}
        zoom={13}
        scrollWheelZoom
        className="h-[420px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {cafes.map((cafe) => (
          <Marker key={cafe.id} position={cafe.position} icon={coffeePinIcon}>
            <Popup>
              <div className="space-y-2">
                <p className="font-semibold text-zinc-900">{cafe.name}</p>
                <p className="text-sm text-zinc-700">%{cafe.occupancy} Dolu</p>
                <button
                  type="button"
                  onClick={() => onReserve(cafe)}
                  className="w-full rounded-md bg-[#451a03] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#d97706]"
                >
                  Rezervasyon Yap
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
