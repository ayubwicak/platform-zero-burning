export default function Card({ children, className = '', hover = false, ...props }) {
  const hoverClass = hover ? ' card-hover' : '';
  return (
    <div className={`card p-5 lg:p-6${hoverClass} ${className}`} {...props}>
      {children}
    </div>
  );
}
