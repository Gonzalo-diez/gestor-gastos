/*
  Warnings:

  - You are about to drop the column `currency` on the `Account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Account" DROP COLUMN "currency",
ADD COLUMN     "currencyCode" VARCHAR(3);

-- CreateTable
CREATE TABLE "public"."Currency" (
    "code" VARCHAR(3) NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "decimals" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "Account_currencyCode_idx" ON "public"."Account"("currencyCode");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "public"."Currency"("code") ON DELETE SET NULL ON UPDATE CASCADE;
