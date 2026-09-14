import { format } from "date-fns";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RatingRow = {
  id: string;
  overall: number;
  review: string | null;
  created_at: string;
  mechanic: { business_name: string | null; profile: { full_name: string } | null } | null;
};

export default async function CustomerReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ratings } = await supabase
    .from("ratings")
    .select("*, mechanic:mechanics(business_name, profile:profiles(full_name))")
    .eq("customer_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-foreground">My Reviews</h1>
      <Card>
        <CardContent className="divide-y divide-surface-2 p-0">
          {((ratings ?? []) as unknown as RatingRow[]).map((r) => (
            <div key={r.id} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {r.mechanic?.business_name || r.mechanic?.profile?.full_name || "Mechanic"}
                </p>
                <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "d MMM yyyy")}</span>
              </div>
              <div className="mt-1 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-3.5 w-3.5", i < r.overall ? "fill-warning text-warning" : "text-border")} />
                ))}
              </div>
              {r.review && <p className="mt-2 text-sm text-muted-foreground">&ldquo;{r.review}&rdquo;</p>}
            </div>
          ))}
          {(!ratings || ratings.length === 0) && (
            <p className="p-5 text-center text-sm text-muted-foreground">You haven&apos;t left any reviews yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
