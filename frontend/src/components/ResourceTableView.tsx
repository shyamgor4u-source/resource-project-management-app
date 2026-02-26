import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Resource, ResourceStatus, BillabilityStatus } from '../backend';
import { cn, formatDate } from '@/lib/utils';

interface ResourceTableViewProps {
  resources: Resource[];
  onEdit: (resource: Resource) => void;
  onDelete: (id: string) => void;
}

type SortKey =
  | 'employeeId'
  | 'name'
  | 'email'
  | 'contactNumber'
  | 'location'
  | 'client'
  | 'project'
  | 'projectManager'
  | 'reportingManager'
  | 'deliveryHead'
  | 'assignmentStartDate'
  | 'assignmentEndDate'
  | 'billabilityStatus'
  | 'nonBillableStatus'
  | 'status';

type SortDir = 'asc' | 'desc';

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown size={12} className="ml-1 opacity-40 flex-shrink-0" />;
  return sortDir === 'asc'
    ? <ArrowUp size={12} className="ml-1 text-sidebar-primary flex-shrink-0" />
    : <ArrowDown size={12} className="ml-1 text-sidebar-primary flex-shrink-0" />;
}

function StatusBadge({ status }: { status: ResourceStatus }) {
  const isActive = status === ResourceStatus.active;
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium whitespace-nowrap',
        isActive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
          : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-700'
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}

function BillabilityBadge({ status }: { status: BillabilityStatus }) {
  const isBillable = status === BillabilityStatus.billable;
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium whitespace-nowrap',
        isBillable
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
      )}
    >
      {isBillable ? 'Billable' : 'Non-Billable'}
    </Badge>
  );
}

const NON_BILLABLE_LABELS: Record<string, string> = {
  availableForDeployment: 'Available for Deployment',
  biBench: 'BI Bench',
  partialBench: 'Partial Bench',
  benchBlocked: 'Bench Blocked',
  maternity: 'Maternity',
  solutionInvestment: 'Solution Investment',
  deliverySupport: 'Delivery Support',
  projectBuffer: 'Project Buffer',
};

export default function ResourceTableView({ resources, onEdit, onDelete }: ResourceTableViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...resources].sort((a, b) => {
    let aVal = '';
    let bVal = '';
    if (sortKey === 'assignmentStartDate' || sortKey === 'assignmentEndDate') {
      const aNum = Number(a[sortKey] ?? 0n);
      const bNum = Number(b[sortKey] ?? 0n);
      return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
    } else if (sortKey === 'billabilityStatus') {
      aVal = a.billabilityStatus ?? '';
      bVal = b.billabilityStatus ?? '';
    } else if (sortKey === 'nonBillableStatus') {
      aVal = a.nonBillableStatus ?? '';
      bVal = b.nonBillableStatus ?? '';
    } else if (sortKey === 'status') {
      aVal = a.status;
      bVal = b.status;
    } else {
      aVal = (a[sortKey] as string) ?? '';
      bVal = (b[sortKey] as string) ?? '';
    }
    const cmp = aVal.localeCompare(bVal);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortableHead = ({ col, label }: { col: SortKey; label: string }) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap hover:bg-muted/50 transition-colors text-xs font-semibold"
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-0.5">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </TableHead>
  );

  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <SortableHead col="employeeId" label="Employee ID" />
              <SortableHead col="name" label="Name" />
              <TableHead className="whitespace-nowrap text-xs font-semibold">Email ID</TableHead>
              <SortableHead col="contactNumber" label="Contact Number" />
              <SortableHead col="location" label="Location" />
              <SortableHead col="client" label="Client" />
              <SortableHead col="project" label="Project" />
              <TableHead className="whitespace-nowrap text-xs font-semibold">Project ID</TableHead>
              <SortableHead col="projectManager" label="PM" />
              <SortableHead col="reportingManager" label="RM" />
              <SortableHead col="deliveryHead" label="Delivery Head" />
              <SortableHead col="assignmentStartDate" label="Assignment Start Date" />
              <SortableHead col="assignmentEndDate" label="Assignment End Date" />
              <SortableHead col="billabilityStatus" label="Billability Status" />
              <SortableHead col="nonBillableStatus" label="Non-Billable Category" />
              <TableHead className="whitespace-nowrap text-xs font-semibold">Primary Skills</TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold">Secondary Skills</TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold">Practice</TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold">Experience</TableHead>
              <SortableHead col="status" label="Active Status" />
              <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={21} className="text-center text-muted-foreground py-10 text-sm">
                  No resources found. Add your first resource or import from CSV.
                </TableCell>
              </TableRow>
            )}
            {sorted.map((resource) => (
              <TableRow key={resource.id} className="hover:bg-muted/20 transition-colors group">
                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {resource.employeeId || resource.id}
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 font-semibold text-xs">
                        {resource.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm">{resource.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {resource.email}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                  {resource.contactNumber || '—'}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {resource.location || '—'}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {resource.client || '—'}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {resource.project || '—'}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                  {resource.projectId || '—'}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {resource.projectManager || '—'}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {resource.reportingManager || '—'}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {resource.deliveryHead || '—'}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                  {resource.assignmentStartDate && resource.assignmentStartDate !== 0n
                    ? formatDate(resource.assignmentStartDate)
                    : '—'}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                  {resource.assignmentEndDate && resource.assignmentEndDate !== 0n
                    ? formatDate(resource.assignmentEndDate)
                    : '—'}
                </TableCell>
                <TableCell>
                  <BillabilityBadge status={resource.billabilityStatus} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {resource.nonBillableStatus ? (
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800 whitespace-nowrap"
                    >
                      {NON_BILLABLE_LABELS[resource.nonBillableStatus] ?? resource.nonBillableStatus}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 min-w-[120px] max-w-[200px]">
                    {(resource.primarySkills ?? []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground border border-border whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                    {(resource.primarySkills ?? []).length > 3 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        +{resource.primarySkills.length - 3}
                      </span>
                    )}
                    {(resource.primarySkills ?? []).length === 0 && (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 min-w-[120px] max-w-[200px]">
                    {(resource.secondarySkills ?? []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground border border-border whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                    {(resource.secondarySkills ?? []).length > 3 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        +{resource.secondarySkills.length - 3}
                      </span>
                    )}
                    {(resource.secondarySkills ?? []).length === 0 && (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {resource.practice || '—'}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                  {resource.totalExperience || '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={resource.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => onEdit(resource)}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(resource.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
