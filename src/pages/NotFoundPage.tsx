import { Link } from "react-router";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-[120px] font-bold leading-none text-border/40">
        404
      </div>
      <h1 className="mb-2 text-2xl font-bold text-primary">Page Not Found</h1>
      <p className="mb-8 max-w-sm text-sm text-secondary">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
        <Link to="/">
          <Button>
            <Home className="h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
