const parseVersion = (value: string): number[] => {
  const cleaned = value.trim().replace(/^v/i, "").split("-")[0] ?? "0.0.0";
  const [major, minor, patch] = cleaned.split(".");
  return [Number(major || 0), Number(minor || 0), Number(patch || 0)];
};

const compareSemver = (left: string, right: string): number => {
  const l = parseVersion(left);
  const r = parseVersion(right);

  for (let i = 0; i < 3; i += 1) {
    if ((l[i] ?? 0) > (r[i] ?? 0)) return 1;
    if ((l[i] ?? 0) < (r[i] ?? 0)) return -1;
  }

  return 0;
};

export function isAppVersionCompatible(input: {
  appVersion: string;
  minAppVersion: string;
  maxAppVersion: string;
}): boolean {
  const { appVersion, minAppVersion, maxAppVersion } = input;

  // Support patterns like "1.x" for maxAppVersion.
  if (/^\d+\.x$/i.test(maxAppVersion)) {
    const maxMajor = Number(maxAppVersion.split(".")[0]);
    const appMajor = parseVersion(appVersion)[0];
    return compareSemver(appVersion, minAppVersion) >= 0 && appMajor === maxMajor;
  }

  return compareSemver(appVersion, minAppVersion) >= 0 && compareSemver(appVersion, maxAppVersion) <= 0;
}

export function isPluginSdkCompatible(input: {
  hostPluginSdkVersion: string;
  pluginSdkVersion: string;
}): boolean {
  return compareSemver(input.pluginSdkVersion, input.hostPluginSdkVersion) <= 0;
}
