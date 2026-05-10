export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number, token: string) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: token === "SOL" ? 2 : 0,
    maximumFractionDigits: token === "SOL" ? 2 : 2,
  }).format(amount);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function slugId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
