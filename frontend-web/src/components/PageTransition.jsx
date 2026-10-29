export default function PageTransition({
  children,
  className = '',
  as: Component = 'div',
  ...props
}) {
  return (
    <Component className={`page-transition ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}
