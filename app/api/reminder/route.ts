// app/api/reminder/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
  throw new Error(
    "Missing required env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY)"
  );
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const resend = new Resend(RESEND_API_KEY);

interface EmailUser {
  email: string;
  name?: string | null;
}

export async function GET() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("email, name");

    if (error) throw error;

    // Safely map and filter
    const emails: EmailUser[] = (users ?? [])
      .filter((u): u is { email: string; name: string | null } => !!u?.email)
      .map((u) => ({
        email: u.email,
        name: u.name ?? null,
      }));

    if (!emails.length) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        message: "No users found",
      });
    }

    // Deduplicate by email
    const uniqueByEmail = new Map<string, EmailUser>();
    for (const u of emails) {
      if (u) {
        uniqueByEmail.set(u.email, u);
      }
    }

    const recipients = Array.from(uniqueByEmail.values());
    const to = recipients.map((r) => r.email);

    const htmlBody = recipients
      .map(
        (r) => `
        <p>Hi ${r.name ?? ""},</p>
        <p>🍳 Reminder: Please add your breakfast order before <strong>10:00 AM</strong> today.</p>
        <p><small>If you already ordered, ignore this message.</small></p>
        <hr/>
      `
      )
      .join("");

    const resp = await resend.emails.send({
      from: "Sraya Breakfast <noreply@yourdomain.com>",
      to,
      subject: "🍳 Reminder: Add your breakfast order before 10:00 AM!",
      html: `<p>Good morning! ☀️ Don't forget to add your order for today's breakfast!</p>${htmlBody}`,
    });

    return NextResponse.json({ ok: true, sent: to.length, resp });
  } catch (err: any) {
    console.error("Reminder failed:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
