import { useEffect, useState } from "react";
import { SectionCard } from "./ui";
import { buildStats, type Row, type Stats } from "../lib/inquiry";
import { loadTallies, type StoreMode } from "../lib/store";

const nf = new Intl.NumberFormat("en-US");

function Bars({ rows, total }: { rows: Row[]; total: number }) {
  if (rows.length === 0) return <p className="type-body-sm text-muted">No data yet.</p>;
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <ul className="grid gap-2">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 type-body-sm">
            <span>{r.label}</span>
            <span className="font-bold tabular-nums">
              {nf.format(r.count)}
              {total > 0 && (
                <span className="ml-1.5 font-normal text-muted">{Math.round((r.count / total) * 100)}%</span>
              )}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-surface-muted">
            <div
              className="h-2 rounded-full bg-gold-600"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function StatsView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [mode, setMode] = useState<StoreMode>("local");
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    loadTallies()
      .then(({ tallies, mode }) => {
        if (!live) return;
        setStats(buildStats(tallies));
        setMode(mode);
      })
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, []);

  if (error) return <p className="type-body text-rose-700">Couldn't load the numbers: {error}</p>;
  if (!stats) return <p className="type-body text-muted">Loading…</p>;

  const council = stats.council.yes + stats.council.no;
  const councilRows: Row[] = [
    { label: "Yes, attended", count: stats.council.yes },
    { label: "No, never attended", count: stats.council.no },
  ];
  const usTotal = stats.states.reduce((sum, r) => sum + r.count, 0);

  if (stats.total === 0) {
    return (
      <div className="card-raised p-6">
        <p className="type-card-title">No inquiries yet.</p>
        <p className="mt-1 type-body-sm text-muted">
          The numbers appear here as soon as the first person clicks submit.
        </p>
        <a href="#/" className="btn-primary mt-4">
          Open the inquiry form
        </a>
        {mode === "local" && (
          <p className="mt-3 type-body-xs text-muted">
            Demo mode: Firebase isn't configured, so only submissions made in this browser are counted.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="card-raised p-6">
        <p className="type-caption text-gold-600">People who clicked submit</p>
        <p className="type-metric-lg mt-2">{nf.format(stats.total)}</p>
        {mode === "local" && (
          <p className="mt-3 type-body-xs text-muted">
            Demo mode: Firebase isn't configured, so these numbers only count submissions made in this
            browser.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard eyebrow="Where from" title="Country">
          <Bars rows={stats.countries} total={stats.total} />
        </SectionCard>
        <SectionCard eyebrow="United States" title="State">
          <Bars rows={stats.states} total={usTotal} />
        </SectionCard>
        <SectionCard eyebrow="Civic engagement" title="Attended a town council meeting?">
          <Bars rows={councilRows} total={council} />
        </SectionCard>
        <SectionCard eyebrow="Reach" title="How they learned about CC">
          <Bars rows={stats.sources} total={stats.total} />
        </SectionCard>
      </div>
    </div>
  );
}
