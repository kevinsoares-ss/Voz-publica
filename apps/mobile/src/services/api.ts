import Constants from "expo-constants";
import { Platform } from "react-native";

export type Representative = {
  id: string;
  sourceNamespace: string;
  externalId: string;
  name: string;
  civilName: string | null;
  role:
    | "PRESIDENT"
    | "GOVERNOR"
    | "MAYOR"
    | "SENATOR"
    | "FEDERAL_DEPUTY"
    | "STATE_DEPUTY"
    | "CITY_COUNCILLOR";
  sphere: "FEDERAL" | "STATE" | "MUNICIPAL";
  powerBranch: "EXECUTIVE" | "LEGISLATIVE";
  party: string | null;
  state: string | null;
  city: string | null;
  photoUrl: string | null;
  sourceUrl: string | null;
  lastSyncedAt: string;
  source: {
    type: string;
    name: string;
    url: string;
    consultedAt: string;
  };
};

export type RepresentativePage = {
  data: Representative[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type OfficialRecord = Record<string, unknown>;

export type OfficialList = {
  data: OfficialRecord[];
  source: {
    name: string;
    url: string;
    consultedAt: string;
  };
  pagination: {
    page: number;
    limit: number;
    nextUrl: string | null;
  };
};

export type OfficialDetail = {
  data: OfficialRecord;
  source: OfficialList["source"];
};

export type CommitmentStatus =
  | "A_VERIFICAR"
  | "EM_ANDAMENTO"
  | "CUMPRIDO"
  | "PARCIALMENTE_CUMPRIDO"
  | "NAO_CUMPRIDO"
  | "SEM_INFORMACAO_SUFICIENTE";

export type CommitmentRecord = {
  id: string;
  title: string;
  description: string;
  registeredAt: string | null;
  deadline: string | null;
  status: CommitmentStatus;
  evaluationMethod: string;
  createdAt: string;
  updatedAt: string;
  source: OfficialList["source"] & { type: string };
  politician: {
    id: string;
    name: string;
    role: Representative["role"];
    state: string | null;
  } | null;
  evidenceCount: number;
  evidences: Array<{
    id: string;
    description: string;
    factAt: string | null;
  }>;
  history: Array<{
    id: string;
    previousStatus: CommitmentStatus | null;
    newStatus: CommitmentStatus;
    rationale: string;
    changedAt: string;
    evidences: Array<{ evidence: { id: string; description: string } }>;
  }>;
};

export type GovernmentActionRecord = {
  id: string;
  title: string;
  description: string;
  type: "POSITIVE_DELIVERY" | "CRITICAL_ALERT" | "NEUTRAL_METRIC";
  category: string;
  evidenceUrl: string;
  sourceName: string;
  eventDate: string;
  createdAt: string;
  source: OfficialList["source"] & { type: string };
};

export type CguAnnualExpense = {
  ano?: number | null;
  orgao?: string | null;
  codigoOrgao?: string | null;
  orgaoSuperior?: string | null;
  codigoOrgaoSuperior?: string | null;
  empenhado?: string | null;
  liquidado?: string | null;
  pago?: string | null;
  [key: string]: unknown;
};

export type CguAgency = {
  codigo?: string | null;
  descricao?: string | null;
};

export type ApiPage<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function resolveApiBaseUrl(): string {
  const configuredUrl =
    process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ??
    "http://127.0.0.1:3000";

  if (Platform.OS === "web") return configuredUrl;

  const apiUrl = new URL(configuredUrl);
  if (
    apiUrl.hostname === "localhost" ||
    apiUrl.hostname === "127.0.0.1" ||
    apiUrl.hostname === "0.0.0.0"
  ) {
    const expoHost = Constants.expoConfig?.hostUri?.split(":")[0];
    apiUrl.hostname =
      expoHost ?? (Platform.OS === "android" ? "10.0.2.2" : apiUrl.hostname);
  }

  return apiUrl.toString().replace(/\/+$/, "");
}

const API_BASE_URL = resolveApiBaseUrl();

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { accept: "application/json" },
    });
  } catch {
    throw new Error(
      `Não foi possível conectar à API (${API_BASE_URL}). Confira se o backend está ativo e se EXPO_PUBLIC_API_URL aponta para este computador.`,
    );
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? (payload as ApiErrorResponse).error?.message
        : undefined;
    throw new Error(message ?? `A API respondeu com HTTP ${response.status}.`);
  }
  return payload as T;
}

export function getRepresentatives(options: {
  page: number;
  limit?: number;
  search?: string;
  party?: string;
  state?: string;
  city?: string;
  role?: Representative["role"];
}): Promise<RepresentativePage> {
  const query = new URLSearchParams({
    page: String(options.page),
    limit: String(options.limit ?? 20),
  });
  if (options.search?.trim()) query.set("search", options.search.trim());
  if (options.party?.trim()) query.set("party", options.party.trim());
  if (options.state?.trim()) query.set("state", options.state.trim());
  if (options.city?.trim()) query.set("city", options.city.trim());
  if (options.role) query.set("role", options.role);
  return request(`/api/politicians?${query.toString()}`);
}

export function getRepresentative(id: string): Promise<{ data: Representative }> {
  return request(`/api/politicians/${encodeURIComponent(id)}`);
}

export function getCommitments(page = 1): Promise<ApiPage<CommitmentRecord>> {
  return request(`/api/commitments?page=${page}&limit=20`);
}

export function getGovernmentActions(
  politicianId: string,
): Promise<ApiPage<GovernmentActionRecord>> {
  return request(
    `/api/politicians/${encodeURIComponent(politicianId)}/actions?page=1&limit=20`,
  );
}

export function getCguAnnualExpenses(options: {
  year: number;
  page: number;
  agencyCode?: string;
}): Promise<{
  data: CguAnnualExpense[];
  source: OfficialList["source"];
  pagination: { page: number };
}> {
  const query = new URLSearchParams({
    year: String(options.year),
    page: String(options.page),
  });
  if (options.agencyCode) query.set("orgao", options.agencyCode);
  return request(`/api/cgu/expenses?${query.toString()}`);
}

export function getCguAgencies(search: string): Promise<{
  data: CguAgency[];
  source: OfficialList["source"];
  pagination: { page: number };
}> {
  const query = new URLSearchParams({ search, page: "1" });
  return request(`/api/cgu/agencies?${query.toString()}`);
}

export function getProposals(options: {
  page: number;
  year: number;
  type: string;
  limit?: number;
}): Promise<OfficialList> {
  const query = new URLSearchParams({
    page: String(options.page),
    limit: String(options.limit ?? 20),
    year: String(options.year),
    type: options.type,
  });
  return request(`/api/proposals?${query.toString()}`);
}

export function getProposal(id: string): Promise<OfficialDetail> {
  return request(`/api/proposals/${encodeURIComponent(id)}`);
}

export function getProposalProgress(id: string): Promise<OfficialList> {
  return request(`/api/proposals/${encodeURIComponent(id)}/progress`);
}

export function getProposalVotes(id: string): Promise<OfficialList> {
  return request(`/api/proposals/${encodeURIComponent(id)}/votes`);
}

export function getIndividualVotes(id: string): Promise<OfficialList> {
  return request(`/api/votes/${encodeURIComponent(id)}/votes`);
}

export function getExpenses(options: {
  representativeId: string;
  year: number;
  page?: number;
  limit?: number;
}): Promise<OfficialList> {
  const query = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 20),
    year: String(options.year),
  });
  return request(
    `/api/representatives/${encodeURIComponent(options.representativeId)}/expenses?${query.toString()}`,
  );
}

export async function checkApiHealth(): Promise<boolean> {
  const health = await request<{ status: string }>("/api/health");
  return health.status === "ok";
}

export const officialExpensesUrl = (id: string, year: number) =>
  `https://dadosabertos.camara.leg.br/api/v2/deputados/${encodeURIComponent(id)}/despesas?ano=${encodeURIComponent(String(year))}&itens=20`;

export const officialProposalUrl = (id: string) =>
  `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${encodeURIComponent(id)}`;

export const apiBaseUrl = API_BASE_URL;
