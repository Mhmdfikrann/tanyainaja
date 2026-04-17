import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { getAuthSession } from "@/lib/auth";
import { getCurrentUserUsageRank, getTopUsageUsers, getUserUsageSummary } from "@/lib/usage";

export default async function ProfilePage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [usageSummary, topUsers, currentUserRank] = await Promise.all([
    getUserUsageSummary(session.user.id),
    getTopUsageUsers(10),
    getCurrentUserUsageRank(session.user.id),
  ]);

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
