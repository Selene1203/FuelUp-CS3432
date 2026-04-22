"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Eye,
  Search,
  Clock,
  Edit2,
  Plus,
  LogOut,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageLoading } from "@/components/loading-spinner";
import { ProtectedRoute } from "@/components/protected-route";
import { StarRating } from "@/components/star-rating";
import { Spinner } from "@/components/ui/spinner";
import {
  api,
  type AdminStation,
  type Analytics,
  type StationFuel,
  type Review,
  type FuelType,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const [station, setStation] = useState<AdminStation | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [fuels, setFuels] = useState<StationFuel[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingStation, setEditingStation] = useState(false);
  const [stationForm, setStationForm] = useState({
    name: "",
    address: "",
    phone: "",
    opening_hours: "",
  });
  const [savingStation, setSavingStation] = useState(false);

  const [editingFuelId, setEditingFuelId] = useState<number | null>(null);
  const [fuelPriceEdit, setFuelPriceEdit] = useState("");
  const [savingFuel, setSavingFuel] = useState(false);

  const [addFuelOpen, setAddFuelOpen] = useState(false);
  const [newFuelType, setNewFuelType] = useState("");
  const [newFuelPrice, setNewFuelPrice] = useState("");
  const [addingFuel, setAddingFuel] = useState(false);

  const fetchData = async () => {
    try {
      const [stationData, analyticsData, fuelTypesData, reviewsData] =
        await Promise.all([
          api<AdminStation>("/api/admin/station", { requiresAuth: true }),
          api<Analytics>("/api/admin/analytics", { requiresAuth: true }),
          api<FuelType[]>("/api/fueltypes"),
          api<Review[]>("/api/admin/reviews", { requiresAuth: true }),
        ]);

      setStation(stationData);
      setAnalytics(analyticsData);
      setFuelTypes(fuelTypesData);
      setReviews(reviewsData);
      setStationForm({
        name: stationData.name || "",
        address: stationData.address || "",
        phone: stationData.phone || "",
        opening_hours: stationData.opening_hours || "",
      });

      // Fetch fuels for this station
      const fuelsData = await api<StationFuel[]>(
        `/api/stations/${stationData.station_id}/fuel`,
        { requiresAuth: true }
      );
      setFuels(fuelsData);
    } catch (error) {
      toast.error("Failed to load admin data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveStation = async () => {
    if (!station) return;
    setSavingStation(true);
    try {
      await api(`/api/stations/${station.station_id}`, {
        method: "PUT",
        requiresAuth: true,
        body: JSON.stringify(stationForm),
      });
      toast.success("Station info updated!");
      setEditingStation(false);
      fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update station"
      );
    } finally {
      setSavingStation(false);
    }
  };

  const handleUpdateFuelPrice = async (fuelId: number) => {
    if (!station) return;
    const price = parseFloat(fuelPriceEdit);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setSavingFuel(true);
    try {
      await api(`/api/stations/${station.station_id}/fuel/${fuelId}`, {
        method: "PUT",
        requiresAuth: true,
        body: JSON.stringify({ price_per_liter: price }),
      });
      toast.success("Price updated!");
      setEditingFuelId(null);
      fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update price"
      );
    } finally {
      setSavingFuel(false);
    }
  };

  const handleToggleAvailability = async (
    fuelId: number,
    currentAvailable: boolean
  ) => {
    if (!station) return;
    try {
      if (currentAvailable) {
        // Mark as unavailable
        await api(`/api/stations/${station.station_id}/fuel/${fuelId}`, {
          method: "DELETE",
          requiresAuth: true,
        });
      } else {
        // Mark as available
        await api(`/api/stations/${station.station_id}/fuel/${fuelId}`, {
          method: "PUT",
          requiresAuth: true,
          body: JSON.stringify({ is_available: true }),
        });
      }
      toast.success(
        currentAvailable ? "Marked as unavailable" : "Marked as available"
      );
      fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update availability"
      );
    }
  };

  const handleAddFuel = async () => {
    if (!station || !newFuelType) return;
    const price = parseFloat(newFuelPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setAddingFuel(true);
    try {
      await api(`/api/stations/${station.station_id}/fuel`, {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({
          fuel_type_id: parseInt(newFuelType),
          price_per_liter: price,
        }),
      });
      toast.success("Fuel type added!");
      setAddFuelOpen(false);
      setNewFuelType("");
      setNewFuelPrice("");
      fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add fuel type"
      );
    } finally {
      setAddingFuel(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <PageLoading />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <main className="min-h-screen pb-8 bg-background">
        <div className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="max-w-2xl mx-auto p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#FF6B00]" />
              <h1 className="text-xl font-bold text-foreground">
                Admin Dashboard
              </h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {/* Station Info */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Station Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingStation(!editingStation)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {editingStation ? "Cancel" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingStation ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={stationForm.name}
                      onChange={(e) =>
                        setStationForm({ ...stationForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={stationForm.address}
                      onChange={(e) =>
                        setStationForm({
                          ...stationForm,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={stationForm.phone}
                      onChange={(e) =>
                        setStationForm({
                          ...stationForm,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opening_hours">Opening Hours</Label>
                    <Input
                      id="opening_hours"
                      value={stationForm.opening_hours}
                      onChange={(e) =>
                        setStationForm({
                          ...stationForm,
                          opening_hours: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    onClick={handleSaveStation}
                    disabled={savingStation}
                    className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
                  >
                    {savingStation ? <Spinner className="mr-2" /> : null}
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <p>
                    <strong>Name:</strong> {station?.name}
                  </p>
                  <p>
                    <strong>Address:</strong> {station?.address},{" "}
                    {station?.city}, {station?.country}
                  </p>
                  <p>
                    <strong>Phone:</strong> {station?.phone || "-"}
                  </p>
                  <p>
                    <strong>Opening Hours:</strong>{" "}
                    {station?.opening_hours || "-"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Eye className="h-6 w-6 mx-auto text-[#FF6B00] mb-2" />
                  <p className="text-2xl font-bold">
                    {analytics?.view_count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Search className="h-6 w-6 mx-auto text-[#FF6B00] mb-2" />
                  <p className="text-2xl font-bold">
                    {analytics?.search_appearances || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Searches</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Clock className="h-6 w-6 mx-auto text-[#FF6B00] mb-2" />
                  <p className="text-sm font-medium">
                    {analytics?.last_viewed
                      ? new Date(analytics.last_viewed).toLocaleDateString()
                      : "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">Last Viewed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fuel Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Fuel Management</CardTitle>
              <Dialog open={addFuelOpen} onOpenChange={setAddFuelOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fuel
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Fuel Type</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Fuel Type</Label>
                      <Select
                        value={newFuelType}
                        onValueChange={setNewFuelType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                        <SelectContent>
                          {fuelTypes.map((fuel) => (
                            <SelectItem
                              key={fuel.fuel_type_id}
                              value={fuel.fuel_type_id.toString()}
                            >
                              <span style={{ color: fuel.color_hex }}>
                                {fuel.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Price per Litre (R)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newFuelPrice}
                        onChange={(e) => setNewFuelPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <Button
                      onClick={handleAddFuel}
                      disabled={addingFuel}
                      className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
                    >
                      {addingFuel ? <Spinner className="mr-2" /> : null}
                      Add Fuel Type
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {fuels.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fuel</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fuels.map((fuel) => (
                      <TableRow key={fuel.fuel_id || fuel.fuel_type_id}>
                        <TableCell>
                          <span style={{ color: fuel.color_hex }}>
                            {fuel.fuel_name}
                          </span>
                        </TableCell>
                        <TableCell>
                          {editingFuelId === fuel.fuel_id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={fuelPriceEdit}
                                onChange={(e) =>
                                  setFuelPriceEdit(e.target.value)
                                }
                                className="w-24"
                              />
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdateFuelPrice(fuel.fuel_id)
                                }
                                disabled={savingFuel}
                              >
                                {savingFuel ? <Spinner /> : "Save"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingFuelId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <span>R{fuel.price_per_liter.toFixed(2)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={fuel.is_available}
                            onCheckedChange={() =>
                              handleToggleAvailability(
                                fuel.fuel_id,
                                fuel.is_available
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingFuelId(fuel.fuel_id);
                              setFuelPriceEdit(
                                fuel.price_per_liter.toString()
                              );
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No fuel types added yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.review_id}
                      className="border-b border-border pb-4 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.user_name}</span>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <p className="text-muted-foreground mt-1">
                        {review.comment}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No reviews yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </ProtectedRoute>
  );
}
