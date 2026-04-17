import { notFound } from "next/navigation";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { getAuthSession } from "@/lib/auth";
import { getConversationDetail } from "@/lib/conversations";

export default async function ChatDetailPage({ params }: PageProps<"/chat/[id]">) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    notFound();
  }

  const { id } = await params;
  const detail = await getConversationDetail(id, session.user.id);

  if (!detail) {
    notFound();
  }

  return (
    <ChatWorkspace
      conversationId={detail.conversation.id}
      initialMessages={detail.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        attachments: Array.isArray(message.attachments) ? (message.attachments as never[]) : [],
        createdAt: message.createdAt,
      }))}
      initialLoading={false}
      userName={session.user.name ?? session.user.email ?? "User"}
    />
  );
}
