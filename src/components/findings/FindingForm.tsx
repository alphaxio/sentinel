import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createFinding, updateFinding, fetchFindings } from "@/store/slices/findingsSlice";
import { fetchAssets } from "@/store/slices/assetsSlice";
import { fetchThreats } from "@/store/slices/threatsSlice";
import { toast } from "@/components/ui/sonner";
import type { Finding } from "@/types";

const findingFormSchema = z.object({
  asset_id: z.string().min(1, "Asset is required"),
  vulnerability_type: z.string().min(1, "Vulnerability type is required").max(255, "Type is too long"),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]),
  location: z.string().optional(),
  cve_id: z.string().optional(),
  source: z.enum(["SonarQube", "OWASP ZAP", "Snyk", "Terraform", "Manual"]),
  threat_id: z.string().optional(),
});

type FindingFormValues = z.infer<typeof findingFormSchema>;

interface FindingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finding?: Finding;
  mode?: "create" | "edit";
  onSuccess?: () => void;
}

export function FindingForm({ open, onOpenChange, finding, mode = "create", onSuccess }: FindingFormProps) {
  const dispatch = useAppDispatch();
  const { items: assets } = useAppSelector((state) => state.assets);
  const { items: threats } = useAppSelector((state) => state.threats);
  const { loading } = useAppSelector((state) => state.findings);

  // Load assets if not already loaded
  useEffect(() => {
    if (assets.length === 0) {
      dispatch(fetchAssets({ page: 1, pageSize: 100 }));
    }
  }, [dispatch, assets.length]);

  // Load threats if not already loaded
  useEffect(() => {
    if (threats.length === 0) {
      dispatch(fetchThreats({ page: 1, pageSize: 100 }));
    }
  }, [dispatch, threats.length]);

  const form = useForm<FindingFormValues>({
    resolver: zodResolver(findingFormSchema),
    defaultValues: {
      asset_id: finding?.assetId || "",
      vulnerability_type: finding?.vulnerabilityType || finding?.title || "",
      severity: finding?.severity || "MEDIUM",
      location: finding?.location || "",
      cve_id: finding?.cveId || "",
      source: finding?.source || "Manual",
      threat_id: finding?.threatId || "",
    },
  });

  useEffect(() => {
    if (open) {
      if (finding && mode === "edit") {
        form.reset({
          asset_id: finding.assetId || "",
          vulnerability_type: finding.vulnerabilityType || finding.title || "",
          severity: finding.severity || "Medium",
          location: finding.location || "",
          cve_id: finding.cveId || "",
          source: finding.source || "Manual",
          threat_id: finding.threatId || "",
        });
      } else {
        form.reset({
          asset_id: "",
          vulnerability_type: "",
          severity: "Medium",
          location: "",
          cve_id: "",
          source: "Manual",
          threat_id: "",
        });
      }
    }
  }, [open, finding, mode, form]);

  const onSubmit = async (values: FindingFormValues) => {
    try {
      const findingData = {
        assetId: values.asset_id,
        vulnerabilityType: values.vulnerability_type,
        severity: values.severity,
        location: values.location || undefined,
        cveId: values.cve_id || undefined,
        source: values.source,
        threatId: values.threat_id || undefined,
        scannerSources: [values.source],
      };

      if (mode === "edit" && finding) {
        await dispatch(updateFinding({ id: finding.id, data: findingData })).unwrap();
        toast.success("Finding updated successfully");
      } else {
        await dispatch(createFinding(findingData)).unwrap();
        toast.success("Finding created successfully");
      }

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        dispatch(fetchFindings({ page: 1, pageSize: 50 }));
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${mode === "edit" ? "update" : "create"} finding`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Finding" : "Add Finding"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update finding details" : "Create a new security finding"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="asset_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={mode === "edit"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an asset" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name} ({asset.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vulnerability_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vulnerability Type *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SQL Injection, XSS, CSRF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="INFO">Info</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="SonarQube">SonarQube</SelectItem>
                        <SelectItem value="OWASP ZAP">OWASP ZAP</SelectItem>
                        <SelectItem value="Snyk">Snyk</SelectItem>
                        <SelectItem value="Terraform">Terraform</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., /api/users" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cve_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CVE ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CVE-2024-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="threat_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to Threat (Optional)</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a threat (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {threats.map((threat) => (
                        <SelectItem key={threat.id} value={threat.id}>
                          {threat.title} ({threat.assetName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : mode === "edit" ? "Update Finding" : "Create Finding"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

