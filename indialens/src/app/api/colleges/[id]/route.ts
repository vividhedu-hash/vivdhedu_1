import { NextResponse } from "next/server";
import { fetchCollegeById } from "../../../../lib/live-colleges";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const found = await fetchCollegeById(params.id);
  if (!found) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  return NextResponse.json({ ...found.record, _source: found.source });
}
