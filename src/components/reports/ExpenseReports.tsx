interface ExpenseReportsProps {
  dateRange: { start: Date; end: Date };
}

export function ExpenseReports({ dateRange }: ExpenseReportsProps) {
  console.log('Date range:', dateRange); // Temporary use to avoid warning
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Expense Reports</h2>
      {/* Add expense content */}
    </div>
  );
} 