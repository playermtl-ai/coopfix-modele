import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Address } from "@/lib/types";

export function useCoopName() {
  return useQuery({
    queryKey: ["settings", "name"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("coop_name")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data?.coop_name?.trim() || "Nom de votre coop à inscrire";
    },
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("id,name,allowed_units,created_at")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Address[];
    },
  });
}
