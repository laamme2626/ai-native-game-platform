/*
  Warnings:

  - You are about to drop the column `thumbnail` on the `Game` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AgentLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL DEFAULT 'Agent Orchestrator',
    "level" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "GenerationJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AgentLog" ("createdAt", "id", "jobId", "level", "message", "metadata") SELECT "createdAt", "id", "jobId", "level", "message", "metadata" FROM "AgentLog";
DROP TABLE "AgentLog";
ALTER TABLE "new_AgentLog" RENAME TO "AgentLog";
CREATE INDEX "AgentLog_jobId_createdAt_idx" ON "AgentLog"("jobId", "createdAt");
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "parentGameId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "manifestUrl" TEXT NOT NULL,
    "entryUrl" TEXT NOT NULL,
    "specUrl" TEXT NOT NULL,
    "coverUrl" TEXT,
    "assetName" TEXT,
    "assetUrl" TEXT,
    "assetType" TEXT,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    CONSTRAINT "Game_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Game" ("createdAt", "description", "entryUrl", "id", "manifestUrl", "ownerId", "prompt", "publishedAt", "specUrl", "status", "title", "updatedAt") SELECT "createdAt", "description", "entryUrl", "id", "manifestUrl", "ownerId", "prompt", "publishedAt", "specUrl", "status", "title", "updatedAt" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE INDEX "Game_status_publishedAt_idx" ON "Game"("status", "publishedAt");
CREATE INDEX "Game_ownerId_idx" ON "Game"("ownerId");
CREATE INDEX "Game_parentGameId_idx" ON "Game"("parentGameId");
CREATE TABLE "new_GenerationJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gameId" TEXT,
    "prompt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "error" TEXT,
    "assetName" TEXT,
    "assetUrl" TEXT,
    "assetType" TEXT,
    "assetSize" INTEGER,
    "estimatedTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostCents" INTEGER NOT NULL DEFAULT 0,
    "generationStepsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GenerationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GenerationJob_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GenerationJob" ("createdAt", "error", "gameId", "id", "prompt", "status", "updatedAt", "userId") SELECT "createdAt", "error", "gameId", "id", "prompt", "status", "updatedAt", "userId" FROM "GenerationJob";
DROP TABLE "GenerationJob";
ALTER TABLE "new_GenerationJob" RENAME TO "GenerationJob";
CREATE INDEX "GenerationJob_userId_createdAt_idx" ON "GenerationJob"("userId", "createdAt");
CREATE INDEX "GenerationJob_status_idx" ON "GenerationJob"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
