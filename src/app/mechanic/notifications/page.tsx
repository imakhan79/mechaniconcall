import { format } from "date-fns";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function MechanicNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-foreground">Notifications</h1>
      <Card>
        <CardContent className="divide-y divide-surface-2 p-0">
          {(notifications ?? []).map((n) => (
            <div key={n.id} className="flex items-start gap-3 p-4">
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  n.read_at ? "bg-surface-2 text-muted-foreground" : "bg-brand-500/10 text-brand-500"
                )}
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{format(new Date(n.created_at), "d MMM yyyy, h:mm a")}</p>
              </div>
              {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />}
            </div>
          ))}
          {(!notifications || notifications.length === 0) && (
            <p className="p-5 text-center text-sm text-muted-foreground">No notifications yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
