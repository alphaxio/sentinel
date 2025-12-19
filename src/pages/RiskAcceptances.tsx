import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function RiskAcceptances() {
  const [selectedAcceptance, setSelectedAcceptance] = useState<any>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  // Mock data - will be replaced with API calls
  const mockAcceptances = [
    {
      id: "RA-001",
      threatId: "THR-001",
      threatTitle: "SQL Injection Attack Vector",
      requestedBy: "John Smith",
      requestedAt: "2024-01-15T10:00:00Z",
      justification: "Temporary acceptance while migration is in progress",
      acceptancePeriodDays: 30,
      expirationDate: "2024-02-14",
      status: "Pending",
      riskScore: 94,
    },
  ];

  const handleApprove = async (id: string) => {
    // Will implement approval logic
    console.log("Approving:", id);
  };

  const handleReject = async (id: string) => {
    // Will implement rejection logic
    console.log("Rejecting:", id);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      Pending: { variant: "default" as const, icon: Clock },
      Approved: { variant: "default" as const, icon: CheckCircle },
      Rejected: { variant: "destructive" as const, icon: XCircle },
      Expired: { variant: "secondary" as const, icon: AlertTriangle },
    };
    const config = variants[status] || variants.Pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

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
                <Label>Threat</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select threat" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Will be populated from API */}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Justification</Label>
                <Textarea placeholder="Explain why this risk should be accepted..." />
              </div>
              <div>
                <Label>Acceptance Period (days, max 90)</Label>
                <Input type="number" min="1" max="90" placeholder="30" />
              </div>
              <Button className="w-full">Submit Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Acceptance Requests</CardTitle>
          <CardDescription>View and manage risk acceptance requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Threat</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAcceptances.map((acceptance) => (
                <TableRow key={acceptance.id}>
                  <TableCell className="font-mono text-sm">{acceptance.id}</TableCell>
                  <TableCell>{acceptance.threatTitle}</TableCell>
                  <TableCell>{acceptance.requestedBy}</TableCell>
                  <TableCell>
                    <Badge variant={acceptance.riskScore >= 75 ? "destructive" : "default"}>
                      {acceptance.riskScore}
                    </Badge>
                  </TableCell>
                  <TableCell>{acceptance.acceptancePeriodDays} days</TableCell>
                  <TableCell>{getStatusBadge(acceptance.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {acceptance.status === "Pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(acceptance.id)}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(acceptance.id)}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

