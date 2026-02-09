'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { AgentProgress } from '@/types';

export function useWebSocket(projectId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [agentUpdates, setAgentUpdates] = useState<Record<string, AgentProgress>>({});
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (!projectId) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    let wsUrl: string;
    if (backendUrl) {
      const wsBase = backendUrl.replace(/^http/, 'ws');
      wsUrl = `${wsBase}/ws/${projectId}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws/${projectId}`;
    }
    const ws = new WebSocket(wsUrl);

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
