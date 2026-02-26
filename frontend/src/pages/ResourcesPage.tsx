import { useState } from 'react';
import { useResources, useAddResource } from '../hooks/useQueries';
import ResourceTableView from '../components/ResourceTableView';
import ResourceCard from '../components/ResourceCard';
import ResourceFormModal from '../components/ResourceFormModal';
import ResourceImportModal from '../components/ResourceImportModal';
import ResourceTableSkeleton from '../components/ResourceTableSkeleton';
import ResourceCardSkeleton from '../components/ResourceCardSkeleton';
import { exportResourcesAsCSV } from '../utils/exportUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LayoutGrid, List, Plus, Download, Upload, Search } from 'lucide-react';
import { Resource, BillabilityStatus } from '../backend';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ResourcesPageProps {
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
  canImport?: boolean;
}

export default function ResourcesPage({
  canEdit = true,
  canDelete = true,
  canCreate = true,
  canImport = true,
}: ResourcesPageProps) {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [search, setSearch] = useState('');
  const [billabilityFilter, setBillabilityFilter] = useState<string>('all');
  const [practiceFilter, setPracticeFilter] = useState<string>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);

  const { data: resources, isLoading } = useResources();
  const addResourceMutation = useAddResource();

  const practices: string[] = Array.from(
    new Set((resources ?? []).map((r) => r.practice).filter((p): p is string => Boolean(p)))
  );

  const filtered = (resources ?? []).filter((r) => {
    const matchesSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(search.toLowerCase());

    const matchesBillability =
      billabilityFilter === 'all' ||
      (billabilityFilter === 'billable' && r.billabilityStatus === BillabilityStatus.billable) ||
      (billabilityFilter === 'nonBillable' &&
        r.billabilityStatus === BillabilityStatus.nonBillable);

    const matchesPractice = practiceFilter === 'all' || r.practice === practiceFilter;

    return matchesSearch && matchesBillability && matchesPractice;
  });

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setShowFormModal(true);
  };

  const handleDelete = (id: string) => {
    setDeletingResourceId(id);
  };

  const confirmDelete = async () => {
    // Delete not implemented in backend
    setDeletingResourceId(null);
  };

  const handleFormSubmit = async (resource: Resource) => {
    await addResourceMutation.mutateAsync(resource);
    setShowFormModal(false);
    setEditingResource(null);
  };

  const noopEdit = (_resource: Resource) => {};
  const noopDelete = (_id: string) => {};

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <p className="text-sm text-muted-foreground">
          Manage your team members and their assignments
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={billabilityFilter} onValueChange={setBillabilityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Billability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Billability</SelectItem>
            <SelectItem value="billable">Billable</SelectItem>
            <SelectItem value="nonBillable">Non-Billable</SelectItem>
          </SelectContent>
        </Select>

        <Select value={practiceFilter} onValueChange={setPracticeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Practice" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Practices</SelectItem>
            {practices.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 border border-border rounded-lg p-1">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'card' ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('card')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={() => exportResourcesAsCSV(filtered)}>
          <Download className="h-4 w-4 mr-1.5" />
          Export CSV
        </Button>

        {canImport && (
          <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-1.5" />
            Import
          </Button>
        )}

        {canCreate && (
          <Button size="sm" onClick={() => setShowFormModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Resource
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        viewMode === 'table' ? (
          <ResourceTableSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ResourceCardSkeleton key={i} />
            ))}
          </div>
        )
      ) : viewMode === 'table' ? (
        <ResourceTableView
          resources={filtered}
          onEdit={canEdit ? handleEdit : noopEdit}
          onDelete={canDelete ? handleDelete : noopDelete}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              onEdit={canEdit ? handleEdit : noopEdit}
              onDelete={canDelete ? handleDelete : noopDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showFormModal && (
        <ResourceFormModal
          open={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingResource(null);
          }}
          onSubmit={handleFormSubmit}
          initialData={editingResource ?? undefined}
          isLoading={addResourceMutation.isPending}
        />
      )}

      {showImportModal && (
        <ResourceImportModal
          open={showImportModal}
          onOpenChange={(open) => setShowImportModal(open)}
        />
      )}

      <AlertDialog open={!!deletingResourceId} onOpenChange={() => setDeletingResourceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resource? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
