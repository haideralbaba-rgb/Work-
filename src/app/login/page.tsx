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
      <div className="flex items-center justify-center px-6 py-12 vignette">
        <div className="w-full max-w-sm rise">
          <div className="mb-10">
            <div className="grid h-11 w-11 place-items-center border border-gold/50 bg-gold/10">
              <span className="fnum text-base font-black text-gold">IO</span>
            </div>
            <h1 className="font-ar mt-6 text-3xl font-extrabold leading-snug text-fog">
              حوّل طموحك إلى <span className="text-gold">شغل حقيقي.</span>
            </h1>
            <p className="fnum mt-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-dim">
              Stop planning. Start building.
            </p>
          </div>
          <AuthForm />
          <p className="mt-8 text-center text-[10.5px] leading-5 text-dim">
            نظام تشغيل أعمال للمصورين وصنّاع المحتوى المستقلين.
            <br />
            من كربلاء إلى أول $2,000 إيراد محصّل.
          </p>
        </div>
      </div>

      {/* visual side */}
      <div className="relative hidden lg:block">
        <Image src="/images/cinematic-studio.jpg" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-ink via-ink/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/30" />
        <div className="absolute bottom-12 right-12 max-w-md rise rise-2">
          <div className="fnum text-[9px] font-bold uppercase tracking-[0.4em] text-gold">Business Execution OS</div>
          <p className="font-ar mt-4 text-2xl font-bold leading-relaxed text-fog">
            أنت لا تبني مجرد عمل حر.
            <br />
            أنت تبني شركة.
          </p>
        </div>
      </div>
    </div>
  );
}
