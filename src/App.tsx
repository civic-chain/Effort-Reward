import { useEffect, useState } from "react";
import InquiryForm from "./components/InquiryForm";
import StatsView from "./components/StatsView";

/**
 * Light passphrase gate for the stats page. This only hides the page from
 * casual visitors; anyone who reads the shipped JavaScript can find it. The
 * counts are aggregates with no personal data, but for real protection put the
 * stats behind authentication.
 */
const STATS_PASSPHRASE = import.meta.env.VITE_STATS_PASSPHRASE ?? "civicchain";

type Route = "form" | "stats";
const routeFromHash = (): Route => (window.location.hash === "#/stats" ? "stats" : "form");

function Logo() {
  return (
    <a href="#/" aria-label="Civic-Chain home">
      <img
        src={`${import.meta.env.BASE_URL}brand/civic-logo-w-text-horizontal.svg`}
        alt="Civic-Chain"
        className="h-7 w-auto"
        width={175}
        height={28}
      />
    </a>
  );
}

function StatsGate({ onUnlock }: { onUnlock: () => void }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const submit = () => (pass === STATS_PASSPHRASE ? onUnlock() : setError(true));
  return (
    <div className="card-raised mx-auto w-full max-w-sm p-6">
      <p className="type-caption text-gold-600">Internal access</p>
      <h2 className="type-h4 mt-1 mb-4">Inquiry statistics</h2>
      <input
        autoFocus
        type="password"
        className="control"
        placeholder="Passphrase"
        aria-label="Passphrase"
        value={pass}
        onChange={(e) => {
          setPass(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      {error && <p className="mt-2 type-body-sm text-rose-700">Incorrect passphrase.</p>}
      <button className="btn-primary mt-4 w-full" onClick={submit}>
        View statistics
      </button>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route>(routeFromHash);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-page/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1" aria-label="Pages">
            {(
              [
                ["form", "#/", "Inquiry"],
                ["stats", "#/stats", "Statistics"],
              ] as const
            ).map(([id, href, label]) => (
              <a
                key={id}
                href={href}
                aria-current={route === id ? "page" : undefined}
                className={`rounded-full px-4 py-1.5 type-body-sm font-medium transition-colors ${
                  route === id ? "bg-blue-800 text-cream-50" : "text-muted hover:text-foreground"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {route === "form" ? (
          <>
            <p className="type-caption text-gold-600">Onboard inquiry</p>
            <h1 className="type-h2 mt-2 max-w-3xl">Let's get your town started.</h1>
            <p className="type-body-lg mt-4 mb-8 max-w-2xl text-muted">
              Tell us a little about yourself and how you found Civic-Chain. It takes about a minute.
            </p>
            <InquiryForm />
          </>
        ) : (
          <>
            <p className="type-caption text-gold-600">Inquiry statistics</p>
            <h1 className="type-h3 mt-2 mb-8">Who's interested</h1>
            {unlocked ? <StatsView /> : <StatsGate onUnlock={() => setUnlocked(true)} />}
          </>
        )}
      </main>

      <footer className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="border-t pt-6 type-body-xs text-muted">
          <p>© {new Date().getFullYear()} Civic-Chain. We use your answers only to follow up and to count interest.</p>
        </div>
      </footer>
    </div>
  );
}
