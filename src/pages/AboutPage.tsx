import { Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="px-4 py-6 md:px-8">
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <img
            src="https://raw.githubusercontent.com/shirushimori/shirushimori/refs/heads/main/assets/pfp1.jpg"
            alt="EkHub"
            className="h-20 w-20 rounded-2xl object-cover"
          />
        </div>

        <h1 className="mb-2 text-3xl font-bold text-primary">EkHub</h1>
        <p className="mb-1 text-sm text-secondary">Version 2.0.0</p>
        <p className="mb-8 text-sm leading-relaxed text-secondary">
          A modern, ultra-fast streaming platform designed for every device.
          Built with performance and low resource usage in mind.
        </p>

        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-1 text-sm font-semibold text-primary">
              Built With
            </h3>
            <p className="text-xs text-secondary">
              React 19 · TypeScript · Vite · Tailwind CSS v4 · Motion
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-1 text-sm font-semibold text-primary">
              Data Sources
            </h3>
            <p className="text-xs text-secondary">
              Wikipedia (movie metadata) · TVMaze (TV shows) · IMDb (ratings)
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-1 text-sm font-semibold text-primary">
              Features
            </h3>
            <p className="text-xs text-secondary">
              Mobile-first · Dark mode · Lazy loading · Code splitting ·
              Real-time search · Type filters · Caching
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="flex items-center justify-center gap-1 text-xs text-secondary">
              Made with{" "}
              <Heart className="h-3 w-3 fill-error text-error" /> for
              streaming enthusiasts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
