export default function StatCard({
  title,
  value,
  trend,
  trendClass = 'badge-info',
  trendIcon: TrendIcon,
  icon: Icon,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
  bar = 'bg-primary',
  progress = 0,
  className = '',
  delay = '',
}) {
  return (
    <div className={`card card-hover p-5 animate-fade-up ${delay} ${className}`}>
      <div className="flex items-start justify-between">
        <div className={`icon-tile w-11 h-11 shrink-0 ${iconBg}`}>
          {Icon && <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />}
        </div>
        {trend && (
          <span className={`badge ${trendClass}`}>
            {TrendIcon && <TrendIcon className="w-3 h-3 shrink-0" aria-hidden="true" />}
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="text-sm font-medium text-muted-foreground mt-0.5">{title}</p>
      <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bar}`}
          style={{ width: `${Math.min(100, Math.max(0, Number(progress) || 0))}%` }}
        />
      </div>
    </div>
  );
}
