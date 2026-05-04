import { isNetworkCompatibleWithAddressKind, normalizeCryptoNetwork } from "./cryptoNetwork";

export type CryptoAddressKind = "tron" | "evm" | "unknown";

export interface ProviderAddressDetails {
  kind: CryptoAddressKind;
  displayNetwork: string;
  exactNetwork: boolean;
  networkInstruction?: string;
}

export interface DescribeProviderAddressOptions {
  providerNetworkHint?: string | null;
}

export function detectCryptoAddressKind(address?: string | null): CryptoAddressKind {
  if (!address) return "unknown";

  const trimmed = address.trim();
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmed)) {
    return "tron";
  }

  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return "evm";
  }

  return "unknown";
}

export function describeProviderAddress(
  address?: string | null,
  options: DescribeProviderAddressOptions = {},
): ProviderAddressDetails {
  const kind = detectCryptoAddressKind(address);
  const normalizedHint = normalizeCryptoNetwork(options.providerNetworkHint);
  const compatibleHint = normalizedHint && isNetworkCompatibleWithAddressKind(normalizedHint, kind)
    ? normalizedHint
    : kind === "unknown"
      ? normalizedHint
      : null;

  switch (kind) {
    case "tron":
      return {
        kind,
        displayNetwork: "TRC20",
        exactNetwork: true,
      };

    case "evm":
      if (compatibleHint) {
        return {
          kind,
          displayNetwork: compatibleHint,
          exactNetwork: true,
          networkInstruction:
            `This is a provider-generated 0x address. Send only via the ${compatibleHint} network for this payment. Do not use the manual TRC20 address or TRC20-only instructions for this payment.`,
        };
      }

      return {
        kind,
        displayNetwork: "Provider-generated 0x address",
        exactNetwork: false,
        networkInstruction:
          "This is a provider-generated 0x address. Do not use the manual TRC20 address or TRC20-only instructions for this payment.",
      };

    default:
      if (compatibleHint) {
        return {
          kind,
          displayNetwork: compatibleHint,
          exactNetwork: true,
          networkInstruction: `Use only the ${compatibleHint} network for this provider-generated address.`,
        };
      }

      return {
        kind,
        displayNetwork: "Provider-generated address",
        exactNetwork: false,
        networkInstruction:
          "This is a provider-generated address. Use only the provider's address and QR code for this payment, not the manual USDT transfer settings.",
      };
  }
}