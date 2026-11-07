"use client";

import { completeOnboarding, type OnboardingInput } from "@/actions/onboarding";
import { Button, Field, Input, Select } from "@/components/ui";
import { CATEGORIES, cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
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

const SERVICES_OPTIONS = [
  "تصوير منتجات",
  "فيديوهات إعلانية قصيرة",
  "جلسة محتوى للمطاعم",
  "باقات محتوى شهرية",
  "إدارة حسابات",
];

const STEPS = ["الهوية", "القدرات", "الوضع الحالي", "الهدف المالي"];

export default function OnboardingWizard({ userName }: { userName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const [form, setForm] = useState<OnboardingInput>({
    businessName: "",
    location: "كربلاء، العراق",
    instagram: "",
    portfolioLinks: [""],
    equipment: [],
    photoExperience: "beginner",
    videoSkills: "beginner",
    weeklyHours: 20,
    currentServices: [],
    preferredCategories: [],
    currentRevenue: 0,
    existingClients: 0,
    monthlyExpenses: 0,
    financialTarget: 2000,
    currency: "USD",
    exchangeRate: 1310,
    specialization: "المحتوى البصري للأغذية والضيافة",
    ambition: "بناء استوديو إنتاج إبداعي",
  });

  const set = <K extends keyof OnboardingInput>(k: K, v: OnboardingInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleArr = (k: "equipment" | "currentServices" | "preferredCategories", v: string) =>
    setForm((f) => ({
      ...f,
      [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v],
    }));

  const next = () => {
    if (step === 0 && !form.businessName.trim()) {
      setError("اكتب اسم مشروعك — الاسم أول قرار تجاري.");
      return;
    }
    setError("");
    setStep((s) => Math.min(3, s + 1));
  };

  const submit = () => {
    setError("");
    start(async () => {
      const res = await completeOnboarding({
        ...form,
        portfolioLinks: form.portfolioLinks.map((x) => x.trim()).filter(Boolean),
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  };

  const Chip = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-3 py-2 text-[11.5px] font-semibold transition-all cursor-pointer",
        active ? "border-gold bg-gold/12 text-gold" : "border-line bg-panel text-ash hover:border-line2 hover:text-fog"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="vignette flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="rise mb-8 text-center">
          <div className="fnum mx-auto grid h-11 w-11 place-items-center border border-gold/50 bg-gold/10 text-sm font-black text-gold">
            IO
          </div>
          <h1 className="font-ar mt-5 text-2xl font-extrabold text-fog md:text-3xl">
            {userName ? `${userName}، ` : ""}لنبنِ ملفك التجاري
          </h1>
          <p className="mt-2 text-xs leading-6 text-ash">
            هذه الإجابات تغذّي المستشار الذكي وخارطة الطريق. كن صادقًا — النظام يعمل على بياناتك الحقيقية فقط.
          </p>
        </div>

        {/* stepper */}
        <div className="rise rise-1 mb-6 flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col gap-1.5">
              <div className={cn("h-[3px] transition-colors", i <= step ? "bg-gold" : "bg-line")} />
              <span className={cn("text-[9.5px] font-semibold", i === step ? "text-gold" : "text-dim")}>{s}</span>
            </div>
          ))}
        </div>

        <div className="rise rise-2 border border-line bg-panel p-6 md:p-8">
          {step === 0 && (
            <div className="flex flex-col gap-5 fadein">
              <Field label="اسم مشروعك التجاري" hint="الاسم الذي ستظهر به أمام العملاء">
                <Input
                  autoFocus
                  value={form.businessName}
                  onChange={(e) => set("businessName", e.target.value)}
                  placeholder="مثال: لقطة ستوديو / FRAME Studio"
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="الموقع">
                  <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
                </Field>
                <Field label="حساب إنستغرام">
                  <Input
                    dir="ltr"
                    className="text-left"
                    value={form.instagram}
                    onChange={(e) => set("instagram", e.target.value)}
                    placeholder="@your.studio"
                  />
                </Field>
              </div>
              <Field label="روابط أعمالك (افصل بينها بسطر)" hint="اتركها فارغة إن لم يكن لديك بعد — لا بأس، سنبنيها">
                <textarea
                  className="w-full border border-line bg-coal px-3 py-2.5 text-[13px] text-fog placeholder:text-dim outline-none focus:border-gold/60"
                  dir="ltr"
                  rows={2}
                  value={form.portfolioLinks.join("\n")}
                  onChange={(e) => set("portfolioLinks", e.target.value.split("\n"))}
                  placeholder="https://..."
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="تخصصك الأساسي">
                  <Input value={form.specialization} onChange={(e) => set("specialization", e.target.value)} />
                </Field>
                <Field label="طموحك البعيد">
                  <Input value={form.ambition} onChange={(e) => set("ambition", e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-6 fadein">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="خبرة التصوير الفوتوغرافي">
                  <Select value={form.photoExperience} onChange={(e) => set("photoExperience", e.target.value)}>
                    <option value="beginner">مبتدئ — أتعلم الأساسيات</option>
                    <option value="intermediate">متوسط — أنتج أعمالًا جيدة</option>
                    <option value="advanced">متقدم — جودة احترافية</option>
                  </Select>
                </Field>
                <Field label="مهارة المونتاج والفيديو">
                  <Select value={form.videoSkills} onChange={(e) => set("videoSkills", e.target.value)}>
                    <option value="beginner">مبتدئ</option>
                    <option value="intermediate">متوسط — أتقن برنامجًا واحدًا</option>
                    <option value="advanced">متقدم — مونتاج احترافي</option>
                  </Select>
                </Field>
              </div>
              <Field label="معداتك المتاحة حاليًا" hint="اختر كل ما تملكه فعلًا — الخطة تتكيف مع معداتك">
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT.map((e) => (
                    <Chip key={e} active={form.equipment.includes(e)} label={e} onClick={() => toggleArr("equipment", e)} />
                  ))}
                </div>
              </Field>
              <Field label={`ساعات العمل المتاحة أسبوعيًا: ${form.weeklyHours} ساعة`}>
                <input
                  type="range"
                  min={2}
                  max={60}
                  value={form.weeklyHours}
                  onChange={(e) => set("weeklyHours", Number(e.target.value))}
                  className="w-full accent-[#c7a56a]"
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6 fadein">
              <Field label="خدماتك الحالية (ما الذي تستطيع تنفيذه اليوم؟)">
                <div className="flex flex-wrap gap-2">
                  {SERVICES_OPTIONS.map((s) => (
                    <Chip key={s} active={form.currentServices.includes(s)} label={s} onClick={() => toggleArr("currentServices", s)} />
                  ))}
                </div>
              </Field>
              <Field label="فئات العملاء المفضلة" hint="من تريد أن يدفع لك أولًا؟">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <Chip
                      key={c.key}
                      active={form.preferredCategories.includes(c.key)}
                      label={c.ar}
                      onClick={() => toggleArr("preferredCategories", c.key)}
                    />
                  ))}
                </div>
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="عدد العملاء الحاليين/السابقين">
                  <Input
                    type="number"
                    min={0}
                    value={form.existingClients || ""}
                    onChange={(e) => set("existingClients", Number(e.target.value))}
                    placeholder="0"
                  />
                </Field>
                <Field label="إيرادك الحالي حتى الآن (بالدولار)">
                  <Input
                    type="number"
                    min={0}
                    value={form.currentRevenue || ""}
                    onChange={(e) => set("currentRevenue", Number(e.target.value))}
                    placeholder="0"
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5 fadein">
              <Field label="الهدف المالي (إيراد محصّل فعليًا)" hint="المقبوض في يدك فقط — لا العروض ولا الوعود">
                <div className="relative">
                  <Input
                    type="number"
                    min={50}
                    className="fnum ps-10 text-lg font-bold"
                    value={form.financialTarget || ""}
                    onChange={(e) => set("financialTarget", Number(e.target.value))}
                  />
                  <span className="fnum absolute start-3 top-1/2 -translate-y-1/2 text-gold">$</span>
                </div>
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="مصاريفك الشهرية (تقريبي، $)">
                  <Input
                    type="number"
                    min={0}
                    value={form.monthlyExpenses || ""}
                    onChange={(e) => set("monthlyExpenses", Number(e.target.value))}
                    placeholder="0"
                  />
                </Field>
                <Field label="عملة العمل المحلية">
                  <Select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="IQD">دينار عراقي (IQD)</option>
                  </Select>
                </Field>
              </div>
              <Field label="سعر الصرف (دينار لكل دولار)">
                <Input
                  type="number"
                  min={1}
                  className="fnum"
                  value={form.exchangeRate || ""}
                  onChange={(e) => set("exchangeRate", Number(e.target.value))}
                />
              </Field>
              <div className="border border-gold/25 bg-gold/[0.05] px-4 py-3 text-[11.5px] leading-5 text-goldsoft">
                بعد الإتمام سأبني لك خارطة طريق من 5 مراحل نحو أول {form.financialTarget || 2000}$ محصّلة، وسأختار لك مهمة
                اليوم تلقائيًا.
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 border border-brick/40 bg-brick/10 px-3 py-2.5 text-[11.5px] font-semibold text-brick">
              {error}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || pending}>
              <ArrowRight className="h-4 w-4" />
              السابق
            </Button>
            {step < 3 ? (
              <Button onClick={next}>
                التالي
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} loading={pending} size="lg">
                <Check className="h-4 w-4" />
                ابنِ خارطة طريقي
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
