import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { useBulkAddResources } from '@/hooks/useQueries';
import { BillabilityStatus, NonBillableStatus, ResourceStatus, Resource } from '@/backend';

interface ResourceImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Full ordered column headers matching the RMG template
const COLUMN_HEADERS = [
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

const BILLABILITY_OPTIONS = ['Billable', 'Non-Billable'];
const NON_BILLABLE_OPTIONS = [
  'Available for Deployment',
  'BI Bench',
  'Partial Bench',
  'Bench Blocked',
  'Maternity',
  'Solution Investment',
  'Delivery Support',
  'Project Buffer',
];

// Sample rows for the downloadable template
const SAMPLE_ROWS = [
  [
    'EMP001',
    'John Smith',
    'john.smith@company.com',
    '+91-9876543210',
    'Bangalore',
    'Acme Corp',
    'Digital Transformation',
    'PRJ-001',
    'Alice Johnson',
    'Bob Williams',
    'Carol Davis',
    'Billable',
    '',
    '5 years',
    '2020-01-15',
    '2024-01-01',
    '2024-12-31',
    'Engineering',
    'Java;Spring Boot;Microservices',
    'Docker;Kubernetes;AWS',
    'Active',
  ],
  [
    'EMP002',
    'Priya Sharma',
    'priya.sharma@company.com',
    '+91-9876543211',
    'Hyderabad',
    '',
    '',
    '',
    'Alice Johnson',
    'Bob Williams',
    'Carol Davis',
    'Non-Billable',
    'Available for Deployment',
    '3 years',
    '2021-06-01',
    '2024-01-01',
    '2024-06-30',
    'QA',
    'Automation Testing;Selenium;Java',
    'Jenkins;Azure DevOps',
    'Active',
  ],
  [
    'EMP003',
    'Rahul Verma',
    'rahul.verma@company.com',
    '+91-9876543212',
    'Mumbai',
    'Beta Ltd',
    'UI Modernization',
    'PRJ-002',
    'David Lee',
    'Eve Martin',
    'Frank Wilson',
    'Billable',
    '',
    '7 years',
    '2018-03-10',
    '2024-02-01',
    '2024-11-30',
    'Frontend',
    'UI;UX;React;TypeScript',
    'Figma;Adobe XD',
    'Active',
  ],
];

function generateSampleCSV(): string {
  const escape = (val: string) =>
    val.includes(',') || val.includes('"') || val.includes('\n')
      ? `"${val.replace(/"/g, '""')}"`
      : val;

  const header = COLUMN_HEADERS.map(escape).join(',');
  const rows = SAMPLE_ROWS.map((row) => row.map(escape).join(','));
  return [header, ...rows].join('\n');
}

function downloadSampleTemplate() {
  const csv = generateSampleCSV();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'resource_import_template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseBillabilityStatus(val: string): BillabilityStatus {
  const v = val.trim().toLowerCase();
  if (v === 'billable') return BillabilityStatus.billable;
  return BillabilityStatus.nonBillable;
}

function parseNonBillableStatus(val: string): NonBillableStatus | undefined {
  const v = val.trim().toLowerCase().replace(/\s+/g, '');
  const map: Record<string, NonBillableStatus> = {
    availablefordeployment: NonBillableStatus.availableForDeployment,
    bibench: NonBillableStatus.biBench,
    partialbench: NonBillableStatus.partialBench,
    benchblocked: NonBillableStatus.benchBlocked,
    maternity: NonBillableStatus.maternity,
    solutioninvestment: NonBillableStatus.solutionInvestment,
    deliverysupport: NonBillableStatus.deliverySupport,
    projectbuffer: NonBillableStatus.projectBuffer,
  };
  return map[v];
}

function parseResourceStatus(val: string): ResourceStatus {
  return val.trim().toLowerCase() === 'inactive'
    ? ResourceStatus.inactive
    : ResourceStatus.active;
}

function parseDateToTime(val: string): bigint {
  if (!val || val.trim() === '') return BigInt(0);
  const d = new Date(val.trim());
  if (isNaN(d.getTime())) return BigInt(0);
  return BigInt(d.getTime()) * BigInt(1_000_000);
}

function parseSkills(val: string): string[] {
  if (!val || val.trim() === '') return [];
  return val
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

function generateId(): string {
  return `res_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface ParsedRow {
  index: number;
  data: Record<string, string>;
  errors: string[];
  resource?: Resource;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((l) => parseCSVLine(l));
  return { headers, rows };
}

// Dynamically load SheetJS for XLSX parsing
async function loadSheetJS(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).XLSX) {
      resolve((window as any).XLSX);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    script.onload = () => resolve((window as any).XLSX);
    script.onerror = () => reject(new Error('Failed to load SheetJS'));
    document.head.appendChild(script);
  });
}

async function parseXLSX(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  const XLSX = await loadSheetJS();
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (data.length === 0) return { headers: [], rows: [] };
  const headers = (data[0] as any[]).map((h: any) => String(h ?? ''));
  const rows = data.slice(1).map((row: any[]) => row.map((cell: any) => String(cell ?? '')));
  return { headers, rows };
}

function mapRowToResource(
  headers: string[],
  row: string[],
  rowIndex: number
): ParsedRow {
  const data: Record<string, string> = {};
  headers.forEach((h, i) => {
    data[h.trim()] = (row[i] ?? '').trim();
  });

  const errors: string[] = [];

  const employeeId = data['Employee ID'] || '';
  const name = data['Name'] || '';
  const email = data['Email ID'] || '';

  if (!employeeId) errors.push('Employee ID is required');
  if (!name) errors.push('Name is required');
  if (!email) errors.push('Email ID is required');

  const billabilityRaw = data['Billability Status'] || 'Billable';
  const billabilityStatus = parseBillabilityStatus(billabilityRaw);
  const nonBillableRaw = data['Non-Billable Category'] || '';
  const nonBillableStatus =
    billabilityStatus === BillabilityStatus.nonBillable
      ? parseNonBillableStatus(nonBillableRaw)
      : undefined;

  const resource: Resource = {
    id: generateId(),
    employeeId,
    name,
    email,
    contactNumber: data['Contact Number'] || '',
    location: data['Location'] || '',
    client: data['Client'] || '',
    project: data['Project'] || '',
    projectId: data['Project ID'] || undefined,
    projectManager: data['Project Manager'] || '',
    reportingManager: data['Reporting Manager'] || '',
    deliveryHead: data['Delivery Head'] || '',
    billabilityStatus,
    nonBillableStatus,
    totalExperience: data['Total Experience'] || '',
    doj: parseDateToTime(data['DOJ'] || ''),
    assignmentStartDate: parseDateToTime(data['Assignment Start Date'] || ''),
    assignmentEndDate: parseDateToTime(data['Assignment End Date'] || ''),
    practice: data['Practice'] || '',
    primarySkills: parseSkills(data['Primary Skills'] || ''),
    secondarySkills: parseSkills(data['Secondary Skills'] || ''),
    status: parseResourceStatus(data['Status'] || 'Active'),
    // Deprecated fields kept for backward compatibility
    role: '',
    department: '',
    skillTags: [],
  };

  return { index: rowIndex, data, errors, resource: errors.length === 0 ? resource : undefined };
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  failedRows: Array<{ row: number; errors: string[] }>;
}

export default function ResourceImportModal({ open, onOpenChange }: ResourceImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkAddMutation = useBulkAddResources();

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setParseError(null);
    setImportResult(null);
    setIsParsing(false);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setParsedRows([]);
    setParseError(null);
    setImportResult(null);
    setIsParsing(true);

    try {
      let headers: string[] = [];
      let rows: string[][] = [];

      const ext = f.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'xls') {
        const result = await parseXLSX(f);
        headers = result.headers;
        rows = result.rows;
      } else {
        const text = await f.text();
        const result = parseCSV(text);
        headers = result.headers;
        rows = result.rows;
      }

      if (headers.length === 0) {
        setParseError('The file appears to be empty or has no headers.');
        setIsParsing(false);
        return;
      }

      // Check for required columns
      const missingCols = ['Employee ID', 'Name', 'Email ID'].filter(
        (col) => !headers.map((h) => h.trim()).includes(col)
      );
      if (missingCols.length > 0) {
        setParseError(`Missing required columns: ${missingCols.join(', ')}`);
        setIsParsing(false);
        return;
      }

      const parsed = rows
        .filter((row) => row.some((cell) => cell.trim() !== ''))
        .map((row, i) => mapRowToResource(headers, row, i + 2));

      setParsedRows(parsed);
    } catch (err: any) {
      setParseError(err?.message || 'Failed to parse file. Please check the format.');
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const validRows = parsedRows.filter((r) => r.errors.length === 0 && r.resource);
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    const resources = validRows.map((r) => r.resource!);

    try {
      await bulkAddMutation.mutateAsync(resources);
      setImportResult({
        total: parsedRows.length,
        success: validRows.length,
        failed: invalidRows.length,
        failedRows: invalidRows.map((r) => ({ row: r.index, errors: r.errors })),
      });
    } catch (err: any) {
      setParseError(err?.message || 'Import failed. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Resources
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with employee resource data. Download the template below to
            see the exact format required.
          </DialogDescription>
        </DialogHeader>

        {/* Success Result */}
        {importResult && (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    Import Complete
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Successfully imported{' '}
                    <span className="font-bold">{importResult.success}</span> of{' '}
                    <span className="font-bold">{importResult.total}</span> records.
                    {importResult.failed > 0 && (
                      <span className="text-amber-700 dark:text-amber-400">
                        {' '}
                        {importResult.failed} record(s) were skipped due to validation errors.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {importResult.failedRows.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
                <p className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  Skipped Rows
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {importResult.failedRows.map((fr) => (
                    <p key={fr.row} className="text-sm text-amber-700 dark:text-amber-400">
                      Row {fr.row}: {fr.errors.join(', ')}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetState}>
                Import More
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}

        {/* Import Flow */}
        {!importResult && (
          <div className="space-y-4">
            {/* Template Download */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>
                  Need the template? Download it with all required columns and sample data.
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={downloadSampleTemplate}>
                <Download className="h-4 w-4 mr-1.5" />
                Download Template
              </Button>
            </div>

            {/* Column Reference */}
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Required Columns (21 total)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {COLUMN_HEADERS.map((col) => (
                  <Badge key={col} variant="secondary" className="text-xs font-normal">
                    {col}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Primary Skills</span> and{' '}
                <span className="font-medium">Secondary Skills</span> should be semicolon-separated
                (e.g., <code className="bg-muted px-1 rounded">Java;Spring Boot;AWS</code>).
                Non-Billable Category is only required when Billability Status is "Non-Billable".
              </p>
            </div>

            {/* Drop Zone */}
            {!file && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium text-foreground">
                  Drop your CSV or Excel file here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse — .csv, .xlsx, .xls supported
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* Parsing Indicator */}
            {isParsing && (
              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Parsing file…</span>
              </div>
            )}

            {/* Parse Error */}
            {parseError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* File Info + Re-select */}
            {file && !isParsing && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Preview Table */}
            {parsedRows.length > 0 && !isParsing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Preview —{' '}
                    <span className="text-green-600 dark:text-green-400">
                      {validRows.length} valid
                    </span>
                    {invalidRows.length > 0 && (
                      <span className="text-destructive ml-1">
                        , {invalidRows.length} with errors
                      </span>
                    )}
                  </p>
                  <Badge variant={invalidRows.length > 0 ? 'destructive' : 'default'}>
                    {parsedRows.length} rows
                  </Badge>
                </div>

                <div className="overflow-x-auto rounded-lg border max-h-64">
                  <table className="text-xs w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">#</th>
                        {COLUMN_HEADERS.map((h) => (
                          <th
                            key={h}
                            className="px-2 py-1.5 text-left font-semibold whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                        <th className="px-2 py-1.5 text-left font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row) => (
                        <tr
                          key={row.index}
                          className={
                            row.errors.length > 0
                              ? 'bg-destructive/5 border-l-2 border-destructive'
                              : 'hover:bg-muted/30'
                          }
                        >
                          <td className="px-2 py-1.5 text-muted-foreground">{row.index}</td>
                          {COLUMN_HEADERS.map((h) => (
                            <td key={h} className="px-2 py-1.5 whitespace-nowrap max-w-[120px] truncate">
                              {row.data[h] || ''}
                            </td>
                          ))}
                          <td className="px-2 py-1.5 whitespace-nowrap">
                            {row.errors.length === 0 ? (
                              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> OK
                              </span>
                            ) : (
                              <span
                                className="text-destructive flex items-center gap-1"
                                title={row.errors.join('; ')}
                              >
                                <AlertCircle className="h-3 w-3" />
                                {row.errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            {parsedRows.length > 0 && !isParsing && (
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  {validRows.length > 0
                    ? `${validRows.length} record(s) will be imported.`
                    : 'No valid records to import.'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetState}>
                    Clear
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={validRows.length === 0 || bulkAddMutation.isPending}
                  >
                    {bulkAddMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing…
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import {validRows.length} Record{validRows.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
