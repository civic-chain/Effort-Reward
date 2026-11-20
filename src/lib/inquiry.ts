/**
 * Onboard inquiry — form data, option lists, validation, and the tally keys
 * each submission increments. Pure functions only (no storage), so it's easy to
 * test. Storage lives in `store.ts`.
 */

export const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
  ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"],
].map(([code, name]) => ({ code, name }));

export const US_COUNTRY = "United States";

const OTHER_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina",
  "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina",
  "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia",
  "Comoros", "Congo (Democratic Republic)", "Congo (Republic)", "Costa Rica", "Côte d'Ivoire",
  "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini",
  "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
  "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
  "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay",
  "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa",
  "San Marino", "São Tomé and Príncipe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname",
  "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand",
  "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Türkiye", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "Uruguay",
  "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

/** United States first, then every other country alphabetically. */
export const COUNTRIES: readonly string[] = [US_COUNTRY, ...OTHER_COUNTRIES];

export const SOURCES = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "youtube", label: "YouTube" },
  { id: "podcast", label: "Podcast" },
  { id: "word_of_mouth", label: "Word of Mouth" },
  { id: "facebook", label: "Facebook" },
] as const;

export type SourceId = (typeof SOURCES)[number]["id"];
export type YesNo = "yes" | "no";

export interface InquiryInput {
  name: string;
  email: string;
  organization: string;
  country: string;
  /** Two-letter US state code; only used when country is the United States. */
  state: string;
  attendedCouncil: YesNo | "";
  source: SourceId | "";
}

export const EMPTY_INQUIRY: InquiryInput = {
  name: "",
  email: "",
  organization: "",
  country: US_COUNTRY,
  state: "",
  attendedCouncil: "",
  source: "",
};

export type InquiryErrors = Partial<Record<keyof InquiryInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInquiry(i: InquiryInput): InquiryErrors {
  const e: InquiryErrors = {};
  if (!i.name.trim()) e.name = "Please enter your name.";
  if (!EMAIL_RE.test(i.email.trim())) e.email = "Please enter a valid email address.";
  if (!COUNTRIES.includes(i.country)) e.country = "Please choose your country.";
  if (i.country === US_COUNTRY && !US_STATES.some((s) => s.code === i.state)) {
    e.state = "Please choose your state.";
  }
  if (i.attendedCouncil !== "yes" && i.attendedCouncil !== "no") {
    e.attendedCouncil = "Please choose yes or no.";
  }
  if (!SOURCES.some((s) => s.id === i.source)) e.source = "Please choose one.";
  return e;
}

/** Firestore-safe field-name fragment for a country name. */
export const countrySlug = (country: string) =>
  country
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

export const KEY_SUBMISSIONS = "submissions";
export const keyCountry = (country: string) => `country_${countrySlug(country)}`;
export const keyState = (code: string) => `state_${code}`;
export const keyCouncil = (v: YesNo) => `council_${v}`;
export const keySource = (id: SourceId) => `source_${id}`;

/**
 * The counters one valid submission increments, each by 1. State is tallied
 * only for US submissions. Assumes the input already passed validation.
 */
export function tallyKeys(i: InquiryInput): string[] {
  const keys = [KEY_SUBMISSIONS, keyCountry(i.country)];
  if (i.country === US_COUNTRY) keys.push(keyState(i.state));
  if (i.attendedCouncil) keys.push(keyCouncil(i.attendedCouncil));
  if (i.source) keys.push(keySource(i.source));
  return keys;
}

export type Tallies = Record<string, number>;

export interface Row {
  label: string;
  count: number;
}

export interface Stats {
  total: number;
  countries: Row[];
  states: Row[];
  council: { yes: number; no: number };
  sources: Row[];
}

const byCountDesc = (a: Row, b: Row) => b.count - a.count || a.label.localeCompare(b.label);

/** Turn the flat counter map into display-ready, sorted rows (zeros dropped). */
export function buildStats(t: Tallies): Stats {
  const n = (k: string) => t[k] ?? 0;
  return {
    total: n(KEY_SUBMISSIONS),
    countries: COUNTRIES.map((c) => ({ label: c, count: n(keyCountry(c)) }))
      .filter((r) => r.count > 0)
      .sort(byCountDesc),
    states: US_STATES.map((s) => ({ label: s.name, count: n(keyState(s.code)) }))
      .filter((r) => r.count > 0)
      .sort(byCountDesc),
    council: { yes: n(keyCouncil("yes")), no: n(keyCouncil("no")) },
    sources: SOURCES.map((s) => ({ label: s.label, count: n(keySource(s.id)) })).sort(byCountDesc),
  };
}
