import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function useUnreadComments() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["unread-comments", profile?.id],
    enabled: !!profile,
    staleTime: 5000,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("coopfix_unread_comment_tickets");
      if (error) throw error;
      return new Set<string>(data ?? []);
    },
  });
}
