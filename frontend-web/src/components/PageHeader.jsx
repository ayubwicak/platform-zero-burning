export default function PageHeader({ eyebrow, title, subtitle, action, children }) {
  return (
    <div className="animate-fade-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-green-700 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {eyebrow}
            </span>
          )}
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm lg:text-[15px] text-gray-500 mt-1.5 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex flex-wrap items-center gap-3 md:justify-end">{action}</div>}
      </div>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}