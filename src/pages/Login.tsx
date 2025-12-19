import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { login } from "@/store/slices/authSlice";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleOAuthLogin = async () => {
    setLoading(true);
    try {
      // OAuth2/OIDC flow will be implemented
      // For now, placeholder
      await dispatch(login({ email: "", password: "" })).unwrap();
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Sentinel IRM</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            onClick={handleOAuthLogin}
            disabled={loading}
            size="lg"
          >
            {loading ? "Signing in..." : "Sign in with SSO"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Enterprise security and risk management platform
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

