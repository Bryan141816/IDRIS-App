// RealTimeDataContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from "react";

export interface RealTimeEvent {
  event_type: string;
  data: any; // can be any object
}

interface RealTimeDataContextType {
  event: RealTimeEvent | null;
  connected: boolean;
}

export const RealTimeDataContext = createContext<RealTimeDataContextType>({
  event: null,
  connected: false,
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
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryCount = 0;
    let timeoutId: NodeJS.Timeout | null = null;

    const connect = () => {
      if (eventSource) eventSource.close();

      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log("SSE connected");
        setConnected(true);
        retryCount = 0;
      };

      eventSource.onmessage = (e: MessageEvent) => {
        try {
          const data: RealTimeEvent = JSON.parse(e.data);
          setEvent(data);
        } catch (err) {
          console.error("Failed to parse SSE event:", err);
        }
      };

      eventSource.onerror = () => {
        console.error("SSE error, closing connection");
        setConnected(false);
        eventSource?.close();

        if (retryCount < 5) {
          retryCount++;
          timeoutId = setTimeout(connect, 1000);
        } else {
          retryCount = 0;
          timeoutId = setTimeout(connect, 30 * 1000);
        }
      };
    };

    connect();

    return () => {
      eventSource?.close();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [url]);

  return (
    <RealTimeDataContext.Provider value={{ event, connected }}>
      {children}
    </RealTimeDataContext.Provider>
  );
};
