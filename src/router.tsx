import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// After a rebuild, an open tab may request an old page file that no longer exists.
// Reload once to pick up the fresh files instead of showing a blank screen.
if (typeof window !== "undefined") {
  const recover = (msg: string) => {
    if (!/Failed to fetch dynamically imported module|Importing a module script failed/.test(msg)) return;
    const key = "stale-chunk-reload";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    window.location.reload();
  };
  window.addEventListener("error", (e) => recover(String(e.message ?? "")));
  window.addEventListener("unhandledrejection", (e) => recover(String((e.reason as Error)?.message ?? e.reason ?? "")));
  window.addEventListener("load", () => setTimeout(() => sessionStorage.removeItem("stale-chunk-reload"), 5000));
}

export const getRouter = () => {
  // One client per request: a module-level QueryClient leaks cached data between SSR requests.
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Lets Query own freshness; set caching defaults on the QueryClient, not the router.
    defaultPreloadStaleTime: 0,
  });

  return router;
};
