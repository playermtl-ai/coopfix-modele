import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

type Suggestion = { Id: string; Text: string; Description: string; Next: string };
type PostalAddress = { BuildingNumber: string; Street: string; City: string; ProvinceCode: string; PostalCode: string; SubBuilding: string };
const key = import.meta.env.VITE_ADDRESSCOMPLETE_KEY as string | undefined;

async function postalRequest<T>(method: "Find" | "Retrieve", parameters: Record<string, string>, signal?: AbortSignal): Promise<T[]> {
  const version = method === "Find" ? "v2.10" : "v2.11";
  const params = new URLSearchParams({ Key: key!, ...parameters });
  const response = await fetch(`https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/${method}/${version}/json3.ws?${params}`, { signal });
  if (!response.ok) throw new Error("postal-service");
  const body = await response.json();
  if (!Array.isArray(body.Items) || body.Items.some((item: { Error?: string }) => item.Error)) throw new Error("postal-service");
  return body.Items;
}

export function PostalAddressSearch({ onSelect }: { onSelect: (address: string, unit: string) => void }) {
  const [search, setSearch] = useState("");
  const [container, setContainer] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    const current = ++generation.current;
    if (!key || (!container && search.trim().length < 3)) { setSuggestions([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setBusy(true); setError("");
      void postalRequest<Suggestion>("Find", { SearchTerm: search, LastId: container, Country: "CAN", LanguagePreference: "fr", MaxSuggestions: "20" }, controller.signal)
        .then(items => { if (generation.current === current) setSuggestions(items); })
        .catch(() => { if (!controller.signal.aborted) setError("Les suggestions sont indisponibles. Vous pouvez saisir l’adresse ci-dessous."); })
        .finally(() => { if (generation.current === current) setBusy(false); });
    }, 400);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [search, container]);

  async function choose(item: Suggestion) {
    if (item.Next === "Find") { setContainer(item.Id); setSearch(""); return; }
    const current = ++generation.current;
    setBusy(true); setError("");
    try {
      const [address] = await postalRequest<PostalAddress>("Retrieve", { Id: item.Id });
      if (generation.current !== current) return;
      if (!address) throw new Error("postal-service");
      const master = [`${address.BuildingNumber} ${address.Street}`.trim(), address.City, address.ProvinceCode, address.PostalCode].filter(Boolean).join(", ");
      onSelect(master, address.SubBuilding?.trim() ?? "");
      setSuggestions([]);
    } catch { if (generation.current === current) setError("Cette adresse n’a pas pu être récupérée. Réessayez ou saisissez-la ci-dessous."); }
    finally { if (generation.current === current) setBusy(false); }
  }

  if (!key) return <p className="text-xs text-muted-foreground">Les suggestions Postes Canada ne sont pas encore activées. Saisissez l’adresse et les logements ci-dessous.</p>;
  return <div className="space-y-2">
    <label htmlFor="postal-search" className="text-sm font-bold">Rechercher avec Postes Canada</label>
    <Input id="postal-search" value={search} onChange={e => { setContainer(""); setSearch(e.target.value); }} placeholder="Commencez à écrire l’adresse…" autoComplete="off" />
    {container && <button type="button" className="text-xs underline" onClick={() => { setContainer(""); setSearch(""); }}>Recommencer la recherche</button>}
    {busy && <p role="status" className="text-xs">Recherche…</p>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    {suggestions.length > 0 && <ul aria-label="Suggestions Postes Canada" className="max-h-48 overflow-auto rounded-xl border">{suggestions.map(item => <li key={item.Id}><button type="button" disabled={busy} onClick={() => void choose(item)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted">{item.Text} <span className="text-muted-foreground">{item.Description}</span></button></li>)}</ul>}
    <p className="text-xs text-muted-foreground">Chaque adresse choisie ajoute son logement à la liste. Vérifiez la liste complète avant d’enregistrer.</p>
  </div>;
}
