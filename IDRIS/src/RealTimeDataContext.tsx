// RealTimeDataContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from "react";

export interface RealTimeEvent {
  event_type: string;
  data: any; // can be any object
}

interface RealTimeDataContextType {
  event: RealTimeEvent | null;
}

export const RealTimeDataContext = createContext<RealTimeDataContextType>({
  event: null,
});

interface RealTimeDataProviderProps {
  children: ReactNode;
  url: string; // SSE endpoint
}

export const RealTimeDataProvider: React.FC<RealTimeDataProviderProps> = ({
  children,
  url,
}) => {
  const [event, setEvent] = useState<RealTimeEvent | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(url);

    eventSource.onmessage = (e: MessageEvent) => {
      try {
        const data: RealTimeEvent = JSON.parse(e.data);
        setEvent(data);
      } catch (err) {
        console.error("Failed to parse SSE event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [url]);

  return (
    <RealTimeDataContext.Provider value={{ event }}>
      {children}
    </RealTimeDataContext.Provider>
  );
};
