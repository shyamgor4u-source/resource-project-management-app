import { useState, useEffect, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Loader2, ChevronDown, Search, Plus } from 'lucide-react';
import { Resource, ResourceStatus, BillabilityStatus, NonBillableStatus } from '../backend';
import { generateId, dateToNs, formatDateInput } from '@/lib/utils';
import { useMultiSelectDropdown, SKILL_OPTIONS } from '@/hooks/useMultiSelectDropdown';
import { cn } from '@/lib/utils';

interface ResourceFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (resource: Resource) => Promise<void>;
  initialData?: Resource | null;
  isLoading?: boolean;
}

const NON_BILLABLE_OPTIONS: { value: NonBillableStatus; label: string }[] = [
  { value: NonBillableStatus.availableForDeployment, label: 'Available for Deployment' },
  { value: NonBillableStatus.biBench, label: 'BI Bench' },
  { value: NonBillableStatus.partialBench, label: 'Partial Bench' },
  { value: NonBillableStatus.benchBlocked, label: 'Bench Blocked' },
  { value: NonBillableStatus.maternity, label: 'Maternity' },
  { value: NonBillableStatus.solutionInvestment, label: 'Solution Investment' },
  { value: NonBillableStatus.deliverySupport, label: 'Delivery Support' },
  { value: NonBillableStatus.projectBuffer, label: 'Project Buffer' },
];

interface SkillsMultiSelectProps {
  label: string;
  selected: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  filteredOptions: string[];
  customInput: string;
  onCustomInputChange: (v: string) => void;
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
}

function SkillsMultiSelect({
  label,
  selected,
  onAdd,
  onRemove,
  search,
  onSearchChange,
  filteredOptions,
  customInput,
  onCustomInputChange,
  isOpen,
  onOpenChange,
}: SkillsMultiSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onOpenChange]);

  const handleAddCustom = () => {
    if (customInput.trim()) {
      onAdd(customInput.trim());
    }
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <Label>{label}</Label>
      <div
        className={cn(
          'min-h-[38px] w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm cursor-pointer transition-colors',
          isOpen && 'ring-2 ring-ring ring-offset-0'
        )}
        onClick={() => onOpenChange(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 items-center">
          {selected.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="gap-1 pr-1 text-xs cursor-default"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(skill);
              }}
            >
              {skill}
              <X size={10} />
            </Badge>
          ))}
          <span className="flex items-center gap-1 text-muted-foreground text-xs ml-auto">
            <ChevronDown size={14} />
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="relative z-50">
          <div className="absolute top-0 left-0 right-0 rounded-md border border-border bg-popover shadow-lg">
            {/* Search */}
            <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border">
              <Search size={13} className="text-muted-foreground flex-shrink-0" />
              <input
                autoFocus
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Search skills..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Options list */}
            <ScrollArea className="max-h-[160px]">
              <div className="py-1">
                {filteredOptions.length === 0 && !search && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">All options selected</div>
                )}
                {filteredOptions.map((opt) => (
                  <div
                    key={opt}
                    className="px-3 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(opt);
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Custom / Other entry */}
            <div className="border-t border-border px-2 py-1.5 flex gap-1.5 items-center">
              <input
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Other (write option)..."
                value={customInput}
                onChange={(e) => onCustomInputChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddCustom();
                }}
              >
                <Plus size={12} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResourceFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: ResourceFormModalProps) {
  const [form, setForm] = useState({
    employeeId: '',
    name: '',
    email: '',
    contactNumber: '',
    location: '',
    client: '',
    project: '',
    projectId: '',
    projectManager: '',
    reportingManager: '',
    deliveryHead: '',
    billabilityStatus: BillabilityStatus.billable as BillabilityStatus,
    nonBillableStatus: '' as NonBillableStatus | '',
    totalExperience: '',
    doj: '',
    assignmentStartDate: '',
    assignmentEndDate: '',
    practice: '',
    status: ResourceStatus.active as ResourceStatus,
    role: '',
    department: '',
  });
  const [error, setError] = useState('');

  const primarySkills = useMultiSelectDropdown({ options: SKILL_OPTIONS });
  const secondarySkills = useMultiSelectDropdown({ options: SKILL_OPTIONS });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          employeeId: initialData.employeeId ?? '',
          name: initialData.name,
          email: initialData.email,
          contactNumber: initialData.contactNumber ?? '',
          location: initialData.location ?? '',
          client: initialData.client ?? '',
          project: initialData.project ?? '',
          projectId: initialData.projectId ?? '',
          projectManager: initialData.projectManager ?? '',
          reportingManager: initialData.reportingManager ?? '',
          deliveryHead: initialData.deliveryHead ?? '',
          billabilityStatus: initialData.billabilityStatus ?? BillabilityStatus.billable,
          nonBillableStatus: (initialData.nonBillableStatus as NonBillableStatus) ?? '',
          totalExperience: initialData.totalExperience ?? '',
          doj: initialData.doj && initialData.doj !== 0n ? formatDateInput(initialData.doj) : '',
          assignmentStartDate:
            initialData.assignmentStartDate && initialData.assignmentStartDate !== 0n
              ? formatDateInput(initialData.assignmentStartDate)
              : '',
          assignmentEndDate:
            initialData.assignmentEndDate && initialData.assignmentEndDate !== 0n
              ? formatDateInput(initialData.assignmentEndDate)
              : '',
          practice: initialData.practice ?? '',
          status: initialData.status,
          role: initialData.role ?? '',
          department: initialData.department ?? '',
        });
        primarySkills.reset(initialData.primarySkills ?? []);
        secondarySkills.reset(initialData.secondarySkills ?? []);
      } else {
        setForm({
          employeeId: '',
          name: '',
          email: '',
          contactNumber: '',
          location: '',
          client: '',
          project: '',
          projectId: '',
          projectManager: '',
          reportingManager: '',
          deliveryHead: '',
          billabilityStatus: BillabilityStatus.billable,
          nonBillableStatus: '',
          totalExperience: '',
          doj: '',
          assignmentStartDate: '',
          assignmentEndDate: '',
          practice: '',
          status: ResourceStatus.active,
          role: '',
          department: '',
        });
        primarySkills.reset([]);
        secondarySkills.reset([]);
      }
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, open]);

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.employeeId.trim()) {
      setError('Employee ID, Name, and Email are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (
      form.billabilityStatus === BillabilityStatus.nonBillable &&
      !form.nonBillableStatus
    ) {
      setError('Please select a Non-Billable Status.');
      return;
    }
    setError('');

    const resource: Resource = {
      id: initialData?.id ?? generateId(),
      employeeId: form.employeeId.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      contactNumber: form.contactNumber.trim(),
      location: form.location.trim(),
      client: form.client.trim(),
      project: form.project.trim(),
      projectId: form.projectId.trim() || undefined,
      projectManager: form.projectManager.trim(),
      reportingManager: form.reportingManager.trim(),
      deliveryHead: form.deliveryHead.trim(),
      billabilityStatus: form.billabilityStatus,
      nonBillableStatus:
        form.billabilityStatus === BillabilityStatus.nonBillable && form.nonBillableStatus
          ? (form.nonBillableStatus as NonBillableStatus)
          : undefined,
      totalExperience: form.totalExperience.trim(),
      doj: form.doj ? dateToNs(new Date(form.doj)) : 0n,
      assignmentStartDate: form.assignmentStartDate
        ? dateToNs(new Date(form.assignmentStartDate))
        : 0n,
      assignmentEndDate: form.assignmentEndDate
        ? dateToNs(new Date(form.assignmentEndDate))
        : 0n,
      practice: form.practice.trim(),
      primarySkills: primarySkills.selected,
      secondarySkills: secondarySkills.selected,
      status: form.status,
      // Deprecated fields kept for backward compatibility
      role: form.role.trim(),
      department: form.department.trim(),
      skillTags: [...primarySkills.selected, ...secondarySkills.selected],
    };

    await onSubmit(resource);
  };

  const isNonBillable = form.billabilityStatus === BillabilityStatus.nonBillable;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {initialData ? 'Edit Resource' : 'Add Resource'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Section: Basic Info */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input
                  id="employeeId"
                  value={form.employeeId}
                  onChange={(e) => set('employeeId', e.target.value)}
                  placeholder="EMP001"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email ID *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="jane@company.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  value={form.contactNumber}
                  onChange={(e) => set('contactNumber', e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="Bangalore"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="totalExperience">Total Experience</Label>
                <Input
                  id="totalExperience"
                  value={form.totalExperience}
                  onChange={(e) => set('totalExperience', e.target.value)}
                  placeholder="5 years"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doj">Date of Joining (DOJ)</Label>
                <Input
                  id="doj"
                  type="date"
                  value={form.doj}
                  onChange={(e) => set('doj', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="practice">Practice</Label>
                <Input
                  id="practice"
                  value={form.practice}
                  onChange={(e) => set('practice', e.target.value)}
                  placeholder="Digital Engineering"
                />
              </div>
            </div>
          </div>

          {/* Section: Project Info */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Project Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="client">Client</Label>
                <Input
                  id="client"
                  value={form.client}
                  onChange={(e) => set('client', e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="project">Project</Label>
                <Input
                  id="project"
                  value={form.project}
                  onChange={(e) => set('project', e.target.value)}
                  placeholder="Project Alpha"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="projectId">Project ID (optional)</Label>
                <Input
                  id="projectId"
                  value={form.projectId}
                  onChange={(e) => set('projectId', e.target.value)}
                  placeholder="PRJ-001"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="projectManager">Project Manager</Label>
                <Input
                  id="projectManager"
                  value={form.projectManager}
                  onChange={(e) => set('projectManager', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reportingManager">Reporting Manager</Label>
                <Input
                  id="reportingManager"
                  value={form.reportingManager}
                  onChange={(e) => set('reportingManager', e.target.value)}
                  placeholder="Sarah Lee"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deliveryHead">Delivery Head</Label>
                <Input
                  id="deliveryHead"
                  value={form.deliveryHead}
                  onChange={(e) => set('deliveryHead', e.target.value)}
                  placeholder="Mike Johnson"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="assignmentStartDate">Assignment Start Date</Label>
                <Input
                  id="assignmentStartDate"
                  type="date"
                  value={form.assignmentStartDate}
                  onChange={(e) => set('assignmentStartDate', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="assignmentEndDate">Assignment End Date</Label>
                <Input
                  id="assignmentEndDate"
                  type="date"
                  value={form.assignmentEndDate}
                  onChange={(e) => set('assignmentEndDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section: Billability */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Billability
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="billabilityStatus">Billability Status *</Label>
                <Select
                  value={form.billabilityStatus}
                  onValueChange={(v) => {
                    set('billabilityStatus', v);
                    if (v === BillabilityStatus.billable) {
                      set('nonBillableStatus', '');
                    }
                  }}
                >
                  <SelectTrigger id="billabilityStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BillabilityStatus.billable}>Billable</SelectItem>
                    <SelectItem value={BillabilityStatus.nonBillable}>Non-Billable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isNonBillable && (
                <div className="space-y-1.5">
                  <Label htmlFor="nonBillableStatus">Non-Billable Status *</Label>
                  <Select
                    value={form.nonBillableStatus}
                    onValueChange={(v) => set('nonBillableStatus', v)}
                  >
                    <SelectTrigger id="nonBillableStatus">
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {NON_BILLABLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="status">Active Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => set('status', v as ResourceStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ResourceStatus.active}>Active</SelectItem>
                    <SelectItem value={ResourceStatus.inactive}>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Skills */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Skills
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <SkillsMultiSelect
                label="Primary Skills"
                selected={primarySkills.selected}
                onAdd={primarySkills.addItem}
                onRemove={primarySkills.removeItem}
                search={primarySkills.search}
                onSearchChange={primarySkills.setSearch}
                filteredOptions={primarySkills.filteredOptions}
                customInput={primarySkills.customInput}
                onCustomInputChange={primarySkills.setCustomInput}
                isOpen={primarySkills.isOpen}
                onOpenChange={primarySkills.setIsOpen}
              />
              <SkillsMultiSelect
                label="Secondary Skills"
                selected={secondarySkills.selected}
                onAdd={secondarySkills.addItem}
                onRemove={secondarySkills.removeItem}
                search={secondarySkills.search}
                onSearchChange={secondarySkills.setSearch}
                filteredOptions={secondarySkills.filteredOptions}
                customInput={secondarySkills.customInput}
                onCustomInputChange={secondarySkills.setCustomInput}
                isOpen={secondarySkills.isOpen}
                onOpenChange={secondarySkills.setIsOpen}
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive mt-1 px-1">{error}</p>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
          >
            {isLoading && <Loader2 size={14} className="mr-2 animate-spin" />}
            {initialData ? 'Save Changes' : 'Add Resource'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
