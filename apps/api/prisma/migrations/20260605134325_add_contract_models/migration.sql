-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('draft', 'pending', 'in_progress', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'pending',
    "ucansign_document_id" TEXT,
    "ucansign_template_id" TEXT NOT NULL,
    "ucansign_folder_id" TEXT,
    "quote_request_id" TEXT,
    "accepted_quote_id" TEXT,
    "client_company_id" TEXT,
    "factory_company_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancelled_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_participants" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "signing_order" INTEGER NOT NULL,
    "signing_method_type" TEXT NOT NULL,
    "auth_type" TEXT,
    "ucansign_participant_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'need_signing',
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_ucansign_document_id_key" ON "contracts"("ucansign_document_id");

-- CreateIndex
CREATE INDEX "contracts_owner_user_id_created_at_idx" ON "contracts"("owner_user_id", "created_at");

-- CreateIndex
CREATE INDEX "contracts_status_created_at_idx" ON "contracts"("status", "created_at");

-- CreateIndex
CREATE INDEX "contract_participants_contract_id_signing_order_idx" ON "contract_participants"("contract_id", "signing_order");

-- AddForeignKey
ALTER TABLE "contract_participants" ADD CONSTRAINT "contract_participants_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
