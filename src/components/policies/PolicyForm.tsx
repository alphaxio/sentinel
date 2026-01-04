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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { policiesService, type PolicyRule, type PolicyRuleCreate, type PolicyRuleUpdate } from "@/services/policies.service";
import { toast } from "@/components/ui/sonner";

const policyFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  description: z.string().optional(),
  severity: z.enum(["Info", "Low", "Medium", "High", "Critical"]),
  rego_snippet: z.string().optional(),
  active: z.boolean().default(true),
});

type PolicyFormValues = z.infer<typeof policyFormSchema>;

interface PolicyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy?: PolicyRule;
  onSuccess?: () => void;
}

export function PolicyForm({ open, onOpenChange, policy, onSuccess }: PolicyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      severity: "Medium",
      rego_snippet: "",
      active: true,
    },
  });

  useEffect(() => {
    if (policy) {
      form.reset({
        name: policy.name,
        description: policy.description || "",
        severity: policy.severity,
        rego_snippet: policy.rego_snippet || "",
        active: policy.active,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        severity: "Medium",
        rego_snippet: "",
        active: true,
      });
    }
  }, [policy, form, open]);

  const onSubmit = async (values: PolicyFormValues) => {
    setIsSubmitting(true);
    try {
      if (policy) {
        const updateData: PolicyRuleUpdate = {
          name: values.name,
          description: values.description || undefined,
          severity: values.severity,
          rego_snippet: values.rego_snippet || undefined,
          active: values.active,
        };
        await policiesService.update(policy.policy_rule_id, updateData);
        toast.success("Policy updated successfully");
      } else {
        const createData: PolicyRuleCreate = {
          name: values.name,
          description: values.description || undefined,
          severity: values.severity,
          rego_snippet: values.rego_snippet || undefined,
          active: values.active,
        };
        await policiesService.create(createData);
        toast.success("Policy created successfully");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to save policy");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{policy ? "Edit Policy" : "Create Policy"}</DialogTitle>
          <DialogDescription>
            {policy
              ? "Update the policy rule details below."
              : "Create a new policy rule to enforce security standards."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., No Public S3 Buckets" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this policy enforces..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Severity</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Info">Info</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rego_snippet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rego Policy Snippet</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="package sentinel&#10;&#10;default allow = false&#10;&#10;allow {&#10;  # Your policy logic here&#10;}"
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the Rego policy code for OPA evaluation (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Only active policies are evaluated
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : policy ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

