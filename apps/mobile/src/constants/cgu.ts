export const AGENCY_GROUPS = [
  { id: "ministries", label: "Ministérios", search: "Ministério" },
  { id: "agencies", label: "Agências", search: "Agência" },
  { id: "universities", label: "Universidades", search: "Universidade" },
  { id: "institutes", label: "Institutos", search: "Instituto" },
  { id: "foundations", label: "Fundações", search: "Fundação" },
] as const;

export type AgencyGroupId = (typeof AGENCY_GROUPS)[number]["id"];
