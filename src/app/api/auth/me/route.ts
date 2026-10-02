import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { errorResponse, readJson } from "@/lib/http";
import { decryptText } from "@/modules/auth/crypto";
import { requireUser } from "@/modules/auth/require-user";
import { isSupportedLang } from "@/modules/translation/langs";
import { recordAudit } from "@/server/audit/log";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const primary = await prisma.contactChannel.findFirst({
      where: { userId: user.id, isPrimary: true, verifiedAt: { not: null } },
    });
    return NextResponse.json({
      user: {
        id: user.id,
        displayName: user.displayName,
        globalRole: user.globalRole,
        preferredLang: user.preferredLang,
        uiLang: user.uiLang,
        // The user's own primary email is visible only to that user.
        email: primary ? decryptText(primary.valueEnc) : null,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// REQ-TR-01: language preferences are stored per account; UI language and
// receiving language are separate fields.
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await readJson(req);
    const data: { preferredLang?: string; uiLang?: string } = {};
    for (const field of ["preferredLang", "uiLang"] as const) {
      const value = body[field];
      if (value === undefined || value === null) continue;
      if (!isSupportedLang(value)) throw new ApiError(400, "invalid_lang");
      data[field] = value;
    }
    if (Object.keys(data).length === 0) throw new ApiError(400, "no_fields");
    const updated = await prisma.user.update({ where: { id: user.id }, data });
    await recordAudit(prisma, {
      actorId: user.id,
      action: "user.lang_update",
      result: "success",
      targetType: "user",
      targetId: user.id,
      meta: {
        ...(data.preferredLang ? { preferredLang: data.preferredLang } : {}),
        ...(data.uiLang ? { uiLang: data.uiLang } : {}),
      },
    });
    return NextResponse.json({
      user: {
        id: updated.id,
        displayName: updated.displayName,
        globalRole: updated.globalRole,
        preferredLang: updated.preferredLang,
        uiLang: updated.uiLang,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
