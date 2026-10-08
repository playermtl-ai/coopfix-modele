export type MailEnvironment = {
  SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string;
  NOTIFICATION_WEBHOOK_SECRET: string; RESEND_API_KEY: string; MAIL_FROM: string;
};
export function createNotificationHandler(env: MailEnvironment, request: typeof fetch = fetch) {
  const reply = (status: number, message: string) => Response.json({ message }, { status });
  return async (req: Request): Promise<Response> => {
    if (req.method !== "POST") return reply(405, "POST requis");
    if (!env.NOTIFICATION_WEBHOOK_SECRET || req.headers.get("x-coopfix-secret") !== env.NOTIFICATION_WEBHOOK_SECRET) return reply(401, "Non autorisé");
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, "Base de données non configurée");
    try {
      const payload = await req.json();
      const id = payload?.record?.id;
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (payload.schema !== "public" || typeof id !== "string" || !uuid.test(id)) return reply(400, "Événement invalide");
      const isNew = payload.table === "tickets" && payload.type === "INSERT";
      const isCompleted = payload.table === "tickets" && payload.type === "UPDATE";
      const isInfo = payload.table === "ticket_comments" && payload.type === "INSERT";
      if (!isNew && !isCompleted && !isInfo) return reply(400, "Événement invalide");
      if (isCompleted && (payload.record.status !== "termine" || payload.old_record?.status === "termine")) return reply(200, "Aucune nouvelle clôture");
      if (isInfo && payload.record.is_info_request !== true) return reply(200, "Commentaire sans demande de précisions");
      const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
      const read = async (path: string) => {
        const result = await request(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers });
        if (!result.ok) throw new Error("database");
        return result.json();
      };
      const [settings] = await read("coop_notification_settings?id=eq.1&select=notification_email,notifications_enabled,app_url");
      if (!settings) return reply(503, "Paramètres manquants");
      if (isNew && !settings.notifications_enabled) return reply(200, "Notifications coordination désactivées");
      if (!settings.app_url || !env.RESEND_API_KEY || !env.MAIL_FROM) return reply(503, "Service d'envoi incomplet");
      let ticketId = id;
      let infoBody = "";
      if (isInfo) {
        const [comment] = await read(`ticket_comments?id=eq.${id}&select=ticket_id,body,is_info_request`);
        if (!comment || !comment.is_info_request) return reply(404, "Demande introuvable");
        ticketId = comment.ticket_id;
        infoBody = comment.body;
      }
      // Read persisted content and recipients; never trust them from the webhook body.
      const [ticket] = await read(`tickets?id=eq.${ticketId}&select=id,title,description,unit,created_by,status,completed_at,address:addresses(name)`);
      if (!ticket) return reply(404, "Billet introuvable");
      if (isCompleted && (ticket.status !== "termine" || !ticket.completed_at || ticket.completed_at !== payload.record.completed_at)) return reply(200, "Clôture dépassée ou incomplète");
      const [coop] = await read("settings?id=eq.1&select=coop_name");
      const name = coop?.coop_name?.trim() || "Votre coopérative";
      let recipient = settings.notification_email;
      let subject = `[${name}] Nouveau billet de réparation`;
      let content = `${ticket.title}\n\n${ticket.description}\n\nAdresse : ${ticket.address?.name || "Non précisée"}\nLogement : ${ticket.unit || "Non précisé"}`;
      let key = `coopfix-ticket-${id}`;
      if (!isNew) {
        // Auth is authoritative for the member's current email (including email changes).
        const userResponse = await request(`${env.SUPABASE_URL}/auth/v1/admin/users/${ticket.created_by}`, { headers });
        if (!userResponse.ok) throw new Error("member");
        const member = await userResponse.json();
        recipient = member.email;
        if (isInfo) {
          subject = `[${name}] Précisions demandées pour votre billet`;
          content = `La coordination vous demande des renseignements supplémentaires.\n\nBillet : ${ticket.title}\n\n${infoBody}\n\nRépondez dans les commentaires du billet.`;
          key = `coopfix-info-${id}`;
        } else {
          subject = `[${name}] Votre billet est complété`;
          content = `La coordination a marqué votre billet comme complété.\n\nBillet : ${ticket.title}\n\nVous pouvez consulter le suivi dans l'application.`;
          key = `coopfix-completed-${id}-${ticket.completed_at}`;
        }
      }
      if (!recipient) return reply(503, "Courriel destinataire manquant");
      const result = await request("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify({ from: env.MAIL_FROM, to: [recipient], subject,
          text: `${content}\n\nConsulter le billet (connexion requise) : ${settings.app_url}/billets/${ticketId}` }),
      });
      if (!result.ok) { console.error("Envoi refusé", result.status); return reply(502, "Échec de l'envoi; consultez le service de courriel"); }
      return reply(200, "Courriel accepté par le service d'envoi");
    } catch { return reply(500, "Impossible de traiter la notification"); }
  };
}
