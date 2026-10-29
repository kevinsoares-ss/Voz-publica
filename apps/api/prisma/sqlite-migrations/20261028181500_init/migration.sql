-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" DATETIME,
    "consultedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Representative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceNamespace" TEXT NOT NULL DEFAULT 'camara',
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "party" TEXT,
    "state" TEXT,
    "photoUrl" TEXT,
    "lastSyncedAt" DATETIME NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Representative_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mandate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT,
    "representativeId" TEXT NOT NULL,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "status" TEXT,
    "sourceId" TEXT NOT NULL,
    "lastSyncedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mandate_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Representative" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mandate_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceNamespace" TEXT NOT NULL DEFAULT 'camara',
    "externalId" TEXT NOT NULL,
    "type" TEXT,
    "number" INTEGER,
    "year" INTEGER,
    "summary" TEXT,
    "status" TEXT,
    "presentedAt" DATETIME,
    "sourceId" TEXT NOT NULL,
    "lastSyncedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Proposal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RepresentativeProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "representativeId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "role" TEXT,
    "sourceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RepresentativeProposal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RepresentativeProposal_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Representative" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RepresentativeProposal_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Voting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceNamespace" TEXT NOT NULL DEFAULT 'camara',
    "externalId" TEXT NOT NULL,
    "heldAt" DATETIME,
    "description" TEXT,
    "approval" BOOLEAN,
    "sourceId" TEXT NOT NULL,
    "lastSyncedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Voting_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProposalVoting" (
    "proposalId" TEXT NOT NULL,
    "votingId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,

    PRIMARY KEY ("proposalId", "votingId"),
    CONSTRAINT "ProposalVoting_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProposalVoting_votingId_fkey" FOREIGN KEY ("votingId") REFERENCES "Voting" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProposalVoting_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT,
    "representativeId" TEXT NOT NULL,
    "year" INTEGER,
    "month" INTEGER,
    "category" TEXT,
    "supplier" TEXT,
    "value" TEXT,
    "sourceId" TEXT NOT NULL,
    "lastSyncedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Representative" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Commitment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "representativeId" TEXT,
    "registeredAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'A_VERIFICAR',
    "evaluationMethod" TEXT NOT NULL,
    "reviewer" TEXT,
    "sourceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Commitment_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Representative" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Commitment_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commitmentId" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT NOT NULL,
    "factAt" DATETIME,
    "observation" TEXT,
    "reviewer" TEXT,
    "sourceId" TEXT NOT NULL,
    "consultedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evidence_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evidence_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommitmentHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commitmentId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewer" TEXT,
    CONSTRAINT "CommitmentHistory_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommitmentHistoryEvidence" (
    "historyId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,

    PRIMARY KEY ("historyId", "evidenceId"),
    CONSTRAINT "CommitmentHistoryEvidence_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "CommitmentHistory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommitmentHistoryEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Source_type_consultedAt_idx" ON "Source"("type", "consultedAt");

-- CreateIndex
CREATE INDEX "Representative_name_idx" ON "Representative"("name");

-- CreateIndex
CREATE INDEX "Representative_state_party_idx" ON "Representative"("state", "party");

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
CREATE INDEX "Evidence_commitmentId_factAt_idx" ON "Evidence"("commitmentId", "factAt");

-- CreateIndex
CREATE INDEX "CommitmentHistory_commitmentId_changedAt_idx" ON "CommitmentHistory"("commitmentId", "changedAt");

-- CreateIndex
CREATE INDEX "CommitmentHistoryEvidence_evidenceId_idx" ON "CommitmentHistoryEvidence"("evidenceId");
