import { SuperadminDashboard } from "@/components/superadmin/superadmin-dashboard";
import { SuperadminLoginForm } from "@/components/superadmin/superadmin-login-form";
import { getAuthSession } from "@/lib/auth";
import { getGlobalUsageSummary, getUsageLeaderboard } from "@/lib/usage";

export const dynamic = "force-dynamic";

export default async function SuperadminPage() {
  const session = await getAuthSession();

  if (session?.user?.role === "superadmin") {
    const [summary, leaderboard] = await Promise.all([
      getGlobalUsageSummary(),
      getUsageLeaderboard(),
    ]);

    return (
      <SuperadminDashboard
        leaderboard={leaderboard}
        totalRequests={summary.totalRequests}
        totalTokens={summary.totalTokens}
        totalUsers={summary.totalUsers}
      />
    );
  }

  return <SuperadminLoginForm hasUserSession={Boolean(session?.user?.id)} />;
}
