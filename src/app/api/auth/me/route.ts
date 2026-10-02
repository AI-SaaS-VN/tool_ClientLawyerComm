import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { decryptText } from "@/modules/auth/crypto";
import { requireUser } from "@/modules/auth/require-user";

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
