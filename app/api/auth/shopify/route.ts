import { NextRequest, NextResponse } from "next/server";
import { upsertStore } from "@/lib/database";
import {
  buildInstallUrl,
  createNonce,
  exchangeCodeForAccessToken,
  normalizeShopDomain,
  verifyHmac
} from "@/lib/shopify";
import { ACCOUNT_COOKIE, createAccountId } from "@/lib/paywall";

const OAUTH_STATE_COOKIE = "shopify_oauth_state";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shopRaw = url.searchParams.get("shop");
    if (!shopRaw) {
      return NextResponse.json({ error: "Missing shop query parameter" }, { status: 400 });
    }

    const shop = normalizeShopDomain(shopRaw);
    const code = url.searchParams.get("code");

    if (!code) {
      const state = createNonce();
      const redirect = NextResponse.redirect(buildInstallUrl(shop, state));
      redirect.cookies.set(OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 10 * 60
      });
      return redirect;
    }

    const hmacValid = verifyHmac(url.searchParams);
    if (!hmacValid) {
      return NextResponse.json({ error: "Invalid Shopify HMAC" }, { status: 401 });
    }

    const cookieState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
    const callbackState = url.searchParams.get("state");

    if (!cookieState || !callbackState || cookieState !== callbackState) {
      return NextResponse.json({ error: "OAuth state mismatch" }, { status: 403 });
    }

    const token = await exchangeCodeForAccessToken({ shop, code });

    let accountId = request.cookies.get(ACCOUNT_COOKIE)?.value;
    if (!accountId) {
      const seed = `${shop}:${Date.now().toString()}`;
      accountId = createAccountId(seed);
    }

    await upsertStore({
      accountId,
      shopDomain: shop,
      accessToken: token.access_token
    });

    const redirect = NextResponse.redirect(new URL("/stores?connected=1", request.url));
    redirect.cookies.set(OAUTH_STATE_COOKIE, "", {
      maxAge: 0,
      path: "/"
    });
    redirect.cookies.set(ACCOUNT_COOKIE, accountId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90
    });

    return redirect;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Shopify auth failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
