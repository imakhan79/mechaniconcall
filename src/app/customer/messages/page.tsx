import { Card, CardContent } from "@/components/ui/card";

export default function CustomerMessagesPage() {
  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-neutral-900">Messages</h1>
      <Card>
        <CardContent className="p-5 text-sm text-neutral-500">Chat with your mechanic is coming in the next phase.</CardContent>
      </Card>
    </div>
  );
}
