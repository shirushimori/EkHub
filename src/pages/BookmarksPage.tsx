import { Bookmark } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function BookmarksPage() {
  return (
    <div className="px-4 py-6 md:px-8">
      <EmptyState
        icon={<Bookmark className="h-12 w-12" />}
        title="No bookmarks yet"
        description="Save your favorite content here for quick access."
      />
    </div>
  );
}
