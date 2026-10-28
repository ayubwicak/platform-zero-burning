export default function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost-light',
  }[variant] || 'btn-primary';

  return (
    <button type={type} className={`${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
