export function GroupedRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <span className="shrink-0 text-sm font-medium text-[var(--text-primary)]">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
