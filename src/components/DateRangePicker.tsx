interface DateRangePickerProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex gap-4">
      <input
        type="date"
        value={value.start.toISOString().split('T')[0]}
        onChange={(e) => onChange({ 
          ...value,
          start: new Date(e.target.value)
        })}
        className="border rounded p-2"
      />
      <input
        type="date"
        value={value.end.toISOString().split('T')[0]}
        onChange={(e) => onChange({
          ...value,
          end: new Date(e.target.value)
        })}
        className="border rounded p-2"
      />
    </div>
  );
} 