"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { analyticsAllowed } from "@/lib/consent";
import { registerAnalyticsSink, unregisterAnalyticsSink } from "@/lib/analytics";
import { CONSENT_EVENT } from "@/lib/session-policy";

/**
 * PostHog is loaded only after analytics consent, and stopped again the moment
 * it is withdrawn.
 *
 * Three properties this file is responsible for, each of which has a
 * corresponding failure mode if it is got wrong:
 *
 *   1. `posthog.init()` is never reached without consent. `syncAnalytics`
 *      returns before it otherwise, so the SDK never opens a connection, never
 *      sets a persistence key, and never autocaptures.
 *
 *   2. `<PHProvider client={posthog}>` cannot initialise the client behind our
 *      back. Read `posthog-js/react/dist/esm/index.js:69-95`: the provider
 *      calls `instance.init(apiKey, options)` inside an effect, but only when
 *      `client` is NOT provided. Because this app passes `client`, that branch
 *      is dead — the provider is a context wrapper and nothing else. Passing
 *      `apiKey` instead would silently opt everyone in.
 *
 *   3. The import of `posthog-js` itself is inert. The module body only
 *      constructs the singleton and registers a `beforeunload` flush; the
 *      network, the persistence layer, and autocapture all begin in `init()`.
 *      So the SDK being present in the bundle is not the same as the SDK being
 *      running, and this file is the only place that difference is enforced.
 *
 * `syncAnalytics` is idempotent and is re-run on every consent change, which is
 * what makes withdrawal real rather than cosmetic: opting out calls
 * `opt_out_capturing()` (stops every future send), then `reset()` (clears the
 * distinct id and the queued events), then unregisters our sink so
 * `capture()` from the forms has nowhere to go.
 */

function stopAnalytics(): void {
  const loaded = Boolean((posthog as { __loaded?: boolean }).__loaded);
  unregisterAnalyticsSink();
  if (loaded) {
    posthog.opt_out_capturing();
    posthog.reset();
  }
}

function syncAnalytics(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || !analyticsAllowed()) {
    stopAnalytics();
    return;
  }

  const loaded = Boolean((posthog as { __loaded?: boolean }).__loaded);
  if (!loaded) {
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
    posthog.init(key, {
      api_host: host,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    });
    // Registered only once init has actually run, so a capture that races the
    // consent event has no sink to reach and is dropped rather than queued.
    registerAnalyticsSink((event, props) => {
      posthog.capture(event, props);
    });
  }
  posthog.opt_in_capturing();
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    syncAnalytics();
    const onConsent = () => syncAnalytics();
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsent);
    };
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
