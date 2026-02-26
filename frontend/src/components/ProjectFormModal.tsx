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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { Project, ProjectStatus, Resource } from '../backend';
import { generateId, dateToNs, formatDateInput } from '@/lib/utils';

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (project: Project) => Promise<void>;
  initialData?: Project | null;
  resources: Resource[];
  isLoading?: boolean;
}

const statusOptions = [
  { value: ProjectStatus.planning, label: 'Planning' },
  { value: ProjectStatus.active, label: 'Active' },
  { value: ProjectStatus.onHold, label: 'On Hold' },
  { value: ProjectStatus.completed, label: 'Completed' },
];

const today = new Date().toISOString().split('T')[0];

export default function ProjectFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  resources,
  isLoading,
}: ProjectFormModalProps) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: ProjectStatus.planning as ProjectStatus,
    startDate: today,
    endDate: today,
    budget: '0',
    managerName: '',
    assignedResourceIds: [] as string[],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        description: initialData.description,
        status: initialData.status,
        startDate: formatDateInput(initialData.startDate),
        endDate: formatDateInput(initialData.endDate),
        budget: String(Number(initialData.budget)),
        managerName: initialData.managerName,
        assignedResourceIds: [...initialData.assignedResourceIds],
      });
    } else {
      setForm({
        name: '',
        description: '',
        status: ProjectStatus.planning,
        startDate: today,
        endDate: today,
        budget: '0',
        managerName: '',
        assignedResourceIds: [],
      });
    }
    setError('');
  }, [initialData, open]);

  const toggleResource = (id: string) => {
    setForm((f) => ({
      ...f,
      assignedResourceIds: f.assignedResourceIds.includes(id)
        ? f.assignedResourceIds.filter((r) => r !== id)
        : [...f.assignedResourceIds, id],
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.managerName.trim()) {
      setError('Name and Manager are required.');
      return;
    }
    setError('');
    const project: Project = {
      id: initialData?.id ?? generateId(),
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      startDate: dateToNs(new Date(form.startDate)),
      endDate: dateToNs(new Date(form.endDate)),
      budget: BigInt(parseInt(form.budget) || 0),
      managerName: form.managerName.trim(),
      assignedResourceIds: form.assignedResourceIds,
      milestones: initialData?.milestones ?? [],
    };
    await onSubmit(project);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">
            {initialData ? 'Edit Project' : 'New Project'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="proj-name">Project Name *</Label>
              <Input
                id="proj-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Website Redesign"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea
                id="proj-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief project description..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as ProjectStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-manager">Manager *</Label>
                <Input
                  id="proj-manager"
                  value={form.managerName}
                  onChange={(e) => setForm((f) => ({ ...f, managerName: e.target.value }))}
                  placeholder="Manager name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="proj-start">Start Date</Label>
                <Input
                  id="proj-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-end">End Date</Label>
                <Input
                  id="proj-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proj-budget">Budget (USD)</Label>
              <Input
                id="proj-budget"
                type="number"
                min={0}
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                placeholder="0"
              />
            </div>

            {resources.length > 0 && (
              <div className="space-y-1.5">
                <Label>Assigned Resources</Label>
                <div className="border border-border rounded-lg p-3 space-y-2 max-h-36 overflow-y-auto">
                  {resources.map((r) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`res-${r.id}`}
                        checked={form.assignedResourceIds.includes(r.id)}
                        onCheckedChange={() => toggleResource(r.id)}
                      />
                      <label
                        htmlFor={`res-${r.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {r.name}
                        <span className="text-xs text-muted-foreground ml-1">({r.role})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
          >
            {isLoading && <Loader2 size={14} className="mr-2 animate-spin" />}
            {initialData ? 'Save Changes' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
