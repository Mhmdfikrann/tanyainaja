import type { ReactNode } from "react";
import { getAuthSession } from "@/lib/auth";
import { Sidebar } from "@/components/chat/sidebar";

export default async function ChatLayout({ children }: { children: ReactNode }) {
  const session = await getAuthSession();

  return (
    <div className="flex h-dvh overflow-hidden bg-[#101114] text-[#f6f1f1]">
      <Sidebar
        userAvatarUrl={session?.user?.image ?? null}
        userName={session?.user?.name ?? session?.user?.email ?? "User"}
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
