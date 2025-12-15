import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Bell, Shield, Palette, Key, Globe } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Globe className="w-4 h-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="User" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="admin@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue="Security Administrator" disabled />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  title: "Critical Findings",
                  description: "Receive alerts for critical severity findings",
                  defaultChecked: true,
                },
                {
                  title: "Threat Status Changes",
                  description: "Get notified when threat status changes",
                  defaultChecked: true,
                },
                {
                  title: "Policy Violations",
                  description: "Alerts for policy enforcement failures",
                  defaultChecked: true,
                },
                {
                  title: "Compliance Updates",
                  description: "Updates on compliance score changes",
                  defaultChecked: false,
                },
                {
                  title: "Weekly Digest",
                  description: "Summary of security activities",
                  defaultChecked: true,
                },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{item.title}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked={item.defaultChecked} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your authentication and access settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <Button variant="outline" className="gap-2">
                  <Key className="w-4 h-4" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Production API Key</p>
                    <p className="text-sm text-muted-foreground font-mono">sk_live_****************************</p>
                  </div>
                  <Button variant="outline" size="sm">Regenerate</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Services</CardTitle>
              <CardDescription>Manage third-party integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "SonarQube", status: "Connected", color: "bg-success" },
                { name: "OWASP ZAP", status: "Connected", color: "bg-success" },
                { name: "Snyk", status: "Connected", color: "bg-success" },
                { name: "Terraform Cloud", status: "Not Connected", color: "bg-muted" },
                { name: "Jira", status: "Not Connected", color: "bg-muted" },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${integration.color}`} />
                    <div>
                      <p className="font-medium text-foreground">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">{integration.status}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    {integration.status === "Connected" ? "Configure" : "Connect"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
