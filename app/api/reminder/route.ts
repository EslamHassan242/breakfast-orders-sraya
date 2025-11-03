// app/api/reminder/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Defer env validation and client initialization to the request handler to avoid
// throwing during build-time evaluation.

interface EmailUser {
  email: string;
  name?: string | null;
  reminders_enabled?: boolean | null;
}

export async function GET() {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing required env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY)",
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const resend = new Resend(RESEND_API_KEY);

    // Fetch users who can receive reminders (email required). If the
    // `reminders_enabled` column exists, respect it; otherwise treat as enabled.
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("email, name, reminders_enabled")
      .returns<EmailUser[]>();

    if (usersError) throw usersError;

    const allUsers: EmailUser[] = (users ?? []).filter(
      (u) => !!u?.email
    );

    if (!allUsers.length) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        message: "No users found",
      });
    }

    // Determine who already ordered today using orders.customer (name).
    // This is a best-effort match by name.
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const { data: todaysOrders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("customer, created_at")
      .gte("created_at", start.toISOString());

    if (ordersError) throw ordersError;

    const orderedTodayNames = new Set(
      (todaysOrders ?? [])
        .map((o: any) => (o?.customer ?? "").toString().trim().toLowerCase())
        .filter((s: string) => s.length > 0)
    );

    // Filter users: enabled (or missing flag) AND not matched by name in today's orders
    const eligible = allUsers.filter((u) => {
      const enabled = u.reminders_enabled !== false; // default true if null/undefined
      const nameKey = (u.name ?? "").toString().trim().toLowerCase();
      const alreadyOrdered = nameKey && orderedTodayNames.has(nameKey);
      return enabled && !alreadyOrdered;
    });

    if (!eligible.length) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        message: "No eligible recipients (everyone already ordered or opted out)",
      });
    }

    // Deduplicate by email
    const uniqueByEmail = new Map<string, EmailUser>();
    for (const u of eligible) {
      uniqueByEmail.set(u.email, u);
    }

    const recipients = Array.from(uniqueByEmail.values());
    const to = recipients.map((r) => r.email);

    const htmlBody = recipients
      .map(
        (r) => `
        <p>Hi ${r.name ?? ""},</p>
        <p>🍳 Reminder: Please add your breakfast order before <strong>10:00 AM</strong> today.</p>
        <p><small>If you already ordered, you can ignore this message.</small></p>
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
