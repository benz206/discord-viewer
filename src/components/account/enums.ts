export const USER_FLAGS: Record<number, string> = {
  0: "Discord Staff",
  1: "Partnered Server Owner",
  2: "HypeSquad Events",
  3: "Bug Hunter Level 1",
  4: "MFA SMS",
  5: "Premium Promo Dismissed",
  6: "HypeSquad Bravery",
  7: "HypeSquad Brilliance",
  8: "HypeSquad Balance",
  9: "Early Supporter",
  10: "Team Pseudo User",
  11: "Internal Application",
  12: "System",
  13: "Has Unread Urgent Messages",
  14: "Bug Hunter Level 2",
  15: "Underage Deleted",
  16: "Verified Bot",
  17: "Early Verified Bot Developer",
  18: "Moderator Programs Alumni",
  19: "Bot HTTP Interactions",
  20: "Spammer",
  21: "Disable Premium",
  22: "Active Developer",
  23: "Provisional Account",
  33: "High Global Rate Limit",
  34: "Deleted",
  35: "Disabled Suspicious Activity",
  36: "Self Deleted",
  37: "Premium Discriminator",
  38: "Used Desktop Client",
  39: "Used Web Client",
  40: "Used Mobile Client",
  41: "Disabled",
  43: "Has Session Started",
  44: "Quarantined",
  50: "Collaborator",
  51: "Restricted Collaborator",
};

export const PAYMENT_STATUS: Record<number, string> = {
  0: "Pending",
  1: "Completed",
  2: "Failed",
  3: "Reversed",
  4: "Refunded",
  5: "Canceled",
};

export const PAYMENT_SOURCE_TYPES: Record<number, string> = {
  0: "Unknown",
  1: "Card",
  2: "PayPal",
  3: "Giropay",
  4: "Sofort",
  5: "Przelewy24",
  6: "SEPA Debit",
  7: "Paysafe Card",
  8: "GCash",
  9: "Grabpay (MY)",
  10: "Momo Wallet",
  11: "VenMo",
  12: "GoPay Wallet",
  13: "KakaoPay",
  14: "Bancontact",
  15: "eps",
  16: "iDEAL",
  17: "Cash App",
};

export const PAYMENT_GATEWAYS: Record<number, string> = {
  1: "Stripe",
  2: "Braintree",
  3: "Apple",
  4: "Google",
  5: "Adyen",
  6: "Apple Partner",
};

export const SUBSCRIPTION_TYPES: Record<number, string> = {
  1: "Premium",
  2: "Guild",
  3: "Application",
};

export const ENTITLEMENT_TYPES: Record<number, string> = {
  1: "Purchase",
  2: "Premium Subscription",
  3: "Developer Gift",
  4: "Test Mode Purchase",
  5: "Free Purchase",
  6: "User Gift",
  7: "Premium Purchase",
  8: "Application Subscription",
};

export const MESSAGE_NOTIFICATION_LEVELS: Record<number, string> = {
  0: "All messages",
  1: "Only @mentions",
  2: "Nothing",
  3: "Inherit from parent",
};

export const NOTIFY_HIGHLIGHTS: Record<number, string> = {
  0: "Default",
  1: "Enabled",
  2: "Disabled",
};

export const CONNECTION_VISIBILITY: Record<number, string> = {
  0: "Only me",
  1: "Everyone",
};

export const CONNECTION_COLORS: Record<string, string> = {
  github: "#4078c0",
  reddit: "#ff4500",
  spotify: "#1db954",
  steam: "#66c0f4",
  twitter: "#1da1f2",
  twitch: "#9146ff",
  youtube: "#ff0000",
  battlenet: "#148eff",
  xbox: "#107c10",
  playstation: "#003791",
  epicgames: "#2a2a2a",
  facebook: "#1877f2",
  instagram: "#e1306c",
  skype: "#00aff0",
  crunchyroll: "#f47521",
  ebay: "#e53238",
  paypal: "#00457c",
  riotgames: "#d13639",
  tiktok: "#25f4ee",
  domain: "#949ba4",
};

export interface DecodedFlag {
  bit: number;
  label: string;
  known: boolean;
}

export function decodeFlags(value: number, names: Record<number, string>): DecodedFlag[] {
  const flags: DecodedFlag[] = [];
  for (let bit = 0; bit < 53; bit++) {
    if (Math.floor(value / 2 ** bit) % 2 !== 1) continue;
    const label = names[bit];
    flags.push({ bit, label: label ?? `Unknown bit ${bit}`, known: Boolean(label) });
  }
  return flags;
}

export interface NamedFlag {
  key: string;
  label: string;
  known: boolean;
  title: string;
}

const FLAG_WORDS: Record<string, string> = {
  HYPESQUAD: "HypeSquad",
  MFA: "MFA",
  SMS: "SMS",
  HTTP: "HTTP",
  NSFW: "NSFW",
  URL: "URL",
};

function titleCaseFlagName(name: string): string {
  return name
    .split("_")
    .map((word) => FLAG_WORDS[word] ?? word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Older packages export user flags as a bitfield; current ones export an array of
 * flag names. Renders either into the same pill list.
 */
export function describeFlags(value: number | string[] | undefined, names: Record<number, string>): NamedFlag[] {
  if (Array.isArray(value)) {
    return value.map((name) => ({ key: name, label: titleCaseFlagName(name), known: true, title: name }));
  }
  if (typeof value !== "number") return [];
  return decodeFlags(value, names).map((flag) => ({
    key: String(flag.bit),
    label: flag.label,
    known: flag.known,
    title: `bit ${flag.bit}`,
  }));
}

export function enumName(map: Record<number, string>, value: unknown): string {
  return typeof value === "number" ? (map[value] ?? `Unknown (${value})`) : String(value);
}
