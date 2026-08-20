/**
 * Module-level abort controller that tracks all in-flight tRPC HTTP requests.
 *
 * When the user navigates between pages we call abortAllInFlightTrpcRequests()
 * which immediately aborts every pending fetch.  This frees browser HTTP
 * connections so Next.js can fetch the destination page's RSC payload without
 * waiting for slow tRPC batch responses to finish (or timeout).
 *
 * A new controller is created after each abort so subsequent requests
 * are unaffected.
 */
let controller = new AbortController();

export function getNavAbortSignal(): AbortSignal {
  return controller.signal;
}

export function abortAllInFlightTrpcRequests(): void {
  controller.abort();
  controller = new AbortController();
}
