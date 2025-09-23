-- DropIndex
DROP INDEX "public"."Transaction_dedupeHash_key";

-- CreateIndex
CREATE INDEX "Budget_userId_period_idx" ON "public"."Budget"("userId", "period");
