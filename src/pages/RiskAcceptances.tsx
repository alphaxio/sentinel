import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { riskAcceptancesService, type RiskAcceptance } from "@/services/riskAcceptances.service";
import { threatsService } from "@/services/threats.service";
import type { Threat } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RiskAcceptances() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [acceptances, setAcceptances] = useState<RiskAcceptance[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Confirmation dialog state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [confirmAcceptanceId, setConfirmAcceptanceId] = useState<string | null>(null);
  const [confirmAcceptanceTitle, setConfirmAcceptanceTitle] = useState<string>("");
  
  // Form state
  const [selectedThreatId, setSelectedThreatId] = useState<string>("");
  const [justification, setJustification] = useState("");
  const [acceptancePeriodDays, setAcceptancePeriodDays] = useState<number>(30);

  useEffect(() => {
    fetchAcceptances();
    fetchThreats();
  }, []);

  const fetchAcceptances = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await riskAcceptancesService.getAll({ page: 1, pageSize: 100 });
      setAcceptances(response.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load risk acceptances");
      toast({
        title: "Error",
        description: err.message || "Failed to load risk acceptances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchThreats = async () => {
    try {
      const response = await threatsService.getAll({ page: 1, pageSize: 100 });
      setThreats(response.items || []);
    } catch (err: any) {
      console.error("Failed to load threats:", err);
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedThreatId || !justification.trim() || !acceptancePeriodDays) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (justification.length < 10) {
      toast({
        title: "Validation Error",
        description: "Justification must be at least 10 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await riskAcceptancesService.create({
        threat_id: selectedThreatId,
        justification: justification.trim(),
        acceptance_period_days: acceptancePeriodDays,
      });
      
      toast({
        title: "Success",
        description: "Risk acceptance request created successfully",
      });
      
      setIsRequestDialogOpen(false);
      setSelectedThreatId("");
      setJustification("");
      setAcceptancePeriodDays(30);
      fetchAcceptances();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create risk acceptance request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirmDialog = (action: "approve" | "reject", id: string, title: string) => {
    setConfirmAction(action);
    setConfirmAcceptanceId(id);
    setConfirmAcceptanceTitle(title);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmAcceptanceId || !confirmAction) return;

    try {
      if (confirmAction === "approve") {
        await riskAcceptancesService.approve(confirmAcceptanceId);
        toast({
          title: "Success",
          description: "Risk acceptance request approved",
        });
      } else {
        await riskAcceptancesService.reject(confirmAcceptanceId);
        toast({
          title: "Success",
          description: "Risk acceptance request rejected",
        });
      }
      setIsConfirmDialogOpen(false);
      setConfirmAction(null);
      setConfirmAcceptanceId(null);
      setConfirmAcceptanceTitle("");
      fetchAcceptances();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || `Failed to ${confirmAction} risk acceptance request`,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsConfirmDialogOpen(false);
    setConfirmAction(null);
    setConfirmAcceptanceId(null);
    setConfirmAcceptanceTitle("");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: "default" as const, icon: Clock, className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Pending" },
      APPROVED: { variant: "default" as const, icon: CheckCircle, className: "bg-green-500/20 text-green-400 border-green-500/30", label: "Approved" },
      REJECTED: { variant: "destructive" as const, icon: XCircle, className: "bg-red-500/20 text-red-400 border-red-500/30", label: "Rejected" },
      EXPIRED: { variant: "secondary" as const, icon: AlertTriangle, className: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "Expired" },
    };
    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label || status}
      </Badge>
    );
  };

  const selectedThreat = threats.find(t => t.id === selectedThreatId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Risk Acceptances</h1>
          <p className="text-muted-foreground">Manage risk acceptance requests and approvals</p>
        </div>
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Shield className="mr-2 h-4 w-4" />
              Request Risk Acceptance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Risk Acceptance</DialogTitle>
              <DialogDescription>Submit a request to accept a risk temporarily</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Threat *</Label>
                <Select value={selectedThreatId} onValueChange={setSelectedThreatId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select threat" />
                  </SelectTrigger>
                  <SelectContent>
                    {threats.map((threat) => (
                      <SelectItem key={threat.id} value={threat.id}>
                        {threat.title} (Risk: {threat.riskScore})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedThreat && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Asset: {selectedThreat.assetName} | Risk Score: {selectedThreat.riskScore}
                  </p>
                )}
              </div>
              <div>
                <Label>Justification * (min 10 characters)</Label>
                <Textarea
                  placeholder="Explain why this risk should be accepted..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {justification.length}/2000 characters
                </p>
              </div>
              <div>
                <Label>Acceptance Period (days, max 90) *</Label>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={acceptancePeriodDays}
                  onChange={(e) => setAcceptancePeriodDays(parseInt(e.target.value) || 30)}
                  placeholder="30"
                />
                {acceptancePeriodDays > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Expires: {format(new Date(Date.now() + acceptancePeriodDays * 24 * 60 * 60 * 1000), "MMM d, yyyy")}
                  </p>
                )}
              </div>
              <Button
                className="w-full"
                onClick={handleCreateRequest}
                disabled={isSubmitting || !selectedThreatId || !justification.trim() || !acceptancePeriodDays}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Risk Acceptance Requests</CardTitle>
          <CardDescription>View and manage risk acceptance requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : acceptances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No risk acceptance requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Threat</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acceptances.map((acceptance) => (
                  <TableRow key={acceptance.acceptance_id}>
                    <TableCell className="font-mono text-sm">
                      {acceptance.acceptance_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{acceptance.threat_title || "Unknown Threat"}</p>
                        {acceptance.threat_title && (
                          <p className="text-xs text-muted-foreground">Click to view details</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{acceptance.requester_name || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant={acceptance.threat_risk_score && acceptance.threat_risk_score >= 75 ? "destructive" : "default"}>
                        {acceptance.threat_risk_score?.toFixed(1) || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>{acceptance.acceptance_period_days} days</TableCell>
                    <TableCell>
                      {format(new Date(acceptance.expiration_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{getStatusBadge(acceptance.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {acceptance.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => openConfirmDialog("approve", acceptance.acceptance_id, acceptance.threat_title || "Unknown Threat")}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openConfirmDialog("reject", acceptance.acceptance_id, acceptance.threat_title || "Unknown Threat")}
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                          </>
                        )}
                        {acceptance.status === "APPROVED" && acceptance.approver_name && (
                          <p className="text-xs text-muted-foreground">
                            Approved by {acceptance.approver_name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmAction === "approve" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Approve Risk Acceptance
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Reject Risk Acceptance
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "approve" 
                ? "Are you sure you want to approve this risk acceptance request?"
                : "Are you sure you want to reject this risk acceptance request? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-muted/50 p-4 border border-border">
              <p className="text-sm font-medium text-foreground mb-1">Threat:</p>
              <p className="text-sm text-muted-foreground">{confirmAcceptanceTitle}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === "approve" ? "default" : "destructive"}
              onClick={handleConfirm}
            >
              {confirmAction === "approve" ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
