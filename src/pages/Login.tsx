import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield, AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, setCredentials } from "@/store/slices/authSlice";
import apiService from "@/services/api";
import { API_ENDPOINTS } from "@/config/api";
import type { User } from "@/types";

interface OAuth2Config {
  enabled: boolean;
  authorization_url?: string;
  client_id?: string;
  redirect_uri?: string;
  scope?: string;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [oauth2Config, setOAuth2Config] = useState<OAuth2Config | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  // Check for OAuth2 callback
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    
    if (code) {
      handleOAuth2Callback(code, state);
    }
  }, [searchParams]);

  // Fetch OAuth2 config on mount
  useEffect(() => {
    fetchOAuth2Config();
  }, []);

  const fetchOAuth2Config = async () => {
    try {
      const config = await apiService.get<OAuth2Config>(API_ENDPOINTS.auth.oauth2Config);
      setOAuth2Config(config);
    } catch (error) {
      // OAuth2 not configured, that's fine
      setOAuth2Config({ enabled: false });
    }
  };

  const handleOAuth2Callback = async (code: string, state: string | null) => {
    try {
      const tokenResponse = await apiService.post<{ access_token: string; token_type: string }>(
        API_ENDPOINTS.auth.oauth2Callback,
        { code, state }
      );

      // Store the token
      apiService.setAuthToken(tokenResponse.access_token);

      // Fetch user info
      const userResponse = await apiService.get<{
        user_id: string;
        email: string;
        full_name: string;
        role: string;
        permissions: string[];
      }>(API_ENDPOINTS.auth.me);

      // Map backend response to frontend User type
      const user = {
        id: userResponse.user_id,
        email: userResponse.email,
        fullName: userResponse.full_name,
        role: userResponse.role as User['role'],
        permissions: userResponse.permissions
      } as User;

      dispatch(setCredentials({ token: tokenResponse.access_token, user }));
      navigate("/");
    } catch (error: any) {
      console.error("OAuth2 callback failed:", error);
    }
  };

  const handleOAuth2Login = () => {
    if (oauth2Config?.enabled && oauth2Config.authorization_url) {
      // Redirect to OAuth2 authorization endpoint
      window.location.href = `${API_ENDPOINTS.auth.oauth2Authorize}?state=${encodeURIComponent(window.location.origin)}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    try {
      await dispatch(login({ email, password })).unwrap();
      navigate("/");
    } catch (error) {
      // Error is handled by Redux state
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sentinel.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email || !password}
              size="lg"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* OAuth2 Login Option */}
          {oauth2Config?.enabled && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleOAuth2Login}
                disabled={loading}
                size="lg"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign in with SSO
              </Button>
            </>
          )}
          
          <p className="text-center text-sm text-muted-foreground mt-4">
            Enterprise security and risk management platform
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
