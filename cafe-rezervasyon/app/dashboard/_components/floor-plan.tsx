"use client";

type AreaType = "smoking" | "non-smoking";

type FloorPlanProps = {
  occupiedKeys: Set<string>;
  selectedArea: AreaType | null;
  selectedTable: number | null;
  onSelectTable: (area: AreaType, tableId: number) => void;
};

const indoorTables = [1, 2, 3, 4, 5, 6];
const outdoorTables = [7, 8, 9, 10, 11, 12];

function tableKey(area: AreaType, tableId: number) {
  return `${area}:${tableId}`;
}

export default function FloorPlan({
  occupiedKeys,
  selectedArea,
  selectedTable,
  onSelectTable,
}: FloorPlanProps) {
  function renderTable(area: AreaType, tableId: number) {
    const key = tableKey(area, tableId);
    const occupied = occupiedKeys.has(key);
    const selected = selectedArea === area && selectedTable === tableId;

    const baseClass =
      "flex h-14 w-14 items-center justify-center rounded-xl border text-xs font-semibold transition";
    const stateClass = occupied
      ? "border-red-300 bg-red-400 text-white cursor-not-allowed"
      : selected
        ? "border-amber-600 bg-amber-500 text-white shadow-md"
        : "border-green-300 bg-green-400 text-white hover:scale-[1.03]";

    return (
      <button
        key={key}
        type="button"
        onClick={() => !occupied && onSelectTable(area, tableId)}
        disabled={occupied}
        className={`${baseClass} ${stateClass}`}
        title={occupied ? "Dolu" : `Masa ${tableId}`}
      >
        Masa {tableId}
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-amber-200 bg-[#fffaf0] p-4">
      <h4 className="text-base font-semibold text-[#451a03]">Kafe Kat Plani</h4>

      <section className="rounded-xl border border-green-200 bg-green-50 p-3">
        <p className="mb-3 text-sm font-medium text-green-800">
          Sigara Icilmeyen Alan (Indoor)
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {indoorTables.map((tableId) => renderTable("non-smoking", tableId))}
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="mb-3 text-sm font-medium text-amber-800">
          Sigara Icilen Alan (Outdoor / Terrace)
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {outdoorTables.map((tableId) => renderTable("smoking", tableId))}
        </div>
      </section>

      <div className="text-xs text-amber-900/80">
        <span className="font-semibold">Durum:</span> Yesil = Bos, Kirmizi = Dolu,
        Turuncu = Sectiginiz masa.
      </div>
    </div>
  );
}
