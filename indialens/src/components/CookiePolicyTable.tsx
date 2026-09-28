import { EMPTY_CATEGORIES, STORAGE_POLICY } from "@/lib/session-policy";

const CATEGORY_LABEL = {
  necessary: "Strictly necessary",
  functional: "Functional",
  analytics: "Analytics",
} as const;

const CATEGORY_NOTE = {
  necessary: "Always on. Required for sign-in, for returning you to the page you asked for, and for remembering this choice.",
  functional: "Off until you allow it.",
  analytics: "Off until you allow it.",
} as const;

/**
 * The table on `/cookies` and in §8 of `/privacy`, rendered from
 * `STORAGE_POLICY`. Both pages read the same array, so the published list
 * cannot drift from what the code writes.
 *
 * `<caption>` carries the table's purpose for screen readers; without it a
 * table that starts with a row of column labels announces only a bare grid.
 */
export function CookiePolicyTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      <table className="min-w-full text-left text-[13px]">
        <caption className="sr-only">
          Every cookie, local storage entry, and URL handle this site writes,
          with where it is kept, why, for how long, and who can read it.
        </caption>
        <thead className="bg-[var(--bg-surface)] text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Name</th>
            <th scope="col" className="px-3 py-2 font-medium">Where</th>
            <th scope="col" className="px-3 py-2 font-medium">Category</th>
            <th scope="col" className="px-3 py-2 font-medium">Who can read it</th>
            <th scope="col" className="px-3 py-2 font-medium">Kept for</th>
            <th scope="col" className="px-3 py-2 font-medium">Why</th>
          </tr>
        </thead>
        <tbody>
          {STORAGE_POLICY.map((row) => (
            <tr
              key={row.name}
              className="border-t border-[var(--border-subtle)] align-top"
            >
              <td className="px-3 py-2 font-mono text-[12px] whitespace-nowrap">
                {row.name}
              </td>
              <td className="px-3 py-2 text-[var(--text-secondary)] whitespace-nowrap">
                {row.store}
              </td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">
                <span className="block font-medium text-[var(--text-primary)]">
                  {CATEGORY_LABEL[row.category]}
                </span>
                <span className="mt-0.5 block text-[12px] text-[var(--text-tertiary)]">
                  {CATEGORY_NOTE[row.category]}
                </span>
              </td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">
                {row.party}
                {row.vendor && (
                  <span className="mt-0.5 block text-[12px] text-[var(--text-tertiary)]">
                    {row.vendor}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">
                {row.duration}
              </td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">
                {row.purpose}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* The categories a granular banner must offer but that have nothing
          behind them. Naming them is part of the disclosure: an auditor
          comparing this page against ePrivacy's category list should find the
          answer here, not by noticing an omission. */}
      <div className="border-t border-[var(--border)] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          Categories with nothing behind them
        </p>
        <ul className="mt-2 space-y-2">
          {EMPTY_CATEGORIES.map((cat) => (
            <li key={cat.id} className="text-[13px] leading-relaxed">
              <span className="font-semibold">{cat.label}</span>
              <span className="text-[var(--text-secondary)]"> — {cat.reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
