import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RequestPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8">
          <h1 className="font-heading text-xl font-bold text-neutral-900">Request a Mechanic</h1>
          <p className="text-sm text-neutral-500">The request wizard is coming in the next phase.</p>
          <Link href="/customer" className={cn(buttonVariants({ variant: "outline" }), "mt-2")}>
            Back to Dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
