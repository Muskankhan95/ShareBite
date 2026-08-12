export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTimeRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  return `${new Date(startIso).toLocaleTimeString("en-IN", opts)} – ${new Date(
    endIso,
  ).toLocaleTimeString("en-IN", opts)}`;
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
