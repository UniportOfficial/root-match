-- CreateTable
CREATE TABLE "factory_profiles" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "processes" TEXT[],
    "trust_score" INTEGER NOT NULL,
    "delivery_rate" INTEGER NOT NULL,
    "reorder_rate" INTEGER NOT NULL,
    "quality_score" INTEGER NOT NULL,
    "delivery_score" INTEGER NOT NULL,
    "price_competitiveness" INTEGER NOT NULL,
    "estimate_min" INTEGER NOT NULL,
    "estimate_max" INTEGER NOT NULL,
    "industrial_complex" TEXT,
    "reorder_customer_count" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "specialty" TEXT[],
    "equipment" TEXT[],
    "products" TEXT[],
    "monthly_capacity" TEXT,
    "clients" TEXT[],
    "quality_satisfaction" DOUBLE PRECISION,
    "avg_response_time" TEXT,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factory_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "factory_profiles_company_id_key" ON "factory_profiles"("company_id");

-- CreateIndex
CREATE INDEX "factory_profiles_trust_score_idx" ON "factory_profiles"("trust_score");

-- CreateIndex
CREATE INDEX "factory_profiles_verified_idx" ON "factory_profiles"("verified");

-- AddForeignKey
ALTER TABLE "factory_profiles" ADD CONSTRAINT "factory_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
