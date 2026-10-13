/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,localMessageId]` on the table `CloudMessage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `localMessageId` to the `CloudMessage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CloudMessage" ADD COLUMN     "localMessageId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CloudMessage_sessionId_localMessageId_key" ON "CloudMessage"("sessionId", "localMessageId");
