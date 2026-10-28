export default function Badge({
  children,
  variant = 'info',
  className = '',
  icon: Icon,
  ...props
}) {
  const variantClass = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
  }[variant] || 'badge-info';

  return (
    <span className={`badge ${variantClass} ${className}`} {...props}>
      {Icon && <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}
