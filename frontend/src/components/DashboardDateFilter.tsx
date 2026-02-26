import { useState, useEffect } from 'react';
import { CalendarDays, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface FilterState {
  selectedMonth: number;   // 1-12
  selectedYear: number;
  selectedDate: Date | null;
}

interface DashboardDateFilterProps {
  value: FilterState;
  onChange: (state: FilterState) => void;
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

function getYearRange(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current - 2; y <= current + 2; y++) years.push(y);
  return years;
}

export default function DashboardDateFilter({ value, onChange }: DashboardDateFilterProps) {
  const [dateInput, setDateInput] = useState<string>('');

  // Sync dateInput when selectedDate is cleared externally
  useEffect(() => {
    if (!value.selectedDate) setDateInput('');
  }, [value.selectedDate]);

  const handleMonthChange = (v: string) => {
    onChange({ ...value, selectedMonth: Number(v) });
  };

  const handleYearChange = (v: string) => {
    onChange({ ...value, selectedYear: Number(v) });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDateInput(raw);
    if (!raw) {
      onChange({ ...value, selectedDate: null });
      return;
    }
    const parsed = new Date(raw + 'T00:00:00');
    if (!isNaN(parsed.getTime())) {
      // Auto-sync month/year to match the chosen date
      onChange({
        selectedMonth: parsed.getMonth() + 1,
        selectedYear: parsed.getFullYear(),
        selectedDate: parsed,
      });
    }
  };

  const clearDate = () => {
    setDateInput('');
    onChange({ ...value, selectedDate: null });
  };

  const years = getYearRange();

  return (
    <div className="flex flex-wrap items-end gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground mr-1">
        <CalendarDays size={16} />
        <span className="text-xs font-medium uppercase tracking-wide">Filter Period</span>
      </div>

      {/* Month */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Month</Label>
        <Select value={String(value.selectedMonth)} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={String(m.value)}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Year */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Year</Label>
        <Select value={String(value.selectedYear)} onValueChange={handleYearChange}>
          <SelectTrigger className="w-24 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Specific Date */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Specific Date (optional)</Label>
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={dateInput}
            onChange={handleDateChange}
            className="h-8 text-sm w-40"
          />
          {value.selectedDate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={clearDate}
              title="Clear date"
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
