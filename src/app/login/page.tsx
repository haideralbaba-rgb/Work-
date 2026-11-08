import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import AuthForm from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* form side */}
      <div className="flex items-center justify-center px-6 py-12 vignette relative">
        <div className="w-full max-w-sm rise relative z-10">
          <div className="mb-8">
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/20 via-gold/10 to-transparent shadow-[0_0_25px_rgba(243,211,140,0.25)]">
              <span className="fnum text-base font-black text-gold">IO</span>
              <span className="absolute -top-1 -end-1 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </div>
            <h1 className="font-ar mt-6 text-3xl font-black leading-snug text-fog bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              حوّل طموحك إلى <span className="text-gold">شغل حقيقي.</span>
            </h1>
            <p className="fnum mt-2.5 text-[10.5px] font-bold uppercase tracking-[0.3em] text-gold/80 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              Stop planning. Start building.
            </p>
          </div>
          <AuthForm />
          <p className="mt-8 text-center text-xs leading-6 text-dim">
            نظام تشغيل أعمال للمصورين وصنّاع المحتوى المستقلين.
            <br />
            من كربلاء إلى أول <span className="text-gold font-bold">$2,000</span> إيراد محصّل.
          </p>
        </div>
      </div>

      {/* visual side */}
      <div className="relative hidden lg:block overflow-hidden">
        <Image src="/images/cinematic-studio.jpg" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-[#06070a] via-[#06070a]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06070a]/90 via-transparent to-[#06070a]/40" />
        <div className="absolute bottom-12 right-12 max-w-md rise rise-2 rounded-2xl border border-white/10 bg-[#0a0d16]/80 p-6 backdrop-blur-xl shadow-2xl">
          <div className="fnum text-[9.5px] font-bold uppercase tracking-[0.4em] text-gold flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            Business Execution OS
          </div>
          <p className="font-ar mt-3 text-2xl font-black leading-relaxed text-fog bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
            أنت لا تبني مجرد عمل حر.
            <br />
            أنت تبني <span className="text-gold">شركة.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
