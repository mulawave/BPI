/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */

const dns = require('node:dns');
const net = require('node:net');

// Workaround for environments where Windows' system DNS cannot resolve certain
// domains (e.g. binaries.prisma.sh), but direct TCP connectivity is fine.
// This forces Node's DNS lookups to use Do53 resolvers via c-ares.

const originalLookup = dns.lookup;

dns.setServers(['1.1.1.1', '8.8.8.8']);

function normalizeLookupArgs(hostname, options, callback) {
  if (typeof options === 'function') return { options: undefined, callback: options };
  return { options, callback };
}

function parseLookupOptions(options) {
  if (typeof options === 'number') return { family: options, all: false };
  if (typeof options === 'object' && options) {
    return {
      family: typeof options.family === 'number' ? options.family : 0,
      all: !!options.all,
    };
  }
  return { family: 0, all: false };
}

async function resolveAddresses(hostname, options) {
  const { family, all } = parseLookupOptions(options);

  const ipFamily = net.isIP(hostname);
  if (ipFamily === 4 || ipFamily === 6) {
    const single = { address: hostname, family: ipFamily };
    return all ? [single] : single;
  }

  const wantV4 = family === 0 || family === 4;
  const wantV6 = family === 0 || family === 6;

  const v4 = wantV4 ? await dns.promises.resolve4(hostname).catch(() => []) : [];
  const v6 = wantV6 ? await dns.promises.resolve6(hostname).catch(() => []) : [];

  const list = [];
  for (const addr of v4) list.push({ address: addr, family: 4 });
  for (const addr of v6) list.push({ address: addr, family: 6 });

  if (list.length === 0) throw new Error('dns override: no records');

  return all ? list : list[0];
}

dns.lookup = function patchedLookup(hostname, options, callback) {
  const args = normalizeLookupArgs(hostname, options, callback);

  resolveAddresses(hostname, args.options)
    .then((result) => {
      if (Array.isArray(result)) return args.callback(null, result);
      return args.callback(null, result.address, result.family);
    })
    .catch(() => originalLookup(hostname, args.options, args.callback));
};
