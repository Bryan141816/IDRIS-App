import { useEffect } from "react";
import { prefetchMap } from "./routes";
export const usePrefectLink = () => {
  useEffect(() => {
    const imported = new Set<string>();

    const handleEvent = (e: Event) => {
      const target = e.target as HTMLElement;
      const route = target.getAttribute("prefetch-link");

      if (route && !imported.has(route)) {
        const loader = prefetchMap[route];
        if (loader) {
          imported.add(route);
          loader()
            .then(() => console.log(`Prefetched: ${route}`))
            .catch((err) => console.error(`Error prefetching ${route}:`, err));
        } else {
          console.warn(`No prefetch loader found for: ${route}`);
        }
      }
    };

    document.addEventListener("mouseover", handleEvent);
    document.addEventListener("focus", handleEvent, true);

    return () => {
      document.removeEventListener("mouseover", handleEvent);
      document.removeEventListener("focus", handleEvent, true);
    };
  }, []);
};
