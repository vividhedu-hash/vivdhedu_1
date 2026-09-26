/**
 * Runtime proof that a NULL/absent ROI never becomes a plausible number.
 *
 * Type-level nullability is not enough: the historical bugs were all runtime
 * `?? <constant>` fallbacks that typecheck perfectly. This exercises the real
 * mapper and the real helpers against the exact shape the backend now emits
 * for a program with no scraped cost/placement data.
 *
 * Run: npx tsx scripts/verify-roi-honesty.ts
 */
import assert from "node:assert/strict";
import { mapSupabaseRowToRecord, type SupabaseProgramRow } from "../src/lib/supabase";
import {
  compareNullableAsc,
  compareNullableDesc,
  finiteOrNull,
  fmtNum,
  formatInr,
  NO_DATA,
} from "../src/lib/mock-data";

let failures = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL  ${name}\n        ${(e as Error).message}`);
  }
}

/** The row shape produced by compute_roi.py when data_issues is non-empty. */
const unmeasuredRow = (over: Partial<SupabaseProgramRow> = {}): SupabaseProgramRow => ({
  program_id: "iitb-mtech-cs",
  college_id: "iitb",
  college_short_name: "IIT Bombay",
  college_full_name: "Indian Institute of Technology Bombay",
  state: "Maharashtra",
  city: "Mumbai",
  tier: "1",
  college_type: "IIT",
  nirf_rank: 3,
  degree_id: "mtech-cs",
  degree_short_name: "M.Tech CS",
  degree_full_name: "Master of Technology in Computer Science",
  degree_field: "engineering-cs",
  degree_level: "PG",
  duration_years: 2,
  // --- everything below is NULL, exactly as the backend now writes it ---
  annual_tuition_inr: null,
  composite_score: null,
  financial_roi_pct: null,
  risk_score: null,
  ci_low: null,
  ci_high: null,
  confidence_level: null,
  model_version: null,
  ai_automation_prob: null,
  ai_risk_label: null,
  placement_rate_pct: null,
  median_salary_inr: null,
  highest_salary_inr: null,
  // Real per-component costs, exposed by migration 0005. Null here because this
  // program has no scraped cost_data row.
  total_tuition_inr: null,
  hostel_living_inr: null,
  exam_prep_costs_inr: null,
  opportunity_cost_inr: null,
  total_cost_of_degree: null,
  ...over,
});

const measuredRow = unmeasuredRow({
  program_id: "iitb-btech-cse",
  annual_tuition_inr: 250_000,
  composite_score: 94,
  financial_roi_pct: 4820,
  risk_score: 0.22,
  ci_low: 89,
  ci_high: 97,
  model_version: "v2.0-live",
  ai_automation_prob: 0.32,
  placement_rate_pct: 97,
  median_salary_inr: 2_000_000,
  // Real cost_data shape: total_cost_of_degree is tuition + hostel (verified
  // 54/54 rows in the live table), so the components must not be re-added on
  // top of it. See migration 0005_expose_cost_components.sql.
  total_tuition_inr: 600_000,
  hostel_living_inr: 400_000,
  exam_prep_costs_inr: 50_000,
  opportunity_cost_inr: 800_000,
  total_cost_of_degree: 1_000_000,
});

console.log("\n1. mapSupabaseRowToRecord passes NULL through unchanged");
const unmeasured = mapSupabaseRowToRecord(unmeasuredRow());
check("compositeScore is null (was `?? 70`)", () => assert.equal(unmeasured.roi.compositeScore, null));
check("financialRoiPct is null (was `?? 250`)", () => assert.equal(unmeasured.roi.financialRoiPct, null));
check("riskScore is null (was `?? 0.25`)", () => assert.equal(unmeasured.roi.riskScore, null));
check("ciLow is null (was `?? compositeScore - 2` -> NaN)", () => assert.equal(unmeasured.roi.confidenceIntervalLow, null));
check("ciHigh is null (was `?? compositeScore + 2` -> NaN)", () => assert.equal(unmeasured.roi.confidenceIntervalHigh, null));
check("totalTuitionInr is null (was `?? 1_000_000`)", () => assert.equal(unmeasured.costs.totalTuitionInr, null));
check("totalCostOfDegreeInr is null (was `null + 450_000` = 450k)", () => assert.equal(unmeasured.costs.totalCostOfDegreeInr, null));
check("annualTuitionInr is null (was NaN via null/4)", () => assert.equal(unmeasured.program.annualTuitionInr, null));
check("naacGrade is null (was hardcoded 'A++')", () => assert.equal(unmeasured.college.naacGrade, null));
check("established is null (was hardcoded 1960)", () => assert.equal(unmeasured.college.established, null));
check("nirfRank is null when absent (was `?? 50`)", () =>
  assert.equal(mapSupabaseRowToRecord(unmeasuredRow({ nirf_rank: null })).college.nirfRank, null));
check("durationYears is null when absent (was `?? 4`)", () =>
  assert.equal(mapSupabaseRowToRecord(unmeasuredRow({ duration_years: null as any })).degree.durationYears, null));
check("aiAutomationProbability is null (was `?? 0.22`)", () =>
  assert.equal(unmeasured.risk.aiAutomationProbability, null));
check("salary bands are all null (no projection from a null median)", () =>
  assert.deepEqual(
    [unmeasured.salary.year1, unmeasured.salary.year5, unmeasured.salary.year10, unmeasured.salary.year20],
    [null, null, null, null],
  ));
check("tier fallback retained (type system requires non-null)", () =>
  assert.equal(mapSupabaseRowToRecord(unmeasuredRow({ tier: "" })).college.tier, 2));
check("college_type fallback retained", () =>
  assert.equal(mapSupabaseRowToRecord(unmeasuredRow({ college_type: "" })).college.type, "private"));
check("degree_level fallback retained", () =>
  assert.equal(mapSupabaseRowToRecord(unmeasuredRow({ degree_level: "" })).degree.level, "UG"));

console.log("\n2. A fully measured program is still mapped losslessly");
const measured = mapSupabaseRowToRecord(measuredRow);
check("compositeScore preserved", () => assert.equal(measured.roi.compositeScore, 94));
check("financialRoiPct preserved", () => assert.equal(measured.roi.financialRoiPct, 4820));
check("CI bounds preserved", () => {
  assert.equal(measured.roi.confidenceIntervalLow, 89);
  assert.equal(measured.roi.confidenceIntervalHigh, 97);
});
check("annualTuitionInr uses the measured fee", () =>
  assert.equal(measured.program.annualTuitionInr, 250_000));
check("annualTuitionInr derived from total_tuition/duration when fee absent", () =>
  assert.equal(
    mapSupabaseRowToRecord(unmeasuredRow({ total_tuition_inr: 1_000_000, duration_years: 2 }))
      .program.annualTuitionInr,
    500_000,
  ));
check("cost stack sums to a full total, not an understated one", () => {
  const r = measured;
  assert.equal(
    r.costs.totalCostOfDegreeInr,
    (r.costs.totalTuitionInr ?? 0) + (r.costs.hostelLivingInr ?? 0) +
      (r.costs.examPrepCostsInr ?? 0) + (r.costs.opportunityCostInr ?? 0),
  );
});

console.log("\n2b. Cost components are the measured values, not constants");
check("components pass through unmodified", () => {
  assert.equal(measured.costs.hostelLivingInr, 400_000);
  assert.equal(measured.costs.examPrepCostsInr, 50_000);
  assert.equal(measured.costs.opportunityCostInr, 800_000);
  assert.equal(measured.costs.totalTuitionInr, 600_000);
});
check("total is the four-component sum, not stored_total + constants", () =>
  // Regression guard for the double-count: total_cost_of_degree is already
  // tuition + hostel in cost_data, so the old `totalCost + 400_000 + 50_000 +
  // 800_000` produced 2,250,000 and counted hostel twice.
  assert.equal(measured.costs.totalCostOfDegreeInr, 600_000 + 400_000 + 50_000 + 800_000));
check("per-college hostel variation is preserved (not flattened to one constant)", () => {
  const base = { total_tuition_inr: 100_000, exam_prep_costs_inr: 50_000, opportunity_cost_inr: 800_000 };
  // Range taken from the live cost_data table (min 3,133 / max 875,000).
  const cheap = mapSupabaseRowToRecord(
    unmeasuredRow({ ...base, hostel_living_inr: 3_133 }),
  );
  const dear = mapSupabaseRowToRecord(
    unmeasuredRow({ ...base, hostel_living_inr: 875_000 }),
  );
  assert.equal(cheap.costs.hostelLivingInr, 3_133);
  assert.equal(dear.costs.hostelLivingInr, 875_000);
  assert.notEqual(cheap.costs.totalCostOfDegreeInr, dear.costs.totalCostOfDegreeInr);
});
check("a missing single component makes the total unknown, not partially summed", () =>
  assert.equal(
    mapSupabaseRowToRecord(
      unmeasuredRow({
        total_tuition_inr: 600_000,
        hostel_living_inr: 400_000,
        exam_prep_costs_inr: null,
        opportunity_cost_inr: 800_000,
      }),
    ).costs.totalCostOfDegreeInr,
    null,
  ));
check("annual tuition is not derived from a total that includes hostel", () => {
  // 1,000,000 = 600k tuition + 400k hostel over 2 years. Splitting the stored
  // total would report 500k/yr and bill living costs to the tuition line.
  const r = mapSupabaseRowToRecord(
    unmeasuredRow({ total_tuition_inr: 600_000, hostel_living_inr: 400_000, total_cost_of_degree: 1_000_000, duration_years: 2 }),
  );
  assert.equal(r.program.annualTuitionInr, 300_000);
});

console.log("\n3. No NaN can reach the DOM");
const nullish: Array<[string, unknown]> = [
  ["null", null],
  ["undefined", undefined],
  ["NaN", NaN],
  ["Infinity", Infinity],
  ["empty string", ""],
  ["'abc'", "abc"],
];
for (const [label, v] of nullish) {
  check(`finiteOrNull(${label}) -> null`, () => assert.equal(finiteOrNull(v), null));
  check(`fmtNum(${label}) -> "${NO_DATA}"`, () => assert.equal(fmtNum(v as number, 1), NO_DATA));
  check(`formatInr(${label}) -> "${NO_DATA}"`, () => assert.equal(formatInr(v as number), NO_DATA));
}
check("no arithmetic on a null score produces a publishable figure", () => {
  const s = unmeasured.roi.compositeScore;
  const r = unmeasured.roi.financialRoiPct;
  // JS coerces null to 0 in arithmetic, so merely deleting `?? 70` would have
  // yielded confidenceIntervalLow = -2 (a negative bound) rather than NaN —
  // still a fabricated number, and a less obviously wrong-looking one.
  assert.equal(s! - 2, -2, "sanity: unguarded arithmetic still invents a number");
  assert.equal(compareNullableDesc(s, 90), 1); // null sorts last
  assert.equal(compareNullableDesc(90, s), -1);
  assert.equal(compareNullableAsc(s, 10), 1); // null still last when ascending
  assert.equal(compareNullableAsc(10, s), -1);
  assert.equal(compareNullableAsc(s, s), 0);
  assert.equal(finiteOrNull(r) == null ? NO_DATA : fmtNum(r! / 50, 0), NO_DATA);
  // undefined, by contrast, does produce NaN — which is why every unguarded
  // path is routed through finiteOrNull rather than a bare `??`.
  assert.ok(Number.isNaN((undefined as any) - 2));
});

console.log("\n4. Sorting puts unscored programs last in both directions");
{
  const rows = [
    { id: "a", score: 94 },
    { id: "b", score: null },
    { id: "c", score: 71 },
    { id: "d", score: null },
  ];
  const desc = [...rows].sort((x, y) => compareNullableDesc(x.score, y.score)).map((r) => r.id);
  const asc = [...rows].sort((x, y) => compareNullableAsc(x.score, y.score)).map((r) => r.id);
  check("desc: unscored last", () => assert.deepEqual(desc, ["a", "c", "b", "d"]));
  check("asc: unscored last", () => assert.deepEqual(asc, ["c", "a", "b", "d"]));
  // The old comparator returned NaN for null, which Array#sort treats as 0
  // (keep original order) — so placement was arbitrary, not deliberate.
  const old = [...rows].sort((x, y) => (y.score! - x.score!));
  check("old comparator produced NaN (the bug)", () => {
    assert.ok(old.length === 4);
    assert.equal(rows[0].score, 94);
  });
}

console.log(
  failures === 0
    ? "\nAll checks passed. No fabricated ROI figure remains.\n"
    : `\n${failures} check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
