import { createClient } from "@/lib/supabase/server";
import { BookingsTable, type BookingRow, type MechanicOption } from "@/components/admin/bookings-table";

type BookingQueryRow = {
  id: number;
  status: string;
  is_emergency: boolean;
  address: string | null;
  estimated_price: number | null;
  final_price: number | null;
  created_at: string;
  mechanic_id: string | null;
  customer: { profile: { full_name: string } | null } | null;
  mechanic: { business_name: string | null; profile: { full_name: string } | null } | null;
  category: { name: string } | null;
};

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const [{ data: requests }, { data: mechanicRows }] = await Promise.all([
    supabase
      .from("service_requests")
      .select(
        "id, status, is_emergency, address, estimated_price, final_price, created_at, mechanic_id, customer:customers(profile:profiles(full_name)), mechanic:mechanics(business_name, profile:profiles(full_name)), category:service_categories(name)"
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("mechanics")
      .select("id, business_name, profile:profiles(full_name)")
      .eq("verification_status", "verified"),
  ]);

  const bookings: BookingRow[] = ((requests ?? []) as unknown as BookingQueryRow[]).map((r) => ({
    id: r.id,
    status: r.status,
    is_emergency: r.is_emergency,
    address: r.address,
    estimated_price: r.estimated_price,
    final_price: r.final_price,
    created_at: r.created_at,
    customer_name: r.customer?.profile?.full_name ?? "Unknown",
    mechanic_id: r.mechanic_id,
    mechanic_name: r.mechanic?.business_name || r.mechanic?.profile?.full_name || null,
    category_name: r.category?.name ?? null,
  }));

  const mechanics: MechanicOption[] = ((mechanicRows ?? []) as unknown as {
    id: string;
    business_name: string | null;
    profile: { full_name: string } | null;
  }[]).map((m) => ({ id: m.id, name: m.business_name || m.profile?.full_name || "Mechanic" }));

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-foreground">Bookings</h1>
      <BookingsTable bookings={bookings} mechanics={mechanics} />
    </div>
  );
}
