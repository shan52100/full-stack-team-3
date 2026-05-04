import { useState, useEffect } from 'react';

function elapsed(startIso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(startIso).getTime()) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface Props {
  status: 'active' | 'completed';
  duration: string;
  createdAt: string;
}

export function LiveDuration({ status, duration, createdAt }: Props) {
  const [display, setDisplay] = useState(() =>
    status === 'active' ? elapsed(createdAt) : duration
  );

  useEffect(() => {
    if (status !== 'active') {
      setDisplay(duration);
      return;
    }
    setDisplay(elapsed(createdAt));
    const id = setInterval(() => setDisplay(elapsed(createdAt)), 1000);
    return () => clearInterval(id);
  }, [status, duration, createdAt]);

  if (status === 'active') {
    return (
      <span className="font-mono text-green-600 font-medium tabular-nums">
        {display}
        <span className="ml-1 text-xs text-green-400 animate-pulse">▶</span>
      </span>
    );
  }
  return <span className="font-mono tabular-nums">{display}</span>;
}
