import { createClient } from "@/lib/supabase/server";
import { BookingsTable, type BookingRow } from "@/components/admin/bookings-table";

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("service_requests")
    .select(
      "id, status, is_emergency, address, estimated_price, final_price, created_at, customer:customers(profile:profiles(full_name)), mechanic:mechanics(business_name, profile:profiles(full_name)), category:service_categories(name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const bookings: BookingRow[] = (requests ?? []).map((r: any) => ({
    id: r.id,
    status: r.status,
    is_emergency: r.is_emergency,
    address: r.address,
    estimated_price: r.estimated_price,
    final_price: r.final_price,
    created_at: r.created_at,
    customer_name: r.customer?.profile?.full_name ?? "Unknown",
    mechanic_name: r.mechanic?.business_name || r.mechanic?.profile?.full_name || null,
    category_name: r.category?.name ?? null,
  }));

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-foreground">Bookings</h1>
      <BookingsTable bookings={bookings} />
    </div>
  );
}
