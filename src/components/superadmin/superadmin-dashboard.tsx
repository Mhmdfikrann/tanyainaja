"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";

type LeaderboardUser = {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalRequests: number;
  totalTokens: number;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

export function SuperadminDashboard({
  leaderboard,
  totalRequests,
  totalTokens,
  totalUsers,
}: {
  leaderboard: LeaderboardUser[];
  totalRequests: number;
  totalTokens: number;
  totalUsers: number;
}) {
  return (
    <main className="app-scrollbar min-h-screen overflow-y-auto bg-[color:var(--color-background)] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 text-[color:var(--color-foreground)] sm:p-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[color:var(--color-primary)]">Superadmin</p>
            <h1 className="mt-2 text-3xl font-semibold">Dashboard global</h1>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted-foreground)]">
              Ringkasan semua penggunaan AI di seluruh user TanyainAja.
            </p>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Total Token" value={numberFormatter.format(totalTokens)} />
          <SummaryCard label="Total Request" value={numberFormatter.format(totalRequests)} />
          <SummaryCard label="Total User" value={numberFormatter.format(totalUsers)} />
        </div>

        <Card className="p-6 sm:p-8">
          <div className="mb-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[color:var(--color-primary)]">Ranking</p>
            <h2 className="mt-2 text-2xl font-semibold">Penggunaan maksimal semua user</h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted-foreground)]">
              Diurutkan dari user dengan total token terbesar ke yang lebih kecil.
            </p>
          </div>

          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] px-4 py-6 text-sm text-[color:var(--color-muted-foreground)]">
                Belum ada data usage AI.
              </div>
            ) : (
              leaderboard.map((user) => (
                <div
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-4 py-3"
                  key={user.userId}
                >
                  <div className="w-8 text-sm font-semibold text-[color:var(--color-muted-foreground)]">#{user.rank}</div>

                  <div className="flex min-w-0 items-center gap-3">
                    {user.avatarUrl ? (
                      <Image
                        alt={`Foto profil ${user.name}`}
                        className="h-10 w-10 rounded-full object-cover"
                        height={40}
                        src={user.avatarUrl}
                        width={40}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-primary)] text-sm font-semibold text-white">
                        {user.name.trim().charAt(0).toUpperCase() || "U"}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate font-medium text-[color:var(--color-foreground)]">{user.name}</p>
                      <p className="text-xs text-[color:var(--color-muted-foreground)]">
                        {numberFormatter.format(user.totalRequests)} request
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-[color:var(--color-foreground)]">{numberFormatter.format(user.totalTokens)}</p>
                    <p className="text-xs text-[color:var(--color-muted-foreground)]">token</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-6">
      <p className="text-sm text-[color:var(--color-muted-foreground)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[color:var(--color-foreground)]">{value}</p>
    </Card>
  );
}
