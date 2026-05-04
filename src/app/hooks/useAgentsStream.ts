import { useEffect, useRef, useCallback } from 'react';
import type { Agent } from '../services/api';

export function useAgentsStream(onData: (agents: Agent[]) => void) {
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();
    const token = localStorage.getItem('token');
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || '';
    const es = new EventSource(`${base}/api/agents/stream?token=${encodeURIComponent(token)}`);
    esRef.current = es;

    const handle = (e: MessageEvent) => {
      try {
        const { agents } = JSON.parse(e.data);
        onDataRef.current(agents);
      } catch (_) {}
    };

    es.addEventListener('init', handle);
    es.addEventListener('update', handle);
    es.addEventListener('heartbeat', () => {});

    es.onerror = () => {
      es.close();
      esRef.current = null;
      retryRef.current = setTimeout(connect, 5000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [connect]);
}
