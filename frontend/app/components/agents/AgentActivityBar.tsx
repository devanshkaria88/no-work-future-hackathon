'use client';

import { useEffect } from 'react';
import { useBoroughStore } from '../../stores/borough.store';
import GameNotification from '../shared/GameNotification';

export default function AgentActivityBar() {
  const activities = useBoroughStore((s) => s.agentActivity);
  const removeActivity = useBoroughStore((s) => s.removeAgentActivity);

  // Auto-dismiss success notifications after 4s
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    activities.forEach((a) => {
      if (a.type === 'success' || a.type === 'celebration') {
        const ms = a.type === 'celebration' ? 6000 : 4000;
        const timer = setTimeout(() => removeActivity(a.id), ms);
        timers.push(timer);
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [activities, removeActivity]);

  const visible = activities.slice(-2);

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-16 left-4 right-4 z-30 flex flex-col gap-2 pointer-events-none max-w-xl mx-auto">
      {visible.map((activity) => (
        <div key={activity.id} className="pointer-events-auto animate-slide-up">
          <GameNotification
            agent={activity.agent}
            text={activity.text}
            type={activity.type}
            onDismiss={() => removeActivity(activity.id)}
          />
        </div>
      ))}
    </div>
  );
}
