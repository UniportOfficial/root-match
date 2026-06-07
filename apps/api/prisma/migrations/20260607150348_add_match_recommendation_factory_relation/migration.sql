-- CreateIndex
CREATE INDEX "match_recommendations_factory_id_idx" ON "match_recommendations"("factory_id");

-- AddForeignKey
ALTER TABLE "match_recommendations" ADD CONSTRAINT "match_recommendations_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
