import { useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { fetchAssets } from "@/store/slices/assetsSlice";
import { assetsService } from "@/services/assets.service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkImportDialog({ open, onOpenChange }: BulkImportDialogProps) {
  const dispatch = useAppDispatch();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    created: number;
    updated: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension !== 'csv' && extension !== 'json') {
        toast.error("Please select a CSV or JSON file");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await assetsService.bulkImport(file);
      setResult(response);

      if (response.errors.length === 0) {
        toast.success(
          `Successfully imported ${response.created} new assets and updated ${response.updated} existing assets`
        );
        dispatch(fetchAssets({ page: 1, pageSize: 50 }));
        onOpenChange(false);
        setFile(null);
      } else {
        toast.warning(
          `Imported ${response.created + response.updated} assets, but ${response.errors.length} errors occurred`
        );
        dispatch(fetchAssets({ page: 1, pageSize: 50 }));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to import assets");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const csvContent = `name,type,classification_level,confidentiality_score,integrity_score,availability_score,technology_stack
Customer Payment API,Application,Confidential,4,5,4,"Python,FastAPI,PostgreSQL"
User Authentication Service,Microservice,Confidential,5,5,4,"Node.js,Express,JWT"
Payment Database,Database,Restricted,5,5,5,"PostgreSQL"`;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assets_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const jsonContent = [
        {
          name: "Customer Payment API",
          type: "Application",
          classification_level: "Confidential",
          confidentiality_score: 4,
          integrity_score: 5,
          availability_score: 4,
          technology_stack: ["Python", "FastAPI", "PostgreSQL"]
        },
        {
          name: "User Authentication Service",
          type: "Microservice",
          classification_level: "Confidential",
          confidentiality_score: 5,
          integrity_score: 5,
          availability_score: 4,
          technology_stack: ["Node.js", "Express", "JWT"]
        }
      ];
      const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assets_template.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Import Assets</DialogTitle>
          <DialogDescription>
            Upload a CSV or JSON file to import multiple assets at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                disabled={loading}
                className="flex-1"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  {file.name}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: CSV, JSON (max 10MB)
            </p>
          </div>

          {/* Template Download */}
          <div className="space-y-2">
            <Label>Download Template</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('csv')}
                disabled={loading}
              >
                <FileText className="w-4 h-4 mr-2" />
                CSV Template
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('json')}
                disabled={loading}
              >
                <FileText className="w-4 h-4 mr-2" />
                JSON Template
              </Button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <Alert variant={result.errors.length > 0 ? "default" : "default"}>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p>
                      <strong>Total:</strong> {result.total} assets processed
                    </p>
                    <p>
                      <strong>Created:</strong> {result.created} new assets
                    </p>
                    <p>
                      <strong>Updated:</strong> {result.updated} existing assets
                    </p>
                    {result.errors.length > 0 && (
                      <p className="text-destructive">
                        <strong>Errors:</strong> {result.errors.length}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {result.errors.map((error, idx) => (
                        <p key={idx} className="text-sm">{error}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={loading || !file}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Assets
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


