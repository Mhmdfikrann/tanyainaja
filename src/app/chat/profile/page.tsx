import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { getAuthSession } from "@/lib/auth";
import { getUsageLeaderboard, getUserUsageSummary } from "@/lib/usage";

export default async function ProfilePage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [usageSummary, leaderboard] = await Promise.all([
    getUserUsageSummary(session.user.id),
    getUsageLeaderboard(),
  ]);

  const activeLeaderboard = leaderboard.filter((user) => user.totalRequests > 0 || user.totalTokens > 0);
  const topUsers = activeLeaderboard.slice(0, 10);
  const currentUserEntry = activeLeaderboard.find((user) => user.userId === session.user.id);
  const currentUserRank =
    usageSummary.totalRequests === 0 && usageSummary.totalTokens === 0
      ? null
      : currentUserEntry
        ? {
            rank: currentUserEntry.rank,
            totalRequests: currentUserEntry.totalRequests,
            totalTokens: currentUserEntry.totalTokens,
          }
        : null;

  return (
    <ProfileForm
      defaultAvatarUrl={session.user.image ?? null}
      defaultName={session.user.name ?? ""}
      currentUserRank={currentUserRank}
      topUsers={topUsers}
      usageSummary={usageSummary}
    />
  );
}
