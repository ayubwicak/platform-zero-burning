export default function Reveal({
  as: Component = 'div',
  delay = 0,
  duration,
  variant = 'form',
  enabled = true,
  className = '',
  style = {},
  children,
  ...props
}) {
  if (!enabled) {
    return (
      <Component className={className} style={style} {...props}>
        {children}
      </Component>
    );
  }

  const animationClass = variant === 'hero' ? 'animate-hero-rise' : 'animate-form-rise';
  const inlineStyle = {
    ...style,
    ...(delay ? { animationDelay: `${delay}ms` } : {}),
    ...(duration ? { animationDuration: `${duration}ms` } : {}),
  };

  return (
    <Component
      className={`auth-reveal ${animationClass} ${className}`.trim()}
      style={inlineStyle}
      {...props}
    >
      {children}
    </Component>
  );
}
