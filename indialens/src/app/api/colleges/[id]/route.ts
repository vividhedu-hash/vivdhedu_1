import { NextResponse } from "next/server";
import { fetchCollegeById } from "../../../../lib/live-colleges";
import { unavailablePayload } from "../../../../lib/backend";

/**
 * Single-programme endpoint.
 *
 * 404 and 503 are deliberately different statuses here, and collapsing them
 * was the pre-existing bug: the old helper returned `null` for both "this id
 * is not in the index" and "the index did not answer", so a dead database
 * produced a confident 404. A 404 is a factual claim about the catalogue — it
 * tells a user, and a crawler, that this programme does not exist. Sending that
 * for an outage is how pages get de-indexed.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const found = await fetchCollegeById(params.id);

  if (found.source === "unavailable") {
    return NextResponse.json(unavailablePayload(found.reason), { status: 503 });
  }

  if (!found.record) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }
  return NextResponse.json({ ...found.record, _source: found.source });
}
