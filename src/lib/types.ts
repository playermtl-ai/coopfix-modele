export type Role = "client" | "admin";
export type TicketStatus = "nouveau" | "en_cours" | "termine";
export type TicketPriority = "normal" | "prioritaire" | "urgent";
export type TicketCategory =
  | "plomberie"
  | "electricite"
  | "chauffage"
  | "menuiserie"
  | "exterieur"
  | "autre";

export interface Address {
  id: string;
  name: string;
  unit_count?: number | null;
  allowed_units: string[];
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  role: Role;
  address_id: string | null;
  unit: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  created_by: string;
  address_id: string | null;
  unit: string | null;
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
}

export interface TicketWithMeta extends Ticket {
  reporter?: { full_name: string; phone?: string | null } | null;
  completer?: { full_name: string } | null;
  address?: { name: string } | null;
  comments?: { count: number }[] | null;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  is_info_request?: boolean;
  created_at: string;
}

export interface CommentWithAuthor extends TicketComment {
  author?: { full_name: string; role: Role } | null;
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  termine: "Complété",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  urgent: "Urgent",
  prioritaire: "Prioritaire",
  normal: "Normal",
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  client: "Membre",
};
