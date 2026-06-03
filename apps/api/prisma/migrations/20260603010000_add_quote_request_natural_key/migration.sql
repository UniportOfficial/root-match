-- Phase 1.W2-4: make QuoteRequest seed idempotent by natural key.
-- Mirrors Prisma @@unique([clientUserId, projectName]).
CREATE UNIQUE INDEX "quote_requests_client_user_id_project_name_key"
  ON "quote_requests"("client_user_id", "project_name");
