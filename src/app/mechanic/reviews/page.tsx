import { format } from "date-fns";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function MechanicReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: ratings }, { data: mechanic }] = await Promise.all([
    supabase
      .from("ratings")
      .select("*, customer:customers(id, profile:profiles(full_name))")
      .eq("mechanic_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase.from("mechanics").select("rating_avg, rating_count").eq("id", user!.id).single(),
  ]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold text-foreground">Reviews</h1>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-warning text-warning" />
          <span className="font-semibold text-foreground">{mechanic?.rating_avg?.toFixed(1) ?? "—"}</span>
          <span>({mechanic?.rating_count ?? 0} reviews)</span>
        </div>
      </div>
      <Card>
        <CardContent className="divide-y divide-surface-2 p-0">
          {(ratings ?? []).map((r: any) => (
            <div key={r.id} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{r.customer?.profile?.full_name ?? "Customer"}</p>
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
            <p className="p-5 text-center text-sm text-muted-foreground">No reviews yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
