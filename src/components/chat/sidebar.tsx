"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDateLabel } from "@/lib/utils";

type ConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export function Sidebar({
  userAvatarUrl,
  userName,
}: {
  userAvatarUrl: string | null;
  userName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const activeId = useMemo(() => pathname?.split("/")[2], [pathname]);
  const onProfilePage = pathname === "/chat/profile";

  async function fetchConversations() {
    setLoading(true);

    try {
      const response = await fetch("/api/conversations", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error ?? "Gagal memuat riwayat");
        return;
      }

      setConversations(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat riwayat");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchConversations();
  }, [pathname]);

  async function createConversation() {
    router.push("/chat");
    setCollapsed(false);
    setMobileOpen(false);
  }

  async function removeConversation(id: string) {
    const approved = window.confirm("Hapus percakapan ini?");

    if (!approved) {
      return;
    }

    const response = await fetch(`/api/conversations/${id}`, {
      method: "DELETE",
    });
    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error ?? "Gagal menghapus percakapan");
      return;
    }

    const next = conversations.filter((item) => item.id !== id);
    setConversations(next);

    if (activeId === id) {
      if (next[0]) {
        router.push(`/chat/${next[0].id}`);
      } else {
        await createConversation();
      }
    }
  }

  const actionItemBase =
    "flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-[#e7dddd] transition hover:bg-white/10";
  const userInitial = userName.trim().charAt(0).toUpperCase() || "U";

  const fullPanel = (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-4 pt-4 lg:pb-2">
        <div className="flex items-center justify-start lg:justify-between">
          <Image
            alt="Logo TanyainAja"
            className="h-6 w-6 object-contain"
            height={24}
            src="/logo-tanyainaja.png"
            width={24}
          />
          <button
            aria-label="Collapse sidebar"
            className="hidden rounded-lg p-1.5 text-[#b8a7a7] transition hover:bg-white/10 hover:text-[#f3ebeb] lg:inline-flex"
            onClick={() => setCollapsed(true)}
            type="button"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-1 px-2 pt-2 lg:pt-3">
        <button className={`${actionItemBase} bg-white/10`} onClick={() => void createConversation()} type="button">
          <MessageSquarePlus className="h-4 w-4 shrink-0" />
          New chat
        </button>
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col px-2">
        <p className="px-2 pb-2 text-xs font-medium uppercase tracking-[0.14em] text-[#9f8d8d]">Recents</p>
        <div className="app-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto pb-24 lg:pb-3">
          {loading ? (
            <div className="space-y-2 px-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-9 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="mx-2 rounded-lg border border-dashed border-white/15 bg-white/5 px-3 py-3 text-xs text-[#b8aaaa]">
              Belum ada percakapan
            </div>
          ) : (
            conversations.map((conversation) => {
              const active = conversation.id === activeId;
              return (
                <div
                  key={conversation.id}
                  className={[
                    "group flex items-start gap-2 rounded-lg px-2 py-2 transition",
                    active ? "bg-[color:var(--color-primary-soft)]" : "hover:bg-white/10",
                  ].join(" ")}
                >
                  <Link className="min-w-0 flex-1" href={`/chat/${conversation.id}`} onClick={() => setMobileOpen(false)}>
                    <p className="truncate text-sm text-[#f3eaea]">{conversation.title}</p>
                    <p className="truncate pt-0.5 text-[11px] text-[#9f8d8d]">{formatDateLabel(conversation.updatedAt)}</p>
                  </Link>
                  <button
                    aria-label={`Hapus percakapan ${conversation.title}`}
                    className="rounded-md p-1 text-[#9f8f8f] opacity-100 transition hover:bg-white/10 hover:text-[#f3ebeb] lg:opacity-0 lg:group-hover:opacity-100"
                    onClick={() => void removeConversation(conversation.id)}
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="border-t border-white/10 p-2">
        <Link
          className={[
            "flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-white/10",
            onProfilePage ? "bg-[color:var(--color-primary-soft)]" : "",
          ].join(" ")}
          href="/chat/profile"
          onClick={() => setMobileOpen(false)}
        >
          {userAvatarUrl ? (
            <Image
              alt={`Foto profil ${userName}`}
              className="h-7 w-7 rounded-full object-cover"
              height={28}
              src={userAvatarUrl}
              width={28}
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--color-primary)] text-xs font-semibold text-white">
              {userInitial}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm text-[#f2e8e8]">{userName}</p>
            <p className="text-[11px] text-[#9f8d8d]">TanyainAja</p>
          </div>
        </Link>
      </div>
    </div>
  );

  const collapsedPanel = (
    <div className="group flex h-full flex-col items-center justify-between py-3">
      <div className="flex w-full flex-col items-center gap-2 px-2">
        <button
          aria-label="Expand sidebar"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#c5b6b6] transition hover:bg-white/10 hover:text-[#f3ebeb]"
          onClick={() => setCollapsed(false)}
          type="button"
        >
          <Image
            alt="Logo TanyainAja"
            className="h-5 w-5 object-contain opacity-100 transition-opacity duration-150 group-hover:opacity-0"
            height={20}
            src="/logo-tanyainaja.png"
            width={20}
          />
          <PanelLeftOpen className="absolute h-5 w-5 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
        </button>

        <button
          aria-label="Buat chat baru"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#e9dede] transition hover:bg-white/10"
          onClick={() => void createConversation()}
          type="button"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </button>

      </div>

      <Link
        aria-label="Buka halaman profile"
        className={[
          "flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[color:var(--color-primary)] text-xs font-semibold text-white transition hover:brightness-110",
          onProfilePage ? "ring-2 ring-[color:var(--color-primary-soft)] ring-offset-2 ring-offset-[#121318]" : "",
        ].join(" ")}
        href="/chat/profile"
        onClick={() => setMobileOpen(false)}
      >
        {userAvatarUrl ? (
          <Image
            alt={`Foto profil ${userName}`}
            className="h-full w-full object-cover"
            height={32}
            src={userAvatarUrl}
            width={32}
          />
        ) : userInitial}
      </Link>
    </div>
  );

  return (
    <>
      <button
        aria-controls="mobile-chat-drawer"
        aria-expanded={mobileOpen}
        className={[
          "fixed left-3 top-3 z-20 lg:hidden",
          mobileOpen ? "hidden" : "block",
        ].join(" ")}
        onClick={() => setMobileOpen((value) => !value)}
        type="button"
      >
        <span className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#18191f] text-[#f3eeee] shadow-lg">
            <Menu className="h-5 w-5" />
          </span>
          <span className="rounded-xl border border-white/15 bg-[#18191f] px-3 py-2 text-base font-bold tracking-[0.01em] text-[#f3ebeb] shadow-lg">
            TanyainAja
          </span>
        </span>
      </button>

      <aside
        className={[
          "hidden h-screen border-r border-white/10 bg-[#121318] transition-[width] duration-200 lg:block",
          collapsed ? "w-[64px]" : "w-[260px]",
        ].join(" ")}
      >
        {collapsed ? collapsedPanel : fullPanel}
      </aside>

      {mobileOpen ? (
        <div id="mobile-chat-drawer" className="fixed inset-0 z-30 lg:hidden">
          <button
            aria-label="Tutup sidebar"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <div className="absolute inset-y-0 left-0 w-[min(86vw,300px)] border-r border-white/10 bg-[#121318]">
            <div className="h-full">{fullPanel}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
