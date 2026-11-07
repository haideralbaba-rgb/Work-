"use client";

import { signIn, signUp } from "@/actions/auth";
import { Button, Field, Input } from "@/components/ui";
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
    <div>
      <div className="mb-6 flex border border-line">
        {(["in", "up"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={`h-10 flex-1 text-[12.5px] font-bold transition-colors cursor-pointer ${
              mode === m ? "bg-gold text-[#171307]" : "bg-panel text-ash hover:text-fog"
            }`}
          >
            {m === "in" ? "تسجيل الدخول" : "حساب جديد"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {mode === "up" && (
          <Field label="الاسم">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الكامل" />
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
          <div className="border border-brick/40 bg-brick/10 px-3 py-2.5 text-[11.5px] font-semibold text-brick">
            {error}
          </div>
        )}

        <Button size="lg" className="mt-1 w-full" onClick={submit} loading={pending}>
          {mode === "in" ? "ادخل إلى مركز القيادة" : "ابدأ بناء مشروعك"}
        </Button>
      </div>
    </div>
  );
}
