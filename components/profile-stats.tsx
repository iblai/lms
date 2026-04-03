export function ProfileStats() {
  const stats = [
    { label: 'Points', value: 0 },
    { label: 'Skills', value: 3 },
    { label: 'Credentials', value: 0 },
    { label: 'Courses', value: 4 },
    { label: 'Programs', value: 0 },
    { label: 'Pathways', value: 0 },
    { label: 'Resources', value: 0 },
    { label: 'Assessments', value: 0 },
    { label: 'Videos', value: 0 },
  ];

  // Group stats into 3 rows
  const row1 = stats.slice(0, 3);
  const row2 = stats.slice(3, 6);
  const row3 = stats.slice(6, 9);

  return (
    <div className="grid h-full grid-rows-3 gap-4">
      {/* Row 1 */}
      <div className="grid grid-cols-3 gap-4">
        {row1.map((stat) => (
          <div
            key={stat.label}
            className="flex h-full flex-col items-center justify-center rounded-sm border border-[var(--border-light)] bg-[var(--background-light)] p-4 shadow-sm transition-all duration-300 hover:border-[var(--primary-light)] hover:shadow-md"
          >
            <span className="bg-[var(--button-primary-bg)] bg-clip-text text-2xl font-bold text-transparent">
              {stat.value}
            </span>
            <span className="mt-1 text-xs font-medium text-[var(--text-light)]">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-3 gap-4">
        {row2.map((stat) => (
          <div
            key={stat.label}
            className="flex h-full flex-col items-center justify-center rounded-sm border border-[var(--border-light)] bg-[var(--background-light)] p-4 shadow-sm transition-all duration-300 hover:border-[var(--primary-light)] hover:shadow-md"
          >
            <span className="bg-[var(--button-primary-bg)] bg-clip-text text-2xl font-bold text-transparent">
              {stat.value}
            </span>
            <span className="mt-1 text-xs font-medium text-[var(--text-light)]">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-3 gap-4">
        {row3.map((stat) => (
          <div
            key={stat.label}
            className="flex h-full flex-col items-center justify-center rounded-sm border border-[var(--border-light)] bg-[var(--background-light)] p-4 shadow-sm transition-all duration-300 hover:border-[var(--primary-light)] hover:shadow-md"
          >
            <span className="bg-[var(--button-primary-bg)] bg-clip-text text-2xl font-bold text-transparent">
              {stat.value}
            </span>
            <span className="mt-1 text-xs font-medium text-[var(--text-light)]">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
