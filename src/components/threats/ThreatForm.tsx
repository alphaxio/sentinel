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
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createThreat, updateThreat, fetchThreats } from "@/store/slices/threatsSlice";
import { fetchAssets } from "@/store/slices/assetsSlice";
import { toast } from "@/components/ui/sonner";
import { MITRE_ATTACK_TECHNIQUES, getMitreTechnique } from "@/constants/mitreAttack";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Threat } from "@/types";

const threatFormSchema = z.object({
  asset_id: z.string().min(1, "Asset is required"),
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  stride_category: z.enum(["SPOOFING", "TAMPERING", "REPUDIATION", "INFO_DISCLOSURE", "DOS", "ELEVATION"]).optional(),
  mitre_attack_id: z.string().optional(),
  likelihood_score: z.number().min(1).max(5),
  impact_score: z.number().min(1).max(5),
});

type ThreatFormValues = z.infer<typeof threatFormSchema>;

interface ThreatFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threat?: Threat;
  mode?: "create" | "edit";
  onSuccess?: () => void;
}

export function ThreatForm({ open, onOpenChange, threat, mode = "create", onSuccess }: ThreatFormProps) {
  const dispatch = useAppDispatch();
  const { items: assets } = useAppSelector((state) => state.assets);
  const { loading } = useAppSelector((state) => state.threats);
  const [mitrePopoverOpen, setMitrePopoverOpen] = useState(false);

  // Load assets if not already loaded
  useEffect(() => {
    if (assets.length === 0) {
      dispatch(fetchAssets({ page: 1, pageSize: 100 }));
    }
  }, [dispatch, assets.length]);

  const form = useForm<ThreatFormValues>({
    resolver: zodResolver(threatFormSchema),
    defaultValues: {
      asset_id: threat?.assetId || "",
      title: threat?.title || "",
      stride_category: threat?.strideCategory,
      mitre_attack_id: threat?.mitreAttackId || "",
      likelihood_score: threat?.likelihood || 3,
      impact_score: threat?.impact || 3,
    },
  });

  useEffect(() => {
    if (open) {
      if (threat && mode === "edit") {
        form.reset({
          asset_id: threat.assetId || "",
          title: threat.title || "",
          stride_category: threat.strideCategory,
          mitre_attack_id: threat.mitreAttackId || "",
          likelihood_score: threat.likelihood || 3,
          impact_score: threat.impact || 3,
        });
      } else {
        form.reset({
          asset_id: "",
          title: "",
          stride_category: undefined,
          mitre_attack_id: "",
          likelihood_score: 3,
          impact_score: 3,
        });
      }
    }
  }, [open, threat, mode, form]);

  const onSubmit = async (values: ThreatFormValues) => {
    try {
      const threatData = {
        assetId: values.asset_id,
        title: values.title,
        strideCategory: values.stride_category,
        mitreAttackId: values.mitre_attack_id || undefined,
        likelihood: values.likelihood_score,
        impact: values.impact_score,
      };

      if (mode === "edit" && threat) {
        await dispatch(updateThreat({ id: threat.id, data: threatData })).unwrap();
        toast.success("Threat updated successfully");
      } else {
        await dispatch(createThreat(threatData)).unwrap();
        toast.success("Threat created successfully");
      }

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        dispatch(fetchThreats({ page: 1, pageSize: 50 }));
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${mode === "edit" ? "update" : "create"} threat`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Threat" : "Add Threat"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update threat details" : "Create a new threat for an asset"}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SQL Injection Vulnerability" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stride_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>STRIDE Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SPOOFING">Spoofing</SelectItem>
                        <SelectItem value="TAMPERING">Tampering</SelectItem>
                        <SelectItem value="REPUDIATION">Repudiation</SelectItem>
                        <SelectItem value="INFO_DISCLOSURE">Info Disclosure</SelectItem>
                        <SelectItem value="DOS">DoS</SelectItem>
                        <SelectItem value="ELEVATION">Elevation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mitre_attack_id"
                render={({ field }) => {
                  const selectedTechnique = field.value ? getMitreTechnique(field.value) : null;
                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>MITRE ATT&CK ID</FormLabel>
                      <Popover open={mitrePopoverOpen} onOpenChange={setMitrePopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {selectedTechnique
                                ? `${selectedTechnique.id} - ${selectedTechnique.name}`
                                : "Select MITRE ATT&CK technique..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Search MITRE ATT&CK techniques..." />
                            <CommandList>
                              <CommandEmpty>No technique found.</CommandEmpty>
                              <CommandGroup>
                                {MITRE_ATTACK_TECHNIQUES.map((technique) => (
                                  <CommandItem
                                    key={technique.id}
                                    value={`${technique.id} ${technique.name} ${technique.tactic}`}
                                    onSelect={() => {
                                      field.onChange(technique.id);
                                      setMitrePopoverOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === technique.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{technique.id} - {technique.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {technique.tactic} • {technique.description}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedTechnique && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedTechnique.description}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="likelihood_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Likelihood: {field.value}/5</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="impact_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impact: {field.value}/5</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : mode === "edit" ? "Update Threat" : "Create Threat"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

