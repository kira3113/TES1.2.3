interface EmployeeReportsProps {
  dateRange: { start: Date; end: Date };
}

export function EmployeeReports({ dateRange }: EmployeeReportsProps) {
  console.log('Date range:', dateRange); // Temporary use to avoid warning
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Employee Reports</h2>
      {/* Add employee content */}
    </div>
  );
} 