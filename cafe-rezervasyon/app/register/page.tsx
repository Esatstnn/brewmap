"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/login?verified=1`
        : undefined;

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(
      "Hesap olusturuldu. E-postana dogrulama linki gonderildi; linke tiklayip giris yapabilirsin."
    );
    setLoading(false);
    setFullName("");
    setEmail("");
    setPassword("");
  }

  return (
    <main className="fade-in relative min-h-screen px-4 py-10">
      <div
        className="absolute inset-0 bg-cover bg-center grayscale"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1800&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px]" />
      <div className="relative mx-auto w-full max-w-md">
        <div className="mb-3 flex justify-center">
          <Image
            src="/images/brewmap-icon.png"
            alt="BrewMap logo"
            width={86}
            height={86}
            className="h-20 w-20 rounded-full border border-amber-200 bg-white p-1 object-cover shadow-sm shadow-orange-900/10 mix-blend-multiply"
            priority
          />
        </div>
        <div className="flex flex-col rounded-2xl border border-amber-200/80 bg-white p-8 text-slate-900 shadow-orange-900/10 shadow-2xl">
        <h1 className="brand-script text-4xl leading-none">
          <span className="text-[#451a03]">Brew</span>{" "}
          <span className="text-[#d97706]">Map</span>
        </h1>
        <p className="mt-2 text-sm text-amber-900/70">
          Kafe rezervasyon deneyimine baslamak icin hesabini olustur.
        </p>

        <form onSubmit={handleRegister} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-amber-900">Ad Soyad</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none ring-amber-700 transition focus:ring-2"
              placeholder="Esat Yilmaz"
            />
          </div>

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
              minLength={6}
              className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm outline-none ring-amber-700 transition focus:ring-2"
              placeholder="En az 6 karakter"
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
            {loading ? "Hesap Olusturuluyor..." : "Kayit Ol"}
          </button>
        </form>

        <p className="mt-6 text-sm text-amber-900/70">
          Zaten hesabin var mi?{" "}
          <Link href="/login" className="font-medium text-[#451a03] hover:text-[#d97706]">
            Giris Yap
          </Link>
        </p>
      </div>
      </div>
    </main>
  );
}
