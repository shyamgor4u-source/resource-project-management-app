import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { TimesheetEntry, TimesheetStatus, Project, Resource } from '../backend';
import { generateId, dateToNs, formatDateInput, nsToDate } from '@/lib/utils';

interface TimesheetEntryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (entry: TimesheetEntry) => Promise<void>;
  initialData?: TimesheetEntry | null;
  projects: Project[];
  resources: Resource[];
  isLoading?: boolean;
}

export default function TimesheetEntryFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  projects,
  resources,
  isLoading,
}: TimesheetEntryFormModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    resourceId: '',
    projectId: '',
    date: today,
    hoursLogged: '8',
    description: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        resourceId: initialData.resourceId,
        projectId: initialData.projectId,
        date: formatDateInput(initialData.date),
        hoursLogged: String(Number(initialData.hoursLogged)),
        description: initialData.description,
      });
    } else {
      setForm({ resourceId: '', projectId: '', date: today, hoursLogged: '8', description: '' });
    }
    setError('');
  }, [initialData, open]);

  const handleSubmit = async () => {
    if (!form.resourceId || !form.projectId || !form.date || !form.hoursLogged) {
      setError('Please fill in all required fields.');
      return;
    }
    const hours = parseInt(form.hoursLogged);
    if (isNaN(hours) || hours < 1 || hours > 24) {
      setError('Hours must be between 1 and 24.');
      return;
    }
    setError('');
    const entry: TimesheetEntry = {
      id: initialData?.id ?? generateId(),
      resourceId: form.resourceId,
      projectId: form.projectId,
      date: dateToNs(new Date(form.date)),
      hoursLogged: BigInt(hours),
      description: form.description.trim(),
      status: initialData?.status ?? TimesheetStatus.draft,
    };
    await onSubmit(entry);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {initialData ? 'Edit Timesheet Entry' : 'Log Time'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Resource *</Label>
            <Select value={form.resourceId} onValueChange={(v) => setForm((f) => ({ ...f, resourceId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select resource..." />
              </SelectTrigger>
              <SelectContent>
                {resources.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Project *</Label>
            <Select value={form.projectId} onValueChange={(v) => setForm((f) => ({ ...f, projectId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ts-date">Date *</Label>
              <Input
                id="ts-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ts-hours">Hours *</Label>
              <Input
                id="ts-hours"
                type="number"
                min={1}
                max={24}
                value={form.hoursLogged}
                onChange={(e) => setForm((f) => ({ ...f, hoursLogged: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ts-desc">Description</Label>
            <Textarea
              id="ts-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What did you work on?"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
          >
            {isLoading && <Loader2 size={14} className="mr-2 animate-spin" />}
            {initialData ? 'Save Changes' : 'Log Time'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
