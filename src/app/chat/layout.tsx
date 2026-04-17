import type { ReactNode } from "react";
import { Sidebar } from "@/components/chat/sidebar";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-[#101114] text-[#f6f1f1]">
      <Sidebar />
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
