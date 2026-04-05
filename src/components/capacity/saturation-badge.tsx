import { cn } from '@/lib/utils';

interface SaturationBadgeProps {
  saturationRate: number;
  className?: string;
}

export function SaturationBadge({ saturationRate, className }: SaturationBadgeProps) {
  const getStatus = (rate: number) => {
    if (rate < 60) return { label: '空闲', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-100' };
    if (rate < 80) return { label: '谨慎', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-100' };
    if (rate < 100) return { label: '饱和', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-100' };
    return { label: '超载', color: 'bg-gray-800', textColor: 'text-gray-900', bgColor: 'bg-gray-200' };
  };

  const status = getStatus(saturationRate);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', status.color)}
          style={{ width: `${Math.min(saturationRate, 100)}%` }}
        />
      </div>
      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', status.bgColor, status.textColor)}>
        {status.label}
      </span>
      <span className="text-sm font-semibold w-12 text-right">
        {saturationRate.toFixed(0)}%
      </span>
    </div>
  );
}

export function SaturationStatusIcon({ saturationRate, className }: { saturationRate: number; className?: string }) {
  const getStatus = (rate: number) => {
    if (rate < 60) return { icon: '🟢', label: '空闲' };
    if (rate < 80) return { icon: '🟡', label: '谨慎' };
    if (rate < 100) return { icon: '🔴', label: '饱和' };
    return { icon: '⚫', label: '超载' };
  };

  const status = getStatus(saturationRate);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="text-lg">{status.icon}</span>
      <span className="text-sm text-gray-600">{status.label}</span>
    </div>
  );
}
