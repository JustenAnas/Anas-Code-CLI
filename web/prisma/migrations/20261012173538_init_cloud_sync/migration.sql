-- CreateTable
CREATE TABLE "CloudSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localSessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New session',
    "workingDirectory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CloudMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CloudSession_userId_updatedAt_idx" ON "CloudSession"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CloudSession_userId_localSessionId_key" ON "CloudSession"("userId", "localSessionId");

-- CreateIndex
CREATE INDEX "CloudMessage_sessionId_createdAt_idx" ON "CloudMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentMemory_userId_idx" ON "AgentMemory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentMemory_userId_key_key" ON "AgentMemory"("userId", "key");

-- AddForeignKey
ALTER TABLE "CloudMessage" ADD CONSTRAINT "CloudMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CloudSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
