import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ACCOUNT_COOKIE, PAID_COOKIE, createAccountId } from "@/lib/paywall";

export const dynamic = "force-dynamic";

function setAccessCookies(response: NextResponse, accountId: string) {
  response.cookies.set(PAID_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90
  });

  response.cookies.set(ACCOUNT_COOKIE, accountId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90
  });
}

async function verifyStripeSession(sessionId: string) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    throw new Error("STRIPE_SECRET_KEY is required for checkout verification");
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2026-04-22.dahlia"
  });

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const paid =
    (session.payment_status === "paid" || session.payment_status === "no_payment_required") &&
    session.status === "complete";

  if (!paid) {
    throw new Error("Checkout session is not paid/completed yet");
  }

  const seed =
    session.customer_email ||
    (typeof session.customer === "string" ? session.customer : null) ||
    `stripe_session_${session.id}`;

  return createAccountId(seed);
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const demo = request.nextUrl.searchParams.get("demo");

  if (!sessionId) {
    if (process.env.NODE_ENV !== "production" && demo === "1") {
      const response = NextResponse.redirect(new URL("/dashboard?unlocked=demo", request.url));
      setAccessCookies(response, createAccountId(`demo_${Date.now().toString()}`));
      return response;
    }

    return NextResponse.json(
      {
        error: "Missing session_id. Configure your Stripe Payment Link success URL to include ?session_id={CHECKOUT_SESSION_ID}."
      },
      { status: 400 }
    );
  }

  try {
    const accountId = await verifyStripeSession(sessionId);
    const response = NextResponse.redirect(new URL("/dashboard?unlocked=1", request.url));
    setAccessCookies(response, accountId);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { sessionId?: string };
  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  try {
    const accountId = await verifyStripeSession(body.sessionId);
    const response = NextResponse.json({ ok: true });
    setAccessCookies(response, accountId);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
