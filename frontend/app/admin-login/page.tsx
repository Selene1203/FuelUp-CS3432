"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [secretCode, setSecretCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!secretCode.trim()) {
      setError("Secret code is required");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const response = await api<{ token: string }>("/api/auth/admin-login", {
        method: "POST",
        body: JSON.stringify({ secret_code: secretCode }),
      });

      login(response.token, true);
      toast.success("Admin login successful!");
      router.push("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Admin login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-[#FF6B00]/10">
              <ShieldCheck className="h-8 w-8 text-[#FF6B00]" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret_code">Secret Code</Label>
              <div className="relative">
                <Input
                  id="secret_code"
                  type={showCode ? "text" : "password"}
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  placeholder="Enter your station secret code"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCode ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
              disabled={submitting}
            >
              {submitting ? <Spinner className="mr-2" /> : null}
              {submitting ? "Logging in..." : "Login as Admin"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Not an admin? </span>
            <Link href="/login" className="text-[#FF6B00] hover:underline">
              User Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
