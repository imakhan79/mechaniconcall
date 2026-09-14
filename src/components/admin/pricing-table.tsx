"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminUpdateServiceCategory } from "@/app/admin/actions";
import type { ServiceCategory } from "@/lib/supabase/types";

export function PricingTable({ categories }: { categories: ServiceCategory[] }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await adminUpdateServiceCategory(formData);
      if (res.ok) toast.success("Pricing updated");
      else toast.error(res.error);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {categories.map((c) => (
        <Card key={c.id}>
          <CardContent>
            <form action={handleSubmit} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={c.id} />
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                <span className="text-xs text-muted-foreground">{c.slug}</span>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Base Price (AED)</label>
                <Input name="base_price" type="number" step="0.01" defaultValue={c.base_price} />
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground/90">
                <input type="checkbox" name="is_emergency" defaultChecked={c.is_emergency} className="h-4 w-4 accent-brand-500" />
                Emergency service
              </label>
              <Button type="submit" size="sm" variant="primary" disabled={pending} className="self-start">
                Save
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
