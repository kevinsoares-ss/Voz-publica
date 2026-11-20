import type { Representative } from "../services/api";

export function parseCurrencyToNumber(
  value: string | number | null | undefined,
): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Clean formatted Brazilian string "1.234.567,89" or plain decimal "1234567.89"
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : null;
  }

  if (
    /^-?\d{1,3}(?:\.\d{3})*(?:,\d+)?$/.test(trimmed) ||
    /^-?\d+,\d+$/.test(trimmed)
  ) {
    const num = Number(trimmed.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(num) ? num : null;
  }

  return null;
}

export function formatCurrencyBRL(
  value: string | number | null | undefined,
): string {
  const num = parseCurrencyToNumber(value);
  if (num == null) return "R$ 0,00";

  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCompactBRL(
  value: string | number | null | undefined,
): string {
  const num = parseCurrencyToNumber(value);
  if (num == null) return "R$ 0";

  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    const formatted = (abs / 1_000_000_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    return `${sign}R$ ${formatted} Bi`;
  }

  if (abs >= 1_000_000) {
    const formatted = (abs / 1_000_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    return `${sign}R$ ${formatted} Mi`;
  }

  if (abs >= 10_000) {
    const formatted = (abs / 1_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    return `${sign}R$ ${formatted} mil`;
  }

  return formatCurrencyBRL(num);
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "Não informado";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function roleLabel(role: Representative["role"]): string {
  const labels: Record<Representative["role"], string> = {
    PRESIDENT: "Presidente",
    GOVERNOR: "Governador(a)",
    MAYOR: "Prefeito(a)",
    SENATOR: "Senador(a)",
    FEDERAL_DEPUTY: "Deputado(a) federal",
    STATE_DEPUTY: "Deputado(a) estadual",
    CITY_COUNCILLOR: "Vereador(a)",
  };
  return labels[role] ?? role;
}
