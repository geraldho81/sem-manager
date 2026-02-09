'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { AgentProgress } from '@/types';

export function useWebSocket(projectId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [agentUpdates, setAgentUpdates] = useState<Record<string, AgentProgress>>({});
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (!projectId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//localhost:8000/ws/${projectId}`);

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      try {
        const data: AgentProgress = JSON.parse(event.data);
        if (data.agent) {
          setAgentUpdates((prev) => ({
            ...prev,
            [data.agent]: data,
          }));
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 2 seconds
      setTimeout(() => {
        if (projectId) connect();
      }, 2000);
    };

    ws.onerror = () => ws.close();

    wsRef.current = ws;
  }, [projectId]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const reset = useCallback(() => {
    setAgentUpdates({});
  }, []);

  return { agentUpdates, connected, reset };
}
