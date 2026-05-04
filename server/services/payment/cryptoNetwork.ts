import type { CryptoAddressKind } from "./cryptoAddress";

const GENERIC_NETWORK_LABELS = new Set([
  "",
  "PROVIDERGENERATED0XADDRESS",
  "PROVIDERGENERATEDADDRESS",
  "PROVIDERSUPPLIED",
  "PROVIDERSPECIFIED",
]);

function normalizeComparableValue(value: string): string {
  return value.toUpperCase().trim().replace(/[\s_-]+/g, "");
}

export function normalizeCryptoNetwork(value?: string | null): string | null {
  if (typeof value !== "string") return null;

  const normalized = normalizeComparableValue(value);
  if (!normalized) return null;

  if (
    normalized.includes("BEP20") ||
    normalized.includes("BINANCESMARTCHAIN") ||
    normalized === "BSC" ||
    normalized.includes("BSC")
  ) {
    return "BEP20";
  }

  if (normalized.includes("TRC20") || normalized.includes("TRON")) {
    return "TRC20";
  }

  if (normalized.includes("ERC20") || normalized.includes("ETHEREUM")) {
    return "ERC20";
  }

  return null;
}

export function isGenericCryptoNetwork(value?: string | null): boolean {
  if (typeof value !== "string") return true;
  return GENERIC_NETWORK_LABELS.has(normalizeComparableValue(value));
}

export function isNetworkCompatibleWithAddressKind(
  network: string | null | undefined,
  kind: CryptoAddressKind,
): boolean {
  const normalized = normalizeCryptoNetwork(network);
  if (!normalized) return false;

  switch (kind) {
    case "tron":
      return normalized === "TRC20";
    case "evm":
      return normalized === "BEP20" || normalized === "ERC20";
    default:
      return true;
  }
}