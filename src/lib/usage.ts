import { randomUUID } from "node:crypto";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { aiUsageEvents, users } from "@/db/schema";

type UsageInput = {
  userId: string;
  conversationId?: string | null;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export async function trackAiUsage({
  userId,
  conversationId = null,
  model,
  promptTokens = 0,
  completionTokens = 0,
  totalTokens = 0,
}: UsageInput) {
  await db.insert(aiUsageEvents).values({
    id: randomUUID(),
    userId,
    conversationId,
    model,
    promptTokens,
    completionTokens,
    totalTokens,
    createdAt: new Date(),
  });
}

export async function getUserUsageSummary(userId: string) {
  const [summary] = await db
    .select({
      totalRequests: count(aiUsageEvents.id),
      totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens}), 0)`,
      promptTokens: sql<number>`coalesce(sum(${aiUsageEvents.promptTokens}), 0)`,
      completionTokens: sql<number>`coalesce(sum(${aiUsageEvents.completionTokens}), 0)`,
    })
    .from(aiUsageEvents)
    .where(eq(aiUsageEvents.userId, userId));

  return {
    totalRequests: Number(summary?.totalRequests ?? 0),
    totalTokens: Number(summary?.totalTokens ?? 0),
    promptTokens: Number(summary?.promptTokens ?? 0),
    completionTokens: Number(summary?.completionTokens ?? 0),
  };
}

export async function getTopUsageUsers(limit = 10) {
  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      totalRequests: count(aiUsageEvents.id),
      totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens}), 0)`,
    })
    .from(aiUsageEvents)
    .innerJoin(users, eq(aiUsageEvents.userId, users.id))
    .groupBy(users.id, users.name, users.avatarUrl)
    .orderBy(desc(sql`coalesce(sum(${aiUsageEvents.totalTokens}), 0)`), desc(count(aiUsageEvents.id)))
    .limit(limit);

  return rows.map((row) => ({
    userId: row.userId,
    name: row.name,
    avatarUrl: row.avatarUrl,
    totalRequests: Number(row.totalRequests ?? 0),
    totalTokens: Number(row.totalTokens ?? 0),
  }));
}

export async function getCurrentUserUsageRank(userId: string) {
  const [currentUser] = await db
    .select({
      totalRequests: count(aiUsageEvents.id),
      totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens}), 0)`,
    })
    .from(aiUsageEvents)
    .where(eq(aiUsageEvents.userId, userId));

  const totalRequests = Number(currentUser?.totalRequests ?? 0);
  const totalTokens = Number(currentUser?.totalTokens ?? 0);

  if (totalRequests === 0 && totalTokens === 0) {
    return null;
  }

  const rankRows = await db.execute(sql<{
    user_rank: number;
  }>`
    select
      1 + count(*) as user_rank
    from (
      select
        ${aiUsageEvents.userId} as user_id,
        coalesce(sum(${aiUsageEvents.totalTokens}), 0) as total_tokens,
        count(${aiUsageEvents.id}) as total_requests
      from ${aiUsageEvents}
      group by ${aiUsageEvents.userId}
    ) ranked
    where
      ranked.total_tokens > ${totalTokens}
      or (
        ranked.total_tokens = ${totalTokens}
        and ranked.total_requests > ${totalRequests}
      )
  `) as unknown as Array<{ user_rank?: number }>;

  return {
    rank: Number(rankRows[0]?.user_rank ?? 1),
    totalRequests,
    totalTokens,
  };
}

export async function getGlobalUsageSummary() {
  const [usageSummary, userSummary] = await Promise.all([
    db
      .select({
        totalRequests: count(aiUsageEvents.id),
        totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens}), 0)`,
      })
      .from(aiUsageEvents),
    db
      .select({
        totalUsers: count(users.id),
      })
      .from(users),
  ]);

  return {
    totalRequests: Number(usageSummary[0]?.totalRequests ?? 0),
    totalTokens: Number(usageSummary[0]?.totalTokens ?? 0),
    totalUsers: Number(userSummary[0]?.totalUsers ?? 0),
  };
}

export async function getUsageLeaderboard(limit?: number) {
  const query = db
    .select({
      userId: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      totalRequests: count(aiUsageEvents.id),
      totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens}), 0)`,
    })
    .from(users)
    .leftJoin(aiUsageEvents, eq(aiUsageEvents.userId, users.id))
    .groupBy(users.id, users.name, users.avatarUrl)
    .orderBy(desc(sql`coalesce(sum(${aiUsageEvents.totalTokens}), 0)`), desc(count(aiUsageEvents.id)));

  const rows = typeof limit === "number" ? await query.limit(limit) : await query;

  return rows.map((row, index) => ({
    rank: index + 1,
    userId: row.userId,
    name: row.name,
    avatarUrl: row.avatarUrl,
    totalRequests: Number(row.totalRequests ?? 0),
    totalTokens: Number(row.totalTokens ?? 0),
  }));
}
