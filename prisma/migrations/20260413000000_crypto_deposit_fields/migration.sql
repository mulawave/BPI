-- AlterTable: Add crypto deposit address and network fields
ALTER TABLE "PaymentGatewayConfig" ADD COLUMN "cryptoDepositAddress" TEXT;
ALTER TABLE "PaymentGatewayConfig" ADD COLUMN "cryptoNetwork" TEXT;
