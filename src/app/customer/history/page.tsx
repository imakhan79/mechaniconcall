import { Card, CardContent } from "@/components/ui/card";

export default function CustomerHistoryPage() {
  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-neutral-900">Service History</h1>
      <Card>
        <CardContent className="p-5 text-sm text-neutral-500">Your past service requests are coming in the next phase.</CardContent>
      </Card>
    </div>
  );
}
