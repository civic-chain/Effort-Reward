import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  EMPTY_INQUIRY,
  US_STATES,
  buildStats,
  countrySlug,
  tallyKeys,
  validateInquiry,
  type InquiryInput,
} from "./inquiry";

const valid: InquiryInput = {
  name: "Ada Lovelace",
  email: "ada@town.gov",
  organization: "",
  country: "United States",
  state: "TX",
  attendedCouncil: "yes",
  source: "linkedin",
};

describe("option lists", () => {
  it("has all 50 states", () => expect(US_STATES).toHaveLength(50));
  it("puts the United States first in the country list", () => expect(COUNTRIES[0]).toBe("United States"));
  it("lists the rest alphabetically", () => {
    // Compare ignoring accents (Côte d'Ivoire, São Tomé…).
    const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "");
    const rest = COUNTRIES.slice(1).map(plain);
    expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b)));
  });
  it("has unique country slugs", () => {
    const slugs = COUNTRIES.map(countrySlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("validateInquiry", () => {
  it("accepts a complete US inquiry", () => expect(validateInquiry(valid)).toEqual({}));
  it("rejects the empty form", () => {
    const e = validateInquiry(EMPTY_INQUIRY);
    expect(Object.keys(e).sort()).toEqual(["attendedCouncil", "email", "name", "source", "state"]);
  });
  it("requires a state only for the United States", () => {
    expect(validateInquiry({ ...valid, state: "" }).state).toBeDefined();
    expect(validateInquiry({ ...valid, country: "Canada", state: "" })).toEqual({});
  });
  it("rejects a malformed email", () => {
    expect(validateInquiry({ ...valid, email: "not-an-email" }).email).toBeDefined();
  });
});

describe("tallyKeys", () => {
  it("counts submission, country, state, council and source for a US inquiry", () => {
    expect(tallyKeys(valid)).toEqual([
      "submissions",
      "country_united_states",
      "state_TX",
      "council_yes",
      "source_linkedin",
    ]);
  });
  it("skips state for non-US inquiries", () => {
    const keys = tallyKeys({ ...valid, country: "Canada", state: "", attendedCouncil: "no", source: "podcast" });
    expect(keys).toEqual(["submissions", "country_canada", "council_no", "source_podcast"]);
  });
});

describe("buildStats", () => {
  it("turns counters into sorted display rows and drops zeros", () => {
    const s = buildStats({
      submissions: 5,
      country_united_states: 4,
      country_canada: 1,
      state_TX: 3,
      state_OH: 1,
      council_yes: 2,
      council_no: 3,
      source_youtube: 4,
      source_facebook: 1,
    });
    expect(s.total).toBe(5);
    expect(s.countries.map((r) => r.label)).toEqual(["United States", "Canada"]);
    expect(s.states).toEqual([
      { label: "Texas", count: 3 },
      { label: "Ohio", count: 1 },
    ]);
    expect(s.council).toEqual({ yes: 2, no: 3 });
    expect(s.sources[0]).toEqual({ label: "YouTube", count: 4 });
  });
  it("is all zeros for an empty tally", () => {
    const s = buildStats({});
    expect(s.total).toBe(0);
    expect(s.countries).toEqual([]);
    expect(s.council).toEqual({ yes: 0, no: 0 });
  });
});
