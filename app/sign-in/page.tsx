import { getEnv } from "@/lib/env";
import { headers } from "next/headers";
import { getMessages, resolveLocale } from "@/lib/i18n/messages";

export default async function SignInPage() {
  const env = getEnv();
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get("x-mythra-locale") ?? requestHeaders.get("accept-language"));
  const messages = getMessages(locale);
  return (
    <main className="sign-in-shell">
      <section className="sign-in-card">
        <p className="eyebrow">{messages.productName}</p>
        <h1>{messages.signInTitle}</h1>
        <p>{messages.signInDescription}</p>
        {env.AUTH_MODE === "development" ? (
          <form method="post" action="/api/v2/auth/development">
            <input type="hidden" name="credential" value={env.DEV_AUTH_SUBJECT ?? "local-author"} />
            <button className="primary-action" type="submit">{messages.signIn}</button>
          </form>
        ) : <p>{messages.oidcRequired}</p>}
      </section>
    </main>
  );
}
