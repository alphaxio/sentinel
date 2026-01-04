import { Bell, Search, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

export function Header() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate("/login");
    } catch (error) {
      // Even if API call fails, clear local state and redirect
      navigate("/login");
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      Security_Architect: "Security Team",
      Compliance_Officer: "Compliance Team",
      Developer: "Development Team",
      Executive: "Executive Team",
    };
    return roleMap[role] || role;
  };
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-card/50 border-b border-border backdrop-blur-sm">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search assets, threats, findings..."
          className="pl-10 bg-background/50 border-border/50 focus:border-primary"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] font-medium flex items-center justify-center text-destructive-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-[10px]">Critical</Badge>
                <span className="text-sm font-medium">New critical finding</span>
              </div>
              <span className="text-xs text-muted-foreground">S3 bucket public access detected</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Badge className="bg-warning text-warning-foreground text-[10px]">Warning</Badge>
                <span className="text-sm font-medium">Policy violation</span>
              </div>
              <span className="text-xs text-muted-foreground">Container security policy failed</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">Info</Badge>
                <span className="text-sm font-medium">Scan completed</span>
              </div>
              <span className="text-xs text-muted-foreground">SonarQube scan finished for Portal API</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">
                  {user?.fullName || "User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user ? getRoleDisplayName(user.role) : "Loading..."}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.fullName || "User"}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.email || ""}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
