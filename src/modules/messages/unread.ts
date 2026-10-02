import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

// REQ-MSG-07: per-case, per-recipient unread counts of published messages
// from other members; the count is only ever returned to its owner.
export async function getUnreadCount(caseId: string, userId: string): Promise<number> {
  const member = await prisma.caseMember.findUnique({
    where: { caseId_userId: { caseId, userId } },
  });
  if (!member) return 0;

  let afterCursor: Prisma.MessageWhereInput = {};
  if (member.lastReadMessageId) {
    const lastRead = await prisma.message.findUnique({
      where: { id: member.lastReadMessageId },
    });
    if (lastRead?.publishedAt) {
      afterCursor = {
        OR: [
          { publishedAt: { gt: lastRead.publishedAt } },
          { publishedAt: lastRead.publishedAt, id: { gt: lastRead.id } },
        ],
      };
    }
  }
  return prisma.message.count({
    where: { caseId, status: "published", authorId: { not: userId }, ...afterCursor },
  });
}
