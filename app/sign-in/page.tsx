import { getEnv } from "@/lib/env";

export default function SignInPage() {
  const env = getEnv();
  return (
    <main className="sign-in-shell">
      <section className="sign-in-card">
        <p className="eyebrow">Mythra</p>
        <h1>Enter your writing workspace</h1>
        <p>Use the configured identity provider to continue.</p>
        {env.AUTH_MODE === "development" ? (
          <form method="post" action="/api/v2/auth/development">
            <input type="hidden" name="credential" value={env.DEV_AUTH_SUBJECT ?? "local-author"} />
            <button className="primary-action" type="submit">Continue to Mythra</button>
          </form>
        ) : <p>OIDC sign-in must be initiated by the configured deployment identity gateway.</p>}
      </section>
    </main>
  );
}
