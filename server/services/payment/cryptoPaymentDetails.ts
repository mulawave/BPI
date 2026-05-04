import type { CryptoAddressKind } from "./cryptoAddress";
import { describeProviderAddress } from "./cryptoAddress";
import { isGenericCryptoNetwork, normalizeCryptoNetwork } from "./cryptoNetwork";

export interface ResolveCryptoPaymentNetworkDetailsInput {
  cryptoNetwork?: string | null;
  paymentCurrency?: string | null;
  address?: string | null;
  networkInstruction?: string | null;
  providerNetworkExact?: boolean | null;
}

export interface ResolvedCryptoPaymentNetworkDetails {
  cryptoNetwork: string | null;
  providerNetworkExact: boolean | null;
  networkInstruction: string | null;
  addressFormat: CryptoAddressKind | null;
}

function getFallbackInstruction(network: string): string {
  return `Use only the ${network} network for this provider payment.`;
}

export function resolveCryptoPaymentNetworkDetails(
  input: ResolveCryptoPaymentNetworkDetailsInput,
): ResolvedCryptoPaymentNetworkDetails {
  const storedNetwork = typeof input.cryptoNetwork === "string" ? input.cryptoNetwork.trim() : "";
  const providerNetworkHint = normalizeCryptoNetwork(input.paymentCurrency);

  const derivedDetails = input.address
    ? describeProviderAddress(input.address, { providerNetworkHint })
    : providerNetworkHint
      ? {
          kind: "unknown" as const,
          displayNetwork: providerNetworkHint,
          exactNetwork: true,
          networkInstruction: getFallbackInstruction(providerNetworkHint),
        }
      : null;

  const normalizedStored = normalizeCryptoNetwork(storedNetwork);
  const normalizedDerived = normalizeCryptoNetwork(derivedDetails?.displayNetwork);

  const shouldUseDerived = Boolean(
    derivedDetails && (
      !storedNetwork ||
      isGenericCryptoNetwork(storedNetwork) ||
      (normalizedDerived && normalizedStored !== normalizedDerived)
    ),
  );

  return {
    cryptoNetwork: shouldUseDerived
      ? (derivedDetails?.displayNetwork ?? null)
      : (storedNetwork || derivedDetails?.displayNetwork || null),
    providerNetworkExact: shouldUseDerived
      ? (derivedDetails?.exactNetwork ?? null)
      : (input.providerNetworkExact ?? derivedDetails?.exactNetwork ?? null),
    networkInstruction: shouldUseDerived
      ? (derivedDetails?.networkInstruction ?? input.networkInstruction ?? null)
      : (input.networkInstruction ?? derivedDetails?.networkInstruction ?? null),
    addressFormat: derivedDetails?.kind ?? null,
  };
}