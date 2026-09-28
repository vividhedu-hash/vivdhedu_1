/**
 * Runs before first paint, from a blocking `<script>` in the document head.
 *
 * Without this, a person who chose the dark theme saw a full white flash on
 * every navigation, because `data-theme` was only ever set inside a React
 * effect — i.e. after hydration. That is the single most common way a theme
 * toggle makes a product look unfinished, and no amount of token correctness
 * fixes it.
 *
 * Rules this script follows:
 *   - Synchronous, before the body renders.
 *   - Never throws. Blocked script, private mode, or a malformed cookie must
 *     not take the page down, so every storage access is wrapped.
 *   - Respects consent. It only reads `il-theme` when functional storage is
 *     allowed, which means it reads the same `vividhedu_consent` cookie the
 *     rest of the app reads. If functional storage is off, the theme is not
 *     persisted, so there is nothing to restore and the default applies.
 *   - Light is the default. `globals.css` states that decision; this script
 *     does not need to second-guess it, and deliberately does not follow
 *     `prefers-color-scheme` (see the comment in globals.css for why).
 *
 * Kept small and dependency-free. It duplicates the cookie name and the theme
 * key from `session-policy.ts` rather than importing them, because a module
 * import would put it in the module graph and defeat the point of running
 * first. The duplication is asserted in `theme-boot.test.ts`.
 */
(function applyStoredTheme() {
  var root = document.documentElement;
  try {
    var match = /(?:^|;\s*)vividhedu_consent=([^;]*)/.exec(document.cookie);
    var raw = match ? decodeURIComponent(match[1]) : "";
    // Same shape session-policy writes: <version>.<functional>.<analytics>.<ts>
    var functionalAllowed = /^\d+\.1\.[01]\.\d+$/.test(raw);

    if (functionalAllowed) {
      var stored = window.localStorage.getItem("il-theme");
      if (stored === "dark" || stored === "light") {
        root.setAttribute("data-theme", stored);
        return;
      }
    }
    // No usable stored choice. `:root` is already the light default, so
    // setting the attribute explicitly just keeps React, the toggle icon, and
    // the painted CSS in agreement from the very first frame.
    root.setAttribute("data-theme", "light");
  } catch {
    /* Private mode or blocked storage. The CSS default still applies. */
  }
})();
