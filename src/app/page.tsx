import Image from "next/image";
import Link from "next/link";
import { BarChart3, FileImage, MessageSquareText, ShieldCheck, TimerReset, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Workflow,
    title: "Context Per Chat",
    description: "Setiap chat punya memory sendiri. Konteks percakapan tetap fokus dan tidak tercampur dengan chat lain.",
  },
  {
    icon: FileImage,
    title: "Bisa Baca Gambar",
    description: "Upload gambar lalu minta AI menjelaskan isi visual, teks di gambar, dan konteks utamanya langsung dari chat yang sama.",
  },
  {
    icon: TimerReset,
    title: "Respons Real-time",
    description: "Jawaban tampil bertahap secara streaming supaya respons terasa cepat dan tidak menunggu full output selesai.",
  },
  {
    icon: ShieldCheck,
    title: "Login WhatsApp OTP",
    description: "Masuk dan daftar lewat verifikasi kode WhatsApp, jadi alur akses lebih cepat tanpa password manual.",
  },
  {
    icon: MessageSquareText,
    title: "Recent Lebih Bersih",
    description: "Chat baru hanya muncul di sidebar setelah kamu benar-benar mengirim pesan pertama.",
  },
  {
    icon: BarChart3,
    title: "Profile & Usage",
    description: "User bisa ganti foto profil, lihat total request, total token, ranking pribadi, dan top 10 user teraktif.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[color:var(--color-background)] px-4 pb-14 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="sticky top-4 z-10 rounded-full border border-[color:var(--color-border)] bg-black/40 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center">
              <Image
                alt="Logo TanyainAja"
                className="h-8 w-8 object-contain"
                height={32}
                src="/logo-tanyainaja.png"
                width={32}
              />
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Mulai Gratis</Button>
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-[#2f3442] bg-[linear-gradient(140deg,#0f131d_0%,#111826_55%,#16111a_100%)] p-8 sm:p-10">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex rounded-full border border-[#31394a] bg-black/35 px-4 py-2 text-sm font-medium text-[#f2cfd2]">
                AI Workspace Yang Sudah Dipakai Buat Kerja Harian
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-tight text-[#f6f7fa] sm:text-5xl">
                  Tanya, baca gambar, pantau usage, dan kelola chat dengan alur yang tetap rapi.
                </h1>
                <p className="max-w-xl text-base leading-8 text-[color:var(--color-muted-foreground)] sm:text-lg">
                  TanyainAja dibuat untuk kebutuhan operasional yang cepat: login via WhatsApp OTP, kirim pertanyaan teks atau gambar, lanjutkan chat penting, dan cek penggunaan token tiap user dari halaman profile.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">Coba Sekarang</Button>
                </Link>
                <a href="#fitur">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">Lihat Fitur</Button>
                </a>
              </div>

              <div className="grid gap-4 pt-2 sm:grid-cols-3">
                <Stat title="Login" value="WhatsApp OTP" />
                <Stat title="Vision" value="Baca Gambar" />
                <Stat title="Usage" value="Top 10 User" />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border-[#2f3442] bg-[#0d1118] p-6">
            <div className="flex h-full flex-col justify-between rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
                  <span>Preview Chat</span>
                  <span>Vision + Usage</span>
                </div>
                <div className="space-y-3">
                  <Bubble role="user">Tolong baca gambar ini dan jelaskan isi utamanya.</Bubble>
                  <Bubble role="assistant">
                    Saya baca dulu gambarnya, lalu saya jelaskan isi visual, teks yang terlihat, dan konteks yang paling relevan.
                  </Bubble>
                  <Bubble role="assistant">Di profile, kamu juga bisa lihat total request, total token, ranking kamu, dan user dengan penggunaan token tertinggi.</Bubble>
                </div>
              </div>
              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/30 p-4 text-sm text-white/75">
                Chat kosong tidak langsung masuk ke recent. Percakapan baru hanya tersimpan setelah pesan pertama benar-benar dikirim, jadi sidebar tetap bersih.
              </div>
            </div>
          </Card>
        </section>

        <section id="fitur" className="space-y-5 pt-4">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[color:var(--color-primary)]">Fitur Utama</p>
            <h2 className="text-3xl font-semibold text-[color:var(--color-foreground)]">Sesuai kebutuhan produk yang sekarang, bukan sekadar landing page generik</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary)]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-[color:var(--color-foreground)]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted-foreground)]">{description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="pt-4">
          <Card className="border-[#3a1017] bg-[linear-gradient(135deg,#7f0f18_0%,#3b0a13_100%)] px-8 py-10 text-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">Siap Jalan</p>
                <h2 className="text-3xl font-semibold">Daftar, verifikasi WhatsApp, kirim pesan pertama, lalu semua usage mulai tercatat.</h2>
                <p className="text-sm leading-7 text-white/80">
                  Begitu pesan pertama terkirim, chat akan masuk ke recent, AI mulai membangun konteks per chat, dan penggunaan token user ikut tercatat di halaman profile.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-[#2b0a10] hover:bg-[#f4f4f6]">Mulai Sekarang</Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">Login</Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>

        <footer className="flex flex-col justify-between gap-3 border-t border-[color:var(--color-border)] px-2 py-6 text-sm text-[color:var(--color-muted-foreground)] sm:flex-row">
          <p>(c) 2026 TanyainAja. Built for fast and reliable AI workflow.</p>
          <div className="flex gap-4">
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-black/25 p-4">
      <p className="text-xl font-semibold text-[color:var(--color-primary)]">{value}</p>
      <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">{title}</p>
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div
      className={
        role === "user"
          ? "ml-auto max-w-[85%] rounded-[1.5rem] rounded-br-md border border-[#6b101c] bg-[color:var(--color-primary)] px-4 py-3 text-sm text-white"
          : "max-w-[90%] rounded-[1.5rem] rounded-bl-md bg-white/10 px-4 py-3 text-sm text-white/90"
      }
    >
      {children}
    </div>
  );
}
