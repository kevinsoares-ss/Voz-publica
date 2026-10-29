-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('CAMARA_API', 'SENADO_API', 'CGU_API', 'TSE_API', 'TCE_API', 'OFFICIAL_DOCUMENT', 'NEWS', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "Sphere" AS ENUM ('FEDERAL', 'STATE', 'MUNICIPAL');

-- CreateEnum
CREATE TYPE "PowerBranch" AS ENUM ('EXECUTIVE', 'LEGISLATIVE');

-- CreateEnum
CREATE TYPE "PoliticianRole" AS ENUM ('PRESIDENT', 'GOVERNOR', 'MAYOR', 'SENATOR', 'FEDERAL_DEPUTY', 'STATE_DEPUTY', 'CITY_COUNCILLOR');

-- CreateEnum
CREATE TYPE "ImpactType" AS ENUM ('POSITIVE_DELIVERY', 'CRITICAL_ALERT', 'NEUTRAL_METRIC');

-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('A_VERIFICAR', 'EM_ANDAMENTO', 'CUMPRIDO', 'PARCIALMENTE_CUMPRIDO', 'NAO_CUMPRIDO', 'SEM_INFORMACAO_SUFICIENTE');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "consultedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Representative" (
    "id" TEXT NOT NULL,
    "sourceNamespace" TEXT NOT NULL DEFAULT 'camara',
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "civilName" TEXT,
    "role" "PoliticianRole" NOT NULL DEFAULT 'FEDERAL_DEPUTY',
    "sphere" "Sphere" NOT NULL DEFAULT 'FEDERAL',
    "powerBranch" "PowerBranch" NOT NULL DEFAULT 'LEGISLATIVE',
    "party" TEXT,
    "state" TEXT,
    "city" TEXT,
    "photoUrl" TEXT,
    "sourceUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Representative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mandate" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "representativeId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" TEXT,
    "sourceId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mandate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "sourceNamespace" TEXT NOT NULL DEFAULT 'camara',
    "externalId" TEXT NOT NULL,
    "type" TEXT,
    "number" INTEGER,
    "year" INTEGER,
    "summary" TEXT,
    "status" TEXT,
    "presentedAt" TIMESTAMP(3),
    "sourceId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepresentativeProposal" (
    "id" TEXT NOT NULL,
    "representativeId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "role" TEXT,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepresentativeProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voting" (
    "id" TEXT NOT NULL,
    "sourceNamespace" TEXT NOT NULL DEFAULT 'camara',
    "externalId" TEXT NOT NULL,
    "heldAt" TIMESTAMP(3),
    "description" TEXT,
    "approval" BOOLEAN,
    "sourceId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalVoting" (
    "proposalId" TEXT NOT NULL,
    "votingId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "ProposalVoting_pkey" PRIMARY KEY ("proposalId","votingId")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "representativeId" TEXT NOT NULL,
    "year" INTEGER,
    "month" INTEGER,
    "category" TEXT,
    "supplier" TEXT,
    "value" TEXT,
    "sourceId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commitment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "representativeId" TEXT,
    "registeredAt" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "status" "CommitmentStatus" NOT NULL DEFAULT 'A_VERIFICAR',
    "evaluationMethod" TEXT NOT NULL,
    "reviewer" TEXT,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentAction" (
    "id" TEXT NOT NULL,
    "representativeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ImpactType" NOT NULL,
    "category" TEXT NOT NULL,
    "evidenceUrl" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernmentAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT NOT NULL,
    "factAt" TIMESTAMP(3),
    "observation" TEXT,
    "reviewer" TEXT,
    "sourceId" TEXT NOT NULL,
    "consultedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitmentHistory" (
    "id" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "previousStatus" "CommitmentStatus",
    "newStatus" "CommitmentStatus" NOT NULL,
    "rationale" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewer" TEXT,

    CONSTRAINT "CommitmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitmentHistoryEvidence" (
    "historyId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,

    CONSTRAINT "CommitmentHistoryEvidence_pkey" PRIMARY KEY ("historyId","evidenceId")
);

-- CreateIndex
CREATE INDEX "Source_type_consultedAt_idx" ON "Source"("type", "consultedAt");

-- CreateIndex
CREATE INDEX "Representative_name_idx" ON "Representative"("name");

-- CreateIndex
CREATE INDEX "Representative_state_party_idx" ON "Representative"("state", "party");

-- CreateIndex
CREATE INDEX "Representative_role_sphere_state_city_idx" ON "Representative"("role", "sphere", "state", "city");

-- CreateIndex
CREATE UNIQUE INDEX "Representative_sourceNamespace_externalId_key" ON "Representative"("sourceNamespace", "externalId");

-- CreateIndex
CREATE INDEX "Mandate_representativeId_startsAt_idx" ON "Mandate"("representativeId", "startsAt");

-- CreateIndex
CREATE INDEX "Mandate_sourceId_externalId_idx" ON "Mandate"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "Proposal_type_year_number_idx" ON "Proposal"("type", "year", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_sourceNamespace_externalId_key" ON "Proposal"("sourceNamespace", "externalId");

-- CreateIndex
CREATE INDEX "RepresentativeProposal_proposalId_idx" ON "RepresentativeProposal"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "RepresentativeProposal_representativeId_proposalId_key" ON "RepresentativeProposal"("representativeId", "proposalId");

-- CreateIndex
CREATE INDEX "Voting_heldAt_idx" ON "Voting"("heldAt");

-- CreateIndex
CREATE UNIQUE INDEX "Voting_sourceNamespace_externalId_key" ON "Voting"("sourceNamespace", "externalId");

-- CreateIndex
CREATE INDEX "ProposalVoting_votingId_idx" ON "ProposalVoting"("votingId");

-- CreateIndex
CREATE INDEX "Expense_representativeId_year_month_idx" ON "Expense"("representativeId", "year", "month");

-- CreateIndex
CREATE INDEX "Expense_sourceId_externalId_idx" ON "Expense"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "Commitment_representativeId_status_idx" ON "Commitment"("representativeId", "status");

-- CreateIndex
CREATE INDEX "Commitment_status_createdAt_idx" ON "Commitment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "GovernmentAction_representativeId_eventDate_idx" ON "GovernmentAction"("representativeId", "eventDate");

-- CreateIndex
CREATE INDEX "GovernmentAction_type_eventDate_idx" ON "GovernmentAction"("type", "eventDate");

-- CreateIndex
CREATE INDEX "Evidence_commitmentId_factAt_idx" ON "Evidence"("commitmentId", "factAt");

-- CreateIndex
CREATE INDEX "CommitmentHistory_commitmentId_changedAt_idx" ON "CommitmentHistory"("commitmentId", "changedAt");

-- CreateIndex
CREATE INDEX "CommitmentHistoryEvidence_evidenceId_idx" ON "CommitmentHistoryEvidence"("evidenceId");

-- AddForeignKey
ALTER TABLE "Representative" ADD CONSTRAINT "Representative_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Representative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeProposal" ADD CONSTRAINT "RepresentativeProposal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeProposal" ADD CONSTRAINT "RepresentativeProposal_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Representative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeProposal" ADD CONSTRAINT "RepresentativeProposal_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voting" ADD CONSTRAINT "Voting_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalVoting" ADD CONSTRAINT "ProposalVoting_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalVoting" ADD CONSTRAINT "ProposalVoting_votingId_fkey" FOREIGN KEY ("votingId") REFERENCES "Voting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalVoting" ADD CONSTRAINT "ProposalVoting_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Representative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Representative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernmentAction" ADD CONSTRAINT "GovernmentAction_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Representative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernmentAction" ADD CONSTRAINT "GovernmentAction_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentHistory" ADD CONSTRAINT "CommitmentHistory_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentHistoryEvidence" ADD CONSTRAINT "CommitmentHistoryEvidence_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "CommitmentHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentHistoryEvidence" ADD CONSTRAINT "CommitmentHistoryEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
