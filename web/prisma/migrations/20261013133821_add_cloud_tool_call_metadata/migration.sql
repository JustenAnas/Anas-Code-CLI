-- AlterTable
ALTER TABLE "CloudMessage" ADD COLUMN     "toolCall" JSONB,
ADD COLUMN     "toolCallId" TEXT,
ADD COLUMN     "toolCalls" JSONB;
