"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="fade-in relative min-h-screen px-4 py-10">
          <div className="absolute inset-0 bg-slate-950/65" />
          <div className="relative mx-auto flex min-h-[60vh] max-w-md items-center justify-center rounded-2xl border border-amber-200/80 bg-white p-8 text-amber-900 shadow-orange-900/10 shadow-2xl">
            Yukleniyor...
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.toLowerCase().includes("email not confirmed")) {
        setError("Lutfen once e-posta adresini dogrula, sonra giris yap.");
      } else {
        setError(signInError.message);
      }
      setLoading(false);
      return;
    }

    setSuccess("Giris basarili. Yonlendiriliyorsun...");
    router.replace("/dashboard");
    router.refresh();
  }

  const verified = searchParams.get("verified") === "1";

  return (
    <main className="fade-in relative min-h-screen px-4 py-10">
      <div
        className="absolute inset-0 bg-cover bg-center grayscale"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1800&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px]" />
      <div className="relative mx-auto w-full max-w-md">
        <div className="flex flex-col rounded-2xl border border-amber-200/80 bg-white p-8 text-slate-900 shadow-orange-900/10 shadow-2xl">
          <div className="mb-1 flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full border border-amber-200 bg-white p-1 shadow-sm shadow-orange-900/10">
              <Image
                src="/images/brewmap-icon.png"
                alt="BrewMap icon"
                width={40}
                height={40}
                className="h-full w-full object-cover mix-blend-multiply"
                priority
              />
            </div>
            <h1 className="brand-script text-4xl leading-none">
              <span className="text-[#451a03]">Brew</span>{" "}
              <span className="text-[#d97706]">Map</span>
            </h1>
          </div>
          <p className="mt-2 text-sm text-amber-900/70">
            BrewMap hesabina gir ve rezervasyonlarini kolayca yonet.
          </p>

          {verified ? (
            <p className="mt-4 rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-sm text-purple-700">
              E-posta dogrulaman basarili. Artik giris yapabilirsin.
            </p>
          ) : null}

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-amber-900">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none ring-amber-700 transition focus:ring-2"
                placeholder="ornek@mail.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-amber-900">Sifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none ring-amber-700 transition focus:ring-2"
                placeholder="Sifren"
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-lg border border-amber-300 bg-orange-50 px-3 py-2 text-sm text-amber-900">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#451a03] px-4 py-3 font-medium text-white transition hover:bg-[#d97706] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Giris Yapiliyor..." : "Giris Yap"}
            </button>
          </form>

          <p className="mt-6 text-sm text-amber-900/70">
            Hesabin yok mu?{" "}
            <Link
              href="/register"
              className="font-medium text-[#451a03] hover:text-[#d97706]"
            >
              Kayit Ol
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
