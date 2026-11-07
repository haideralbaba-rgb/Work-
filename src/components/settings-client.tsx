"use client";

import { signOut } from "@/actions/auth";
import { updateSettings, type SettingsInput } from "@/actions/strategist";
import { Button, Field, Input, Kicker, Panel, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import { BrainCircuit, Check, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const EQUIPMENT = [
  "هاتف حديث بكاميرا قوية",
  "كاميرا mirrorless / DSLR",
  "عدسة برايم (35/50mm)",
  "عدسة ماكرو",
  "إضاءة LED / Softbox",
  "Gimbal مثبّت",
  "مايكروفون",
  "حاسوب مونتاج",
];

const NOTIF_TYPES = [
  { key: "mission", label: "مهمة اليوم" },
  { key: "followup", label: "ردود العملاء والمتابعات" },
  { key: "deal", label: "الصفقات والتسليمات" },
  { key: "payment", label: "تذكيرات الدفع" },
  { key: "goal", label: "محطات الهدف المالي" },
  { key: "system", label: "تنبيهات النظام" },
];

export default function SettingsClient({
  email,
  hasOpenAI,
  initial,
}: {
  email: string;
  hasOpenAI: boolean;
  initial: SettingsInput;
}) {
  const router = useRouter();
  const [form, setForm] = useState<SettingsInput>(initial);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof SettingsInput>(k: K, v: SettingsInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const togglePref = (key: string) =>
    setForm((f) => ({ ...f, notifPrefs: { ...f.notifPrefs, [key]: f.notifPrefs[key] === false ? true : false } }));

  const toggleEquipment = (e: string) =>
    setForm((f) => ({ ...f, equipment: f.equipment.includes(e) ? f.equipment.filter((x) => x !== e) : [...f.equipment, e] }));

  const save = () =>
    start(async () => {
      setError("");
      setSaved(false);
      const res = await updateSettings(form);
      if (res.error) setError(res.error);
      else {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      }
    });

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel className="rise p-6">
        <Kicker className="mb-5">BUSINESS PROFILE — الملف التجاري</Kicker>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم المشروع">
              <Input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
            </Field>
            <Field label="إنستغرام">
              <Input dir="ltr" className="text-left" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
            </Field>
            <Field label="الموقع">
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
            </Field>
            <Field label="ساعات العمل الأسبوعية">
              <Input type="number" min={1} max={80} className="fnum" value={form.weeklyHours || ""} onChange={(e) => set("weeklyHours", Number(e.target.value))} />
            </Field>
          </div>
          <Field label="التخصص">
            <Input value={form.specialization} onChange={(e) => set("specialization", e.target.value)} />
          </Field>
          <Field label="الطموح البعيد">
            <Input value={form.ambition} onChange={(e) => set("ambition", e.target.value)} />
          </Field>
          <Field label="المعدات">
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => toggleEquipment(e)}
                  className={cn(
                    "border px-2.5 py-1.5 text-[10.5px] font-semibold transition-colors cursor-pointer",
                    form.equipment.includes(e) ? "border-gold bg-gold/12 text-gold" : "border-line text-ash hover:text-fog"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Panel>

      <div className="flex flex-col gap-5">
        <Panel className="rise rise-1 p-6">
          <Kicker className="mb-5">FINANCIAL — المال</Kicker>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="الهدف ($ محصّل)">
              <Input type="number" min={50} className="fnum font-bold" value={form.financialTarget || ""} onChange={(e) => set("financialTarget", Number(e.target.value))} />
            </Field>
            <Field label="عملة العمل">
              <Select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                <option value="USD">USD $</option>
                <option value="IQD">IQD د.ع</option>
              </Select>
            </Field>
            <Field label="سعر الصرف (د.ع/$)">
              <Input type="number" min={1} className="fnum" value={form.exchangeRate || ""} onChange={(e) => set("exchangeRate", Number(e.target.value))} />
            </Field>
          </div>
        </Panel>

        <Panel className="rise rise-2 p-6">
          <Kicker className="mb-5">NOTIFICATIONS — الإشعارات</Kicker>
          <div className="grid grid-cols-2 gap-2">
            {NOTIF_TYPES.map((t) => {
              const on = form.notifPrefs[t.key] !== false;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => togglePref(t.key)}
                  className={cn(
                    "flex items-center justify-between border px-3 py-2.5 text-[11px] font-semibold transition-colors cursor-pointer",
                    on ? "border-gold/30 bg-gold/[0.06] text-fog" : "border-line text-dim"
                  )}
                >
                  {t.label}
                  <span className={cn("grid h-4 w-4 place-items-center border", on ? "border-gold bg-gold text-[#171307]" : "border-line text-transparent")}>
                    <Check className="h-3 w-3" />
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="rise rise-3 p-6">
          <Kicker className="mb-4">ENGINE — محرك الذكاء</Kicker>
          <div className="flex items-center gap-3 border border-line bg-coal px-4 py-3">
            <BrainCircuit className={cn("h-4 w-4", hasOpenAI ? "text-sage" : "text-gold")} />
            <div className="text-[11px] leading-5">
              <div className="font-bold text-fog">
                {hasOpenAI ? "OpenAI متصل — توليد متقدم مفعّل" : "يوظّف حاليًا المحرك الاستراتيجي المدمج"}
              </div>
              <div className="text-dim">
                {hasOpenAI
                  ? "الردود تُولّد عبر نموذج خارجي مدعوم ببياناتك."
                  : "محرك قواعد استراتيجية مبني على بياناتك الفعلية. أضِف OPENAI_API_KEY في الخادم لتفعيل النموذج الخارجي."}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-dim">الحساب: {email}</div>
        </Panel>
      </div>

      <div className="rise rise-3 flex items-center gap-3 lg:col-span-2">
        <Button onClick={save} loading={pending} size="lg">
          حفظ الإعدادات
        </Button>
        {saved && <span className="text-[11px] font-bold text-sage">حُفظت بنجاح</span>}
        {error && <span className="text-[11px] font-bold text-brick">{error}</span>}
        <form
          className="ms-auto"
          action={async () => {
            await signOut();
            router.push("/login");
            router.refresh();
          }}
        >
          <Button type="submit" variant="danger">
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </form>
      </div>
    </div>
  );
}
