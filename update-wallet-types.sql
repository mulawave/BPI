-- Update existing BPT transactions to have walletType='bpiToken'
UPDATE "Transaction" 
SET "walletType" = 'bpiToken' 
WHERE "currency" = 'BPT' 
  OR ("type" = 'CREDIT' AND "amount" > 0 AND EXISTS (
    SELECT 1 FROM "User" WHERE "User"."id" = "Transaction"."userId" 
    AND "User"."bpiTokenWallet" >= "Transaction"."amount"
  ));
