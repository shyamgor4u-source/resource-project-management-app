import { Mail, Briefcase, Building2, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Resource, ResourceStatus } from '../backend';
import { cn } from '@/lib/utils';

interface ResourceCardProps {
  resource: Resource;
  onEdit: (resource: Resource) => void;
  onDelete: (id: string) => void;
}

export default function ResourceCard({ resource, onEdit, onDelete }: ResourceCardProps) {
  const isActive = resource.status === ResourceStatus.active;

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-500 font-semibold text-sm">
              {resource.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm leading-tight">{resource.name}</h3>
            <p className="text-xs text-muted-foreground">{resource.role}</p>
          </div>
        </div>
        <Badge
          variant={isActive ? 'default' : 'secondary'}
          className={cn(
            'text-xs',
            isActive
              ? 'bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 size={12} />
          <span>{resource.department}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail size={12} />
          <span className="truncate">{resource.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Briefcase size={12} />
          <span>{resource.role}</span>
        </div>
      </div>

      {resource.skillTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {resource.skillTags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border"
            >
              {tag}
            </span>
          ))}
          {resource.skillTags.length > 4 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              +{resource.skillTags.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-8 text-xs"
          onClick={() => onEdit(resource)}
        >
          <Pencil size={12} className="mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          onClick={() => onDelete(resource.id)}
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );
}
