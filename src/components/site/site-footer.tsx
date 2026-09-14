import Link from "next/link";
import { Wrench } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/#services", label: "Services" },
      { href: "/#how-it-works", label: "How It Works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/mechanics", label: "Find a Mechanic" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/register", label: "Become a Mechanic" },
      { href: "/#safety", label: "Safety & Trust" },
      { href: "/#contact", label: "Contact" },
      { href: "/login", label: "Login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/#", label: "Terms of Service" },
      { href: "/#", label: "Privacy Policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
              <Wrench className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="font-heading text-lg font-bold">Mechanic On Call</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Professional Help. Wherever You Need It. Verified mechanics dispatched to your location across the UAE, 24/7.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">support@mechaniconcall.ae · +971 800 6324</p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Mechanic On Call. All rights reserved.
      </div>
    </footer>
  );
}
