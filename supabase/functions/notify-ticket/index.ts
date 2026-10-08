import { createNotificationHandler } from "./handler.ts";
Deno.serve(createNotificationHandler({
  SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? "",
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  NOTIFICATION_WEBHOOK_SECRET: Deno.env.get("NOTIFICATION_WEBHOOK_SECRET") ?? "",
  RESEND_API_KEY: Deno.env.get("RESEND_API_KEY") ?? "",
  MAIL_FROM: Deno.env.get("MAIL_FROM") ?? "",
}));
