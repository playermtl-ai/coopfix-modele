import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "d MMMM yyyy", { locale: fr });
}

export function formatDateTime(date: string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "d MMMM yyyy 'à' HH:mm", { locale: fr });
}

export function timeAgo(date: string | null | undefined) {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { locale: fr, addSuffix: true });
}
