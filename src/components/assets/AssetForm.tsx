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
  FormDescription,
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
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createAsset, updateAsset, fetchAssets } from "@/store/slices/assetsSlice";
import { toast } from "@/components/ui/sonner";
import type { Asset } from "@/types";

const assetFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  type: z.enum([
    "Application",
    "Microservice",
    "Database",
    "Container",
    "Infrastructure",
    "Server",
    "Network",
    "Cloud",
  ]),
  classification_level: z.enum(["Public", "Internal", "Confidential", "Restricted"]),
  confidentiality_score: z.number().min(1).max(5),
  integrity_score: z.number().min(1).max(5),
  availability_score: z.number().min(1).max(5),
  technology_stack: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: any; // Asset type from @/types
  mode?: "create" | "edit";
}

export function AssetForm({ open, onOpenChange, asset, mode = "create" }: AssetFormProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { loading } = useAppSelector((state) => state.assets);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: asset?.name || "",
      type: asset?.type || "Application",
      classification_level: asset?.classification || "Internal",
      confidentiality_score: asset?.confidentiality || 3,
      integrity_score: asset?.integrity || 3,
      availability_score: asset?.availability || 3,
      technology_stack: asset?.technologyStack?.join(", ") || "",
    },
  });

  // Reset form when asset changes or dialog opens/closes
  useEffect(() => {
    if (open) {
      if (asset && mode === "edit") {
        form.reset({
          name: asset.name || "",
          type: asset.type || "Application",
          classification_level: asset.classification || "Internal",
          confidentiality_score: asset.confidentiality || 3,
          integrity_score: asset.integrity || 3,
          availability_score: asset.availability || 3,
          technology_stack: asset.technologyStack?.join(", ") || "",
        });
      } else if (mode === "create") {
        form.reset({
          name: "",
          type: "Application",
          classification_level: "Internal",
          confidentiality_score: 3,
          integrity_score: 3,
          availability_score: 3,
          technology_stack: "",
        });
      }
    }
  }, [open, asset, mode, form]);

  const onSubmit = async (data: AssetFormValues) => {
    if (!user?.id) {
      toast.error("User not found. Please log in again.");
      return;
    }

    try {
      // Parse technology stack (comma-separated string to array)
      const technologyStack = data.technology_stack
        ? data.technology_stack.split(",").map((tech) => tech.trim()).filter(Boolean)
        : undefined;

      // Map to frontend Asset format (service will convert to backend format)
      const assetData = {
        name: data.name,
        type: data.type,
        classification: data.classification_level,
        ownerId: user.id,
        confidentiality: data.confidentiality_score,
        integrity: data.integrity_score,
        availability: data.availability_score,
        technologyStack: technologyStack,
      };

      if (mode === "edit" && asset && asset.id) {
        await dispatch(updateAsset({ id: asset.id, data: assetData })).unwrap();
        toast.success("Asset updated successfully!");
      } else if (mode === "edit") {
        toast.error("Asset information is missing. Please try again.");
        return;
      } else {
        await dispatch(createAsset(assetData)).unwrap();
        toast.success("Asset created successfully!");
        form.reset();
      }
      
      onOpenChange(false);
      
      // Refresh assets list
      dispatch(fetchAssets({ page: 1, pageSize: 50 }));
    } catch (error: any) {
      toast.error(error.message || `Failed to ${mode} asset`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Asset" : "Create New Asset"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" 
              ? "Update the asset details below."
              : "Add a new asset to your inventory. Fill in the details below."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Customer Portal API" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Application">Application</SelectItem>
                        <SelectItem value="Microservice">Microservice</SelectItem>
                        <SelectItem value="Database">Database</SelectItem>
                        <SelectItem value="Container">Container</SelectItem>
                        <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="Server">Server</SelectItem>
                        <SelectItem value="Network">Network</SelectItem>
                        <SelectItem value="Cloud">Cloud</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="classification_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classification Level *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select classification" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Internal">Internal</SelectItem>
                      <SelectItem value="Confidential">Confidential</SelectItem>
                      <SelectItem value="Restricted">Restricted</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Data sensitivity classification level
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <Label>CIA Scores (1-5) *</Label>
              
              <FormField
                control={form.control}
                name="confidentiality_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confidentiality: {field.value}</FormLabel>
                    <FormControl>
                      <div className="px-2">
                        <Slider
                          min={1}
                          max={5}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      How sensitive is the data this asset handles?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="integrity_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Integrity: {field.value}</FormLabel>
                    <FormControl>
                      <div className="px-2">
                        <Slider
                          min={1}
                          max={5}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      How critical is data accuracy for this asset?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availability_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability: {field.value}</FormLabel>
                    <FormControl>
                      <div className="px-2">
                        <Slider
                          min={1}
                          max={5}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      How critical is uptime for this asset?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="technology_stack"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technology Stack</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Python, FastAPI, PostgreSQL (comma-separated)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    List technologies used, separated by commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading 
                  ? (mode === "edit" ? "Updating..." : "Creating...") 
                  : (mode === "edit" ? "Update Asset" : "Create Asset")
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

