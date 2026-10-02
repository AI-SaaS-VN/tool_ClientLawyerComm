import type { NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { downloadFile } from "@/modules/files/service";

export const dynamic = "force-dynamic";

// REQ-FILE-06: server-authorized proxy download. Authorization is
// re-validated inside downloadFile on every request; no direct object URLs
// exist, so revocation denies the very next call.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const result = await downloadFile(id, user);
    return new Response(new Uint8Array(result.data), {
      status: 200,
      headers: {
        "content-type": result.mime,
        "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.name)}`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
