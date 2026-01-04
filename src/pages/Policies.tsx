import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, FileCode, CheckCircle, AlertTriangle, XCircle, Play, Edit, Trash2, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { policiesService, type PolicyRule } from "@/services/policies.service";
import { PolicyForm } from "@/components/policies/PolicyForm";
import { toast } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const getPassRateColor = (rate?: number) => {
  if (!rate) return "text-muted-foreground";
  if (rate >= 90) return "text-success";
  if (rate >= 70) return "text-warning";
  return "text-destructive";
};

const getPassRateProgressColor = (rate?: number) => {
  if (!rate) return "bg-muted";
  if (rate >= 90) return "bg-success";
  if (rate >= 70) return "bg-warning";
  return "bg-destructive";
};

export default function Policies() {
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyRule | undefined>();
  const [deletingPolicy, setDeletingPolicy] = useState<PolicyRule | undefined>();
  const [testingPolicy, setTestingPolicy] = useState<PolicyRule | undefined>();

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await policiesService.getAll({ page: 1, pageSize: 100 });
      setPolicies(response.items);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load policies");
      toast.error("Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleDelete = async () => {
    if (!deletingPolicy) return;
    try {
      await policiesService.delete(deletingPolicy.policy_rule_id);
      toast.success("Policy deleted successfully");
      setDeletingPolicy(undefined);
      fetchPolicies();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to delete policy");
    }
  };

  const handleTest = async (policy: PolicyRule) => {
    setTestingPolicy(policy);
    try {
      const result = await policiesService.test(policy.policy_rule_id, {
        // Placeholder test data
        resource: { type: "s3_bucket", public: true },
      });
      toast.success(
        result.passed
          ? `Policy test passed: ${result.message || ""}`
          : `Policy test failed: ${result.message || ""}`
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to test policy");
    } finally {
      setTestingPolicy(undefined);
    }
  };

  const stats = {
    total: policies.length,
    passing: policies.filter((p) => (p.pass_rate ?? 100) === 100).length,
    withViolations: policies.filter((p) => (p.violations_count ?? 0) > 0).length,
    totalViolations: policies.reduce((acc, p) => acc + (p.violations_count ?? 0), 0),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Policy Engine</h1>
          <p className="text-muted-foreground">Define and enforce security policies with OPA</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Policy
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <FileCode className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Total Policies</span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          )}
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">Passing</span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold text-success">{stats.passing}</p>
          )}
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm text-muted-foreground">With Violations</span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold text-warning">{stats.withViolations}</p>
          )}
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-muted-foreground">Total Violations</span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold text-destructive">{stats.totalViolations}</p>
          )}
        </div>
      </div>

      {/* Policies Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : policies.length === 0 ? (
        <div className="text-center py-12">
          <FileCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No policies found. Create your first policy to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {policies.map((policy) => (
            <div
              key={policy.policy_rule_id}
              className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileCode className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{policy.name}</h3>
                    <p className="text-xs text-muted-foreground">{policy.policy_rule_id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={policy.active ? "Active" : "Inactive"}
                    variant="policy"
                  />
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPolicy(policy)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingPolicy(policy)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {policy.description && (
                <p className="text-sm text-muted-foreground mb-4">{policy.description}</p>
              )}

              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="text-xs">
                  {policy.severity}
                </Badge>
                {policy.framework && (
                  <Badge variant="outline" className="text-xs">
                    {policy.framework}
                  </Badge>
                )}
                {policy.controls_mapped_count !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    {policy.controls_mapped_count} controls mapped
                  </Badge>
                )}
              </div>

              {/* Pass Rate */}
              {policy.pass_rate !== undefined && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pass Rate</span>
                    <span className={cn("font-bold", getPassRateColor(policy.pass_rate))}>
                      {policy.pass_rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        getPassRateProgressColor(policy.pass_rate)
                      )}
                      style={{ width: `${policy.pass_rate}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {policy.last_evaluated ? (
                    <span>
                      Last evaluated: {format(new Date(policy.last_evaluated), "MMM d, HH:mm")}
                    </span>
                  ) : (
                    <span>Never evaluated</span>
                  )}
                  {(policy.violations_count ?? 0) > 0 && (
                    <span className="text-destructive font-medium">
                      {policy.violations_count} violation{policy.violations_count !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(policy)}
                  disabled={testingPolicy?.policy_rule_id === policy.policy_rule_id}
                >
                  {testingPolicy?.policy_rule_id === policy.policy_rule_id ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3 mr-1" />
                  )}
                  Test
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <PolicyForm
        open={isAddDialogOpen || !!editingPolicy}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingPolicy(undefined);
          }
        }}
        policy={editingPolicy}
        onSuccess={fetchPolicies}
      />

      <AlertDialog
        open={!!deletingPolicy}
        onOpenChange={(open) => !open && setDeletingPolicy(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPolicy?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
