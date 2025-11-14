// RealTimeDataContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from "react";
import { API } from "./API_Handler/Axio_API_Handler";
export interface RealTimeEvent {
  event_type: string;
  data: any; // can be any object
}
import { useUserContext } from "./UserContext"; // <-- import your user context

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
}

export const RealTimeDataProvider: React.FC<RealTimeDataProviderProps> = ({
  children,
}) => {
  const [event, setEvent] = useState<RealTimeEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const { userId } = useUserContext();
  useEffect(() => {
    if (!userId) return;
    let eventSource: EventSource | null = null;
    let retryCount = 0;
    let timeoutId: NodeJS.Timeout | null = null;

    const connect = () => {
      if (eventSource) eventSource.close();

      const url = `${API.defaults.baseURL}/real_time/${userId}`;
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
  }, [userId]);

  return (
    <RealTimeDataContext.Provider value={{ event, connected }}>
      {children}
    </RealTimeDataContext.Provider>
  );
};
