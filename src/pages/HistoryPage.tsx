import { History } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function HistoryPage() {
  return (
    <div className="px-4 py-6 md:px-8">
      <EmptyState
        icon={<History className="h-12 w-12" />}
        title="No watch history"
        description="Your watched content will appear here."
      />
    </div>
  );
}
