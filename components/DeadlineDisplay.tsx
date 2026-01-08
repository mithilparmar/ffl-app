'use client';

interface DeadlineDisplayProps {
  deadline: Date;
}

export function DeadlineDisplay({ deadline }: DeadlineDisplayProps) {
  return (
    <p className="text-xs sm:text-sm text-slate-400 mt-1">
      Deadline: {new Date(deadline).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      })}
    </p>
  );
}
