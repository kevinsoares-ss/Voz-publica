export function parseOfficialAmount(value: string | null | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    const amount = Number(trimmed);
    return Number.isFinite(amount) ? amount : null;
  }

  if (
    /^-?\d{1,3}(?:\.\d{3})*(?:,\d+)?$/.test(trimmed) ||
    /^-?\d+,\d+$/.test(trimmed)
  ) {
    const amount = Number(trimmed.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(amount) ? amount : null;
  }

  return null;
}

export function formatAmount(value: number): string {
  return value.toFixed(2);
}
