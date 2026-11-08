"use client";

import { signIn, signUp } from "@/actions/auth";
import { Button, Field, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const submit = () => {
    setError("");
    start(async () => {
      const res =
        mode === "in" ? await signIn({ email, password }) : await signUp({ name, email, password });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push(res.next ?? "/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a]/85 p-6 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
      <div className="mb-6 flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {(["in", "up"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={cn(
              "h-10 flex-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
              mode === m
                ? "bg-gradient-to-r from-gold to-goldsoft text-[#06070a] shadow-[0_0_15px_rgba(243,211,140,0.35)]"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            )}
          >
            {m === "in" ? "تسجيل الدخول" : "حساب جديد"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {mode === "up" && (
          <Field label="الاسم الكامل">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: حيدر البابا" />
          </Field>
        )}
        <Field label="البريد الإلكتروني">
          <Input
            type="email"
            dir="ltr"
            className="text-left"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="كلمة المرور" hint={mode === "up" ? "6 أحرف على الأقل" : undefined}>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </Field>

        {error && (
          <div className="rounded-xl border border-brick/40 bg-brick/10 px-3.5 py-2.5 text-xs font-semibold text-brick shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            {error}
          </div>
        )}

        <Button size="lg" className="mt-2 w-full" onClick={submit} loading={pending}>
          {mode === "in" ? "الدخول إلى مركز القيادة" : "ابدأ بناء شركتك"}
        </Button>
      </div>
    </div>
  );
}
