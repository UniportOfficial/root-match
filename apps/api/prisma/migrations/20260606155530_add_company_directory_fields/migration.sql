-- CreateEnum
CREATE TYPE "ConfidenceTier" AS ENUM ('A_CERTIFIED_ROOT', 'B_LOCAL_STRONG_INSIDE', 'C_BORDERLINE_INSIDE', 'D_LOW_CONFIDENCE');

-- AlterTable
ALTER TABLE "company" ADD COLUMN     "address" TEXT,
ADD COLUMN     "confidence_tier" "ConfidenceTier",
ADD COLUMN     "external_id" TEXT,
ADD COLUMN     "kakao_id" TEXT,
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "process_hint" TEXT,
ADD COLUMN     "representative" TEXT,
ADD COLUMN     "source_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "company_external_id_key" ON "company"("external_id");

-- CreateIndex
CREATE INDEX "company_region_process_hint_idx" ON "company"("region", "process_hint");

-- CreateIndex
CREATE INDEX "company_confidence_tier_idx" ON "company"("confidence_tier");
