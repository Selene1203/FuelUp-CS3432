"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Fuel, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { PageLoading } from "@/components/loading-spinner";
import { api, type FuelType } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const THEME_OPTIONS = ["dark", "light", "neon", "sunset"];
const DISTANCE_OPTIONS = ["km", "miles"];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [loadingFuelTypes, setLoadingFuelTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    preferred_fuel: "",
    preferred_theme: "dark",
    distance_unit: "km",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchFuelTypes = async () => {
      try {
        const data = await api<{ fuels: FuelType[] }>("/api/fueltypes");
        if (data && data.fuels && Array.isArray(data.fuels)) {
          // Deduplicate by fuel_name to avoid duplicate entries
          const uniqueFuels = data.fuels.reduce((acc: FuelType[], fuel) => {
            if (!acc.find(f => f.fuel_name === fuel.fuel_name)) {
              acc.push(fuel);
            }
            return acc;
          }, []);
          setFuelTypes(uniqueFuels);
        }
      } catch (error) {
        toast.error("Failed to load fuel types");
      } finally {
        setLoadingFuelTypes(false);
      }
    };
    fetchFuelTypes();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.preferred_fuel) {
      newErrors.preferred_fuel = "Please select a preferred fuel type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await api<{ token: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          preferred_fuel: parseInt(formData.preferred_fuel),
          preferred_theme: formData.preferred_theme,
          distance_unit: formData.distance_unit,
        }),
      });

      login(response.token);
      toast.success("Registration successful!");
      router.push("/search");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingFuelTypes) {
    return <PageLoading />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-[#FF6B00]/10">
              <Fuel className="h-8 w-8 text-[#FF6B00]" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter your name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_fuel">Preferred Fuel</Label>
              <Select
                value={formData.preferred_fuel}
                onValueChange={(value) =>
                  setFormData({ ...formData, preferred_fuel: value })
                }
              >
                <SelectTrigger id="preferred_fuel">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No fuel types available
                    </SelectItem>
                  ) : (
                    fuelTypes.map((fuel) => (
                      <SelectItem
                        key={fuel.fuel_id}
                        value={fuel.fuel_id.toString()}
                      >
                        <span style={{ color: fuel.color_hex }}>{fuel.fuel_name}</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.preferred_fuel && (
                <p className="text-sm text-destructive">
                  {errors.preferred_fuel}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_theme">Preferred Theme</Label>
              <Select
                value={formData.preferred_theme}
                onValueChange={(value) =>
                  setFormData({ ...formData, preferred_theme: value })
                }
              >
                <SelectTrigger id="preferred_theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((theme) => (
                    <SelectItem key={theme} value={theme}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance_unit">Distance Unit</Label>
              <Select
                value={formData.distance_unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, distance_unit: value })
                }
              >
                <SelectTrigger id="distance_unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISTANCE_OPTIONS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
              disabled={submitting}
            >
              {submitting ? <Spinner className="mr-2" /> : null}
              {submitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              Already have an account?{" "}
            </span>
            <Link href="/login" className="text-[#FF6B00] hover:underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
