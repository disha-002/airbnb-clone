"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import AuthBackdrop from "@/components/AuthBackdrop";
import LoginCard from "@/components/LoginCard";

/** Account page for logged-in users; full-page login (with redirect) otherwise. */
function LoginInner() {
  const { users, user, ready, login, logout } = useUser();
  const toast = useToast();
  const router = useRouter();
  const redirect = useSearchParams().get("redirect"); // e.g. /host from "Become a host"

  useEffect(() => {
    if (ready && user && redirect) router.replace(redirect);
  }, [ready, user, redirect, router]);

  if (user && !redirect)
    return (
      <div className="mx-auto max-w-md px-5 py-8">
        <h1 className="text-[26px] font-semibold">Your account</h1>
        <p className="mt-1 text-muted">Demo accounts. Switch to a guest to book trips, or a host to manage listings.</p>
        <ul className="mt-6 space-y-3">
          {users.map((u) => (
            <li key={u.id}>
              <button onClick={() => { login(u.id); toast(`Welcome, ${u.name.split(" ")[0]}!`); router.push("/"); }}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left hover:shadow-md ${user.id === u.id ? "border-ink" : "border-hairline"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.avatar_url} alt="" className="h-12 w-12 rounded-full bg-soft" />
                <div className="flex-1"><p className="font-semibold">{u.name}</p><p className="text-sm text-muted">{u.email}</p></div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${u.role === "host" ? "bg-rausch/10 text-rausch" : "bg-soft text-muted"}`}>
                  {u.role === "host" ? (u.is_superhost ? "Superhost" : "Host") : "Guest"}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button onClick={() => { logout(); toast("Logged out"); }} className="mt-6 font-semibold underline">Log out</button>
      </div>
    );

  return (
    <div className="relative min-h-[calc(100vh-84px)] bg-soft">
      <AuthBackdrop />
      <div className="relative z-10 flex justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-[480px] rounded-3xl bg-white px-6 pb-10 pt-14 shadow-2xl md:px-8">
          <LoginCard onDone={() => router.push(redirect ?? "/")} />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="px-5 py-10 text-muted">Loading…</p>}>
      <LoginInner />
    </Suspense>
  );
}
