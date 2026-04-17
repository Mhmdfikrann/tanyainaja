import { ProfileForm } from "@/components/profile/profile-form";
import { getAuthSession } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await getAuthSession();

  return <ProfileForm defaultName={session?.user?.name ?? ""} />;
}
