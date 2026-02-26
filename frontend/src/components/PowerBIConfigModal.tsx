import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink } from 'lucide-react';
import { useSetPowerBIEmbedUrl } from '@/hooks/useQueries';
import { toast } from 'sonner';

interface PowerBIConfigModalProps {
  open: boolean;
  onClose: () => void;
  currentUrl: string | null;
}

export default function PowerBIConfigModal({ open, onClose, currentUrl }: PowerBIConfigModalProps) {
  const [url, setUrl] = useState('');
  const setEmbedUrl = useSetPowerBIEmbedUrl();

  useEffect(() => {
    if (open) {
      setUrl(currentUrl ?? '');
    }
  }, [open, currentUrl]);

  const handleSave = async () => {
    if (!url.trim()) return;
    try {
      await setEmbedUrl.mutateAsync(url.trim());
      toast.success('Power BI embed URL saved successfully.');
      onClose();
    } catch {
      toast.error('Failed to save the embed URL. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Configure Power BI Report</DialogTitle>
          <DialogDescription>
            Enter the Power BI embed URL for the report you want to display. You can find this in the Power BI service under Share → Embed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="embedUrl">Power BI Embed URL</Label>
            <Input
              id="embedUrl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://app.powerbi.com/reportEmbed?reportId=..."
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Paste the full embed URL from Power BI. It typically starts with{' '}
              <code className="bg-muted px-1 rounded">https://app.powerbi.com/reportEmbed</code>
            </p>
          </div>

          {url.trim() && (
            <a
              href={url.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-sidebar-primary hover:underline"
            >
              <ExternalLink size={12} />
              Preview URL in new tab
            </a>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={setEmbedUrl.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!url.trim() || setEmbedUrl.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold gap-2"
          >
            {setEmbedUrl.isPending && <Loader2 size={14} className="animate-spin" />}
            Save URL
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
