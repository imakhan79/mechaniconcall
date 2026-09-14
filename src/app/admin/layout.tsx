import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Settings, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/admin/sign-out-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: adminRow } = await supabase.from("workshop_admins").select("id").eq("id", user.id).maybeSingle();
  if (!adminRow) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50" suppressHydrationWarning>
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-neutral-900">
            <Wrench className="h-5 w-5 text-sky-700" aria-hidden="true" /> Workshop Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Appointments
            </Link>
            <Link href="/admin/settings" className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900">
              <Settings className="h-4 w-4" aria-hidden="true" /> Settings
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
