import { redirect } from "next/navigation";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { getAuthSession } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function ChatIndexPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <ChatWorkspace
      aiModel={env.aiModel}
      aiVisionMaxImageMb={env.aiVisionMaxImageMb}
      aiSupportsVision={env.aiSupportsVision}
      conversationId={null}
      initialMessages={[]}
      initialLoading={false}
      userName={session.user.name ?? session.user.email ?? "User"}
    />
  );
}
