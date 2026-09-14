import Link from "next/link";
import { ShieldCheck, Wrench } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader({ showBookCta = true }: { showBookCta?: boolean }) {
  return (
    <header className="border-b border-sky-100 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-neutral-900">
          <Wrench className="h-5 w-5 text-sky-700" aria-hidden="true" />
          <span className="font-heading text-lg font-bold">Mechanic On Call</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-sky-700"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Workshop Login
          </Link>
          {showBookCta && (
            <Link href="/book" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
              Book Appointment
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
