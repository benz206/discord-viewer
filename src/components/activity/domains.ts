export const DOMAIN_ORDER = ["Reporting", "Modeling", "Tns"] as const;

export const DOMAIN_COLORS: Record<string, string> = {
  Reporting: "#5865f2",
  Modeling: "#3ba55c",
  Tns: "#eb459e",
};

export const DOMAIN_NOTES: Record<string, string> = {
  Reporting: "Client telemetry — app opens, sessions, views. Spans 2017 → 2022.",
  Modeling: "Derived modelling stream. Starts March 2022.",
  Tns: "Server-side API events. Starts April 2022.",
};

export function domainColor(domain: string): string {
  return DOMAIN_COLORS[domain] ?? "#949ba4";
}

export function sortDomains<T extends { domain: string }>(rows: T[]): T[] {
  const order = DOMAIN_ORDER as readonly string[];
  return [...rows].sort((a, b) => {
    const ai = order.indexOf(a.domain);
    const bi = order.indexOf(b.domain);
    return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
  });
}
