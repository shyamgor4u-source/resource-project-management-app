import { Resource, BillabilityStatus, NonBillableStatus, ResourceStatus } from '@/backend';

// Full ordered column headers matching the RMG template
const EXPORT_HEADERS = [
  'Employee ID',
  'Name',
  'Email ID',
  'Contact Number',
  'Location',
  'Client',
  'Project',
  'Project ID',
  'Project Manager',
  'Reporting Manager',
  'Delivery Head',
  'Billability Status',
  'Non-Billable Category',
  'Total Experience',
  'DOJ',
  'Assignment Start Date',
  'Assignment End Date',
  'Practice',
  'Primary Skills',
  'Secondary Skills',
  'Status',
];

function formatBillabilityStatus(status: BillabilityStatus): string {
  return status === BillabilityStatus.billable ? 'Billable' : 'Non-Billable';
}

function formatNonBillableStatus(status: NonBillableStatus | undefined): string {
  if (!status) return '';
  const map: Record<NonBillableStatus, string> = {
    [NonBillableStatus.availableForDeployment]: 'Available for Deployment',
    [NonBillableStatus.biBench]: 'BI Bench',
    [NonBillableStatus.partialBench]: 'Partial Bench',
    [NonBillableStatus.benchBlocked]: 'Bench Blocked',
    [NonBillableStatus.maternity]: 'Maternity',
    [NonBillableStatus.solutionInvestment]: 'Solution Investment',
    [NonBillableStatus.deliverySupport]: 'Delivery Support',
    [NonBillableStatus.projectBuffer]: 'Project Buffer',
  };
  return map[status] ?? '';
}

function formatResourceStatus(status: ResourceStatus): string {
  return status === ResourceStatus.active ? 'Active' : 'Inactive';
}

function formatDate(time: bigint): string {
  if (!time || time === BigInt(0)) return '';
  try {
    const ms = Number(time) / 1_000_000;
    const d = new Date(ms);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function resourceToRow(resource: Resource): string[] {
  return [
    resource.employeeId ?? '',
    resource.name ?? '',
    resource.email ?? '',
    resource.contactNumber ?? '',
    resource.location ?? '',
    resource.client ?? '',
    resource.project ?? '',
    resource.projectId ?? '',
    resource.projectManager ?? '',
    resource.reportingManager ?? '',
    resource.deliveryHead ?? '',
    formatBillabilityStatus(resource.billabilityStatus),
    formatNonBillableStatus(resource.nonBillableStatus),
    resource.totalExperience ?? '',
    formatDate(resource.doj),
    formatDate(resource.assignmentStartDate),
    formatDate(resource.assignmentEndDate),
    resource.practice ?? '',
    (resource.primarySkills ?? []).join(';'),
    (resource.secondarySkills ?? []).join(';'),
    formatResourceStatus(resource.status),
  ];
}

export function exportResourcesAsCSV(resources: Resource[], filename?: string): void {
  const headerLine = EXPORT_HEADERS.map(escapeCSV).join(',');
  const dataLines = resources.map((r) => resourceToRow(r).map(escapeCSV).join(','));
  const csv = [headerLine, ...dataLines].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const timestamp = new Date().toISOString().slice(0, 10);
  link.download = filename ?? `resources_export_${timestamp}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportResourcesAsXLSX(resources: Resource[], filename?: string): void {
  // Build CSV and trigger download as .csv since xlsx library is not bundled.
  // For true XLSX, integrate SheetJS (xlsx) package.
  exportResourcesAsCSV(resources, filename?.replace('.xlsx', '.csv'));
}
