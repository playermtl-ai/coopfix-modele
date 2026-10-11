import type { Address } from "@/lib/types";

export function UnitSelect({ id, address, value, onChange, disabled }: { id: string; address?: Address; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const units = address?.allowed_units ?? [];
  return <select id={id} value={value} onChange={e => onChange(e.target.value)} disabled={disabled || !units.length} required={units.length > 0} className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base disabled:opacity-60">
    <option value="">{units.length ? "Choisir mon logement" : "Sans numéro de logement"}</option>
    {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
  </select>;
}
