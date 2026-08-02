import { createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/Skeleton";

function lazyPage(factory: () => Promise<{ default: React.ComponentType }>) {
  const Component = lazy(factory);
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4 md:p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <MainLayout />,
      children: [
      {
        index: true,
        element: lazyPage(() => import("@/pages/HomePage")),
      },
      {
        path: "detail/:slug",
        element: lazyPage(() => import("@/pages/DetailPage")),
      },
      {
        path: "discover",
        element: lazyPage(() => import("@/pages/DiscoverPage")),
      },
      {
        path: "movies",
        element: lazyPage(() => import("@/pages/MoviesPage")),
      },
      {
        path: "series",
        element: lazyPage(() => import("@/pages/SeriesPage")),
      },
      {
        path: "anime",
        element: lazyPage(() => import("@/pages/AnimePage")),
      },
      {
        path: "search",
        element: lazyPage(() => import("@/pages/SearchPage")),
      },
      {
        path: "library",
        element: lazyPage(() => import("@/pages/LibraryPage")),
      },
      {
        path: "bookmarks",
        element: lazyPage(() => import("@/pages/BookmarksPage")),
      },
      {
        path: "history",
        element: lazyPage(() => import("@/pages/HistoryPage")),
      },
      {
        path: "settings",
        element: lazyPage(() => import("@/pages/SettingsPage")),
      },
      {
        path: "about",
        element: lazyPage(() => import("@/pages/AboutPage")),
      },
      {
        path: "*",
        element: lazyPage(() => import("@/pages/NotFoundPage")),
      },
    ],
  },
],
  { basename: `${import.meta.env.BASE_URL}app` }
);
