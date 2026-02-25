/**
 * Nigerian State → Geopolitical Zone mapping
 * The six zones are the standard federal reporting regions used in Nigeria.
 */

export type NigerianZone =
  | "North Central"
  | "North East"
  | "North West"
  | "South East"
  | "South South"
  | "South West";

const STATE_TO_ZONE: Record<string, NigerianZone> = {
  // North Central
  benue: "North Central",
  kogi: "North Central",
  kwara: "North Central",
  nasarawa: "North Central",
  niger: "North Central",
  plateau: "North Central",
  fct: "North Central",
  abuja: "North Central",
  "federal capital territory": "North Central",

  // North East
  adamawa: "North East",
  bauchi: "North East",
  borno: "North East",
  gombe: "North East",
  taraba: "North East",
  yobe: "North East",

  // North West
  jigawa: "North West",
  kaduna: "North West",
  kano: "North West",
  katsina: "North West",
  kebbi: "North West",
  sokoto: "North West",
  zamfara: "North West",

  // South East
  abia: "South East",
  anambra: "South East",
  ebonyi: "South East",
  enugu: "South East",
  imo: "South East",

  // South South
  "akwa ibom": "South South",
  bayelsa: "South South",
  "cross river": "South South",
  delta: "South South",
  edo: "South South",
  rivers: "South South",

  // South West
  ekiti: "South West",
  lagos: "South West",
  ogun: "South West",
  ondo: "South West",
  osun: "South West",
  oyo: "South West",
};

/**
 * Derive the Nigerian geopolitical zone from a state name.
 * Returns undefined if the state is unknown or not a Nigerian state
 * (e.g. for international users).
 */
export function getNigerianRegion(state?: string | null): string | undefined {
  if (!state) return undefined;
  const key = state.trim().toLowerCase();
  return STATE_TO_ZONE[key] ?? undefined;
}
