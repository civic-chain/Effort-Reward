import { useState, type FormEvent } from "react";
import { Field, SectionCard, Select, TextInput } from "./ui";
import {
  COUNTRIES,
  EMPTY_INQUIRY,
  SOURCES,
  US_COUNTRY,
  US_STATES,
  validateInquiry,
  type InquiryErrors,
  type InquiryInput,
} from "../lib/inquiry";
import { recordInquiry, type StoreMode } from "../lib/store";

type Status = "idle" | "sending" | "sent" | "error";

function RadioGroup<T extends string>({
  name,
  value,
  onChange,
  options,
  invalid,
}: {
  name: string;
  value: T | "";
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
  invalid?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-invalid={invalid || undefined}
      className="flex flex-wrap gap-2"
    >
      {options.map((o) => (
        <label
          key={o.value}
          className={`flex cursor-pointer items-center gap-2 rounded-control border px-4 py-2.5 type-body-sm transition-colors ${
            value === o.value
              ? "border-gold-600 bg-gold-50 font-bold"
              : "bg-control-bg hover:bg-surface-muted"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="accent-[var(--blue-800)]"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

const ErrorText = ({ children }: { children?: string }) =>
  children ? (
    <p role="alert" className="mt-1 type-body-xs text-rose-700">
      {children}
    </p>
  ) : null;

export default function InquiryForm() {
  const [form, setForm] = useState<InquiryInput>(EMPTY_INQUIRY);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [mode, setMode] = useState<StoreMode>("local");
  const [sendError, setSendError] = useState("");

  const patch = (p: Partial<InquiryInput>) => {
    setForm((f) => ({ ...f, ...p }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(p) as (keyof InquiryInput)[]) delete next[k];
      return next;
    });
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (status === "sending") return; // one tally per click-through, even on double-click
    const found = validateInquiry(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    setSendError("");
    try {
      setMode(await recordInquiry(form));
      setStatus("sent");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <SectionCard eyebrow="Received" title="Thank you — we'll be in touch.">
        <p className="type-body text-muted">
          Your inquiry has been recorded. Someone from Civic-Chain will reach out at{" "}
          <span className="font-bold text-foreground">{form.email.trim()}</span>.
        </p>
        {mode === "local" && (
          <p className="mt-3 type-body-xs text-muted">
            Demo mode: Firebase isn't configured, so this was counted in this browser only.
          </p>
        )}
        <button
          className="btn-ghost mt-5"
          onClick={() => {
            setForm(EMPTY_INQUIRY);
            setStatus("idle");
          }}
        >
          Submit another inquiry
        </button>
      </SectionCard>
    );
  }

  const isUS = form.country === US_COUNTRY;

  return (
    <form onSubmit={submit} noValidate>
      <SectionCard eyebrow="Onboard inquiry" title="Tell us about you">
        <div className="grid gap-5">
          <Field label="Your name" htmlFor="oi-name">
            <TextInput id="oi-name" value={form.name} onChange={(v) => patch({ name: v })} />
            <ErrorText>{errors.name}</ErrorText>
          </Field>

          <Field label="Email" htmlFor="oi-email">
            <TextInput
              id="oi-email"
              type="email"
              value={form.email}
              onChange={(v) => patch({ email: v })}
              placeholder="you@town.gov"
            />
            <ErrorText>{errors.email}</ErrorText>
          </Field>

          <Field label="Town, organization or agency (optional)" htmlFor="oi-org">
            <TextInput id="oi-org" value={form.organization} onChange={(v) => patch({ organization: v })} />
          </Field>

          <Field label="Country" htmlFor="oi-country">
            <Select
              id="oi-country"
              value={form.country}
              onChange={(v) => patch({ country: v, state: "" })}
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
            />
            <ErrorText>{errors.country}</ErrorText>
          </Field>

          {isUS && (
            <Field label="State" htmlFor="oi-state">
              <Select
                id="oi-state"
                value={form.state}
                onChange={(v) => patch({ state: v })}
                options={[
                  { value: "", label: "Select your state…" },
                  ...US_STATES.map((s) => ({ value: s.code, label: s.name })),
                ]}
              />
              <ErrorText>{errors.state}</ErrorText>
            </Field>
          )}

          <Field label="Have you attended a town council meeting before?">
            <RadioGroup
              name="council"
              value={form.attendedCouncil}
              onChange={(v) => patch({ attendedCouncil: v })}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              invalid={Boolean(errors.attendedCouncil)}
            />
            <ErrorText>{errors.attendedCouncil}</ErrorText>
          </Field>

          <Field label="How did you learn about CC?">
            <RadioGroup
              name="source"
              value={form.source}
              onChange={(v) => patch({ source: v })}
              options={SOURCES.map((s) => ({ value: s.id, label: s.label }))}
              invalid={Boolean(errors.source)}
            />
            <ErrorText>{errors.source}</ErrorText>
          </Field>
        </div>

        {status === "error" && (
          <p role="alert" className="mt-4 type-body-sm text-rose-700">
            Sorry, that didn't go through: {sendError}. Please try again.
          </p>
        )}

        <div className="mt-6">
          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Submit inquiry"}
          </button>
        </div>
      </SectionCard>
    </form>
  );
}
