"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Camera, BarChart3, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

type UsageSummary = {
  totalRequests: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
};

type TopUsageUser = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalRequests: number;
  totalTokens: number;
};

type CurrentUserRank = {
  rank: number;
  totalRequests: number;
  totalTokens: number;
} | null;

const numberFormatter = new Intl.NumberFormat("id-ID");

export function ProfileForm({
  currentUserRank,
  defaultAvatarUrl,
  defaultName,
  topUsers,
  usageSummary,
}: {
  currentUserRank: CurrentUserRank;
  defaultAvatarUrl: string | null;
  defaultName: string;
  topUsers: TopUsageUser[];
  usageSummary: UsageSummary;
}) {
  const router = useRouter();
  const { update } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "usage">("profile");
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);

  const displayName = defaultName || "User";
  const initial = displayName.charAt(0).toUpperCase() || "U";

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    event.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast.error("Foto profil harus berupa gambar.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto profil maksimal 5MB.");
      return;
    }

    if (pendingAvatarPreview) {
      URL.revokeObjectURL(pendingAvatarPreview);
    }

    setPendingAvatarFile(file);
    setPendingAvatarPreview(URL.createObjectURL(file));
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
  }

  function closeCropper() {
    if (pendingAvatarPreview) {
      URL.revokeObjectURL(pendingAvatarPreview);
    }

    setPendingAvatarFile(null);
    setPendingAvatarPreview(null);
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
  }

  async function createCroppedAvatarFile(file: File) {
    const imageUrl = pendingAvatarPreview ?? URL.createObjectURL(file);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Gagal memuat preview foto"));
      element.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas browser tidak tersedia");
    }

    const minSide = Math.min(image.naturalWidth, image.naturalHeight);
    const cropSize = minSide / cropZoom;
    const maxOffsetX = (image.naturalWidth - cropSize) / 2;
    const maxOffsetY = (image.naturalHeight - cropSize) / 2;
    const sourceX = clamp((image.naturalWidth - cropSize) / 2 + (cropX / 100) * maxOffsetX, 0, image.naturalWidth - cropSize);
    const sourceY = clamp((image.naturalHeight - cropSize) / 2 + (cropY / 100) * maxOffsetY, 0, image.naturalHeight - cropSize);

    context.drawImage(
      image,
      sourceX,
      sourceY,
      cropSize,
      cropSize,
      0,
      0,
      outputSize,
      outputSize,
    );

    const outputType = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, 0.92);
    });

    if (!blob) {
      throw new Error("Gagal membuat hasil crop foto");
    }

    const extension = outputType === "image/png" ? ".png" : outputType === "image/webp" ? ".webp" : ".jpg";
    return new File([blob], `avatar${extension}`, { type: outputType });
  }

  async function handleUploadCroppedAvatar() {
    if (!pendingAvatarFile) {
      return;
    }

    try {
      setUploadingAvatar(true);
      const croppedFile = await createCroppedAvatarFile(pendingAvatarFile);
      const formData = new FormData();
      formData.append("file", croppedFile);

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error ?? "Gagal upload foto profil");
        return;
      }

      setAvatarUrl(payload.avatarUrl ?? null);
      await update({
        name: displayName,
        image: payload.avatarUrl ?? null,
      });
      router.refresh();
      closeCropper();
      toast.success("Foto profil berhasil diperbarui");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memproses foto profil");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      setLoggingOut(false);
      toast.error(error instanceof Error ? error.message : "Logout gagal");
    }
  }

  return (
    <div className="app-scrollbar h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Card className="p-6 text-[color:var(--color-foreground)] sm:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[color:var(--color-primary)]">Profil</p>
            <h1 className="mt-2 text-3xl font-semibold">Pengaturan akun</h1>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted-foreground)]">
              Kelola nama tampilan, foto akun, dan pantau penggunaan token per user.
            </p>
          </div>

          <div className="inline-flex rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-muted)] p-1">
            <button
              className={[
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                activeTab === "profile"
                  ? "bg-[color:var(--color-primary)] text-white"
                  : "text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]",
              ].join(" ")}
              onClick={() => setActiveTab("profile")}
              type="button"
            >
              <UserRound className="h-4 w-4" />
              Profile
            </button>
            <button
              className={[
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                activeTab === "usage"
                  ? "bg-[color:var(--color-primary)] text-white"
                  : "text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]",
              ].join(" ")}
              onClick={() => setActiveTab("usage")}
              type="button"
            >
              <BarChart3 className="h-4 w-4" />
              Usage
            </button>
          </div>
        </div>

        {activeTab === "profile" ? (
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-muted)] p-5">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  {avatarUrl ? (
                    <Image
                      alt={`Foto profil ${displayName}`}
                      className="h-28 w-28 rounded-full object-cover"
                      height={112}
                      src={avatarUrl}
                      width={112}
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[color:var(--color-primary)] text-4xl font-semibold text-white">
                      {initial}
                    </div>
                  )}

                  <button
                    className="absolute bottom-1 right-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#191b24] text-white transition hover:brightness-110"
                    disabled={uploadingAvatar || loggingOut}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <input
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(event) => void handleAvatarChange(event)}
                  ref={fileInputRef}
                  type="file"
                />

                <h2 className="mt-4 text-lg font-semibold">{displayName}</h2>
                <p className="mt-1 text-xs leading-6 text-[color:var(--color-muted-foreground)]">
                  Upload foto profil JPG, PNG, atau WEBP. Maksimal 5MB.
                </p>

                <Button
                  className="mt-4 w-full"
                  disabled={uploadingAvatar || loggingOut}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  variant="outline"
                >
                  {uploadingAvatar ? "Mengupload..." : "Upload foto profil"}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <FormField label="Nama Tampilan">
                <Input disabled readOnly value={displayName} />
              </FormField>

              <div className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-4 py-4">
                <p className="text-sm font-medium text-[color:var(--color-foreground)]">Nama akun tidak bisa diubah</p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
                  Saat ini hanya foto profil yang bisa diganti dari halaman ini. Setelah pilih foto, kamu bisa preview dan crop dulu sebelum upload.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  disabled={uploadingAvatar || loggingOut}
                  onClick={() => void handleLogout()}
                  type="button"
                  variant="outline"
                >
                  {loggingOut ? "Keluar..." : "Logout"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <UsageStatCard label="Total Request" value={numberFormatter.format(usageSummary.totalRequests)} />
              <UsageStatCard label="Total Token" value={numberFormatter.format(usageSummary.totalTokens)} />
              <UsageStatCard
                label="Prompt / Completion"
                value={`${numberFormatter.format(usageSummary.promptTokens)} / ${numberFormatter.format(usageSummary.completionTokens)}`}
              />
            </div>

            <div className="rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-muted)] p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Top 10 user pengguna token terbanyak</h2>
                <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
                  Ranking berdasarkan total token yang sudah dipakai di semua request AI.
                </p>
              </div>

              <div className="space-y-3">
                {topUsers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] px-4 py-6 text-sm text-[color:var(--color-muted-foreground)]">
                    Belum ada data penggunaan token.
                  </div>
                ) : (
                  topUsers.map((user, index) => (
                    <div
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-4 py-3"
                      key={user.userId}
                    >
                      <div className="w-8 text-sm font-semibold text-[color:var(--color-muted-foreground)]">
                        #{index + 1}
                      </div>

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
                          <p className="truncate font-medium">{user.name}</p>
                          <p className="text-xs text-[color:var(--color-muted-foreground)]">
                            {numberFormatter.format(user.totalRequests)} request
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">{numberFormatter.format(user.totalTokens)}</p>
                        <p className="text-xs text-[color:var(--color-muted-foreground)]">token</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-muted)] p-5 sm:p-6">
              <div className="mb-2">
                <h2 className="text-lg font-semibold">Ranking kamu saat ini</h2>
                <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
                  Posisi akun kamu berdasarkan total token yang sudah dipakai.
                </p>
              </div>

              {currentUserRank ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <UsageStatCard label="Peringkat" value={`#${numberFormatter.format(currentUserRank.rank)}`} />
                  <UsageStatCard label="Request Kamu" value={numberFormatter.format(currentUserRank.totalRequests)} />
                  <UsageStatCard label="Token Kamu" value={numberFormatter.format(currentUserRank.totalTokens)} />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] px-4 py-6 text-sm text-[color:var(--color-muted-foreground)]">
                  Kamu belum punya usage AI, jadi ranking belum tersedia.
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {pendingAvatarPreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-xl rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-panel)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[color:var(--color-foreground)]">Preview foto profil</h2>
                <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
                  Atur crop dulu sebelum foto diupload.
                </p>
              </div>
              <button
                className="rounded-full border border-[color:var(--color-border)] p-2 text-[color:var(--color-muted-foreground)] transition hover:bg-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                disabled={uploadingAvatar}
                onClick={closeCropper}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mx-auto flex w-full max-w-[260px] flex-col items-center gap-5">
              <div className="relative h-[260px] w-[260px] overflow-hidden rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-muted)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Preview crop foto profil"
                  className="h-full w-full object-cover"
                  src={pendingAvatarPreview}
                  style={{
                    objectPosition: `${50 + cropX / 2}% ${50 + cropY / 2}%`,
                    transform: `scale(${cropZoom})`,
                    transformOrigin: "center center",
                  }}
                />
              </div>

              <div className="w-full space-y-4">
                <RangeField
                  label={`Zoom ${cropZoom.toFixed(1)}x`}
                  max={2.5}
                  min={1}
                  onChange={(value) => setCropZoom(Number(value))}
                  step={0.1}
                  value={cropZoom}
                />
                <RangeField
                  label={`Geser horizontal ${cropX}`}
                  max={100}
                  min={-100}
                  onChange={(value) => setCropX(Number(value))}
                  step={1}
                  value={cropX}
                />
                <RangeField
                  label={`Geser vertikal ${cropY}`}
                  max={100}
                  min={-100}
                  onChange={(value) => setCropY(Number(value))}
                  step={1}
                  value={cropY}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button disabled={uploadingAvatar} onClick={closeCropper} type="button" variant="outline">
                Batal
              </Button>
              <Button disabled={uploadingAvatar} onClick={() => void handleUploadCroppedAvatar()} type="button">
                {uploadingAvatar ? "Mengupload..." : "Simpan foto profil"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}

function UsageStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-muted)] p-5">
      <p className="text-sm text-[color:var(--color-muted-foreground)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[color:var(--color-foreground)]">{value}</p>
    </div>
  );
}

function RangeField({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: string) => void;
  step: number;
  value: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[color:var(--color-foreground)]">{label}</span>
      <input
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[color:var(--color-border)] accent-[color:var(--color-primary)]"
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
