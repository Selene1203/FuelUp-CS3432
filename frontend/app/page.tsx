"use client";

import Link from "next/link";
import { Fuel, Search, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md mx-auto">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-[#FF6B00]/10">
            <Fuel className="h-12 w-12 text-[#FF6B00]" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-foreground mb-2">FuelUp</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Find fuel near you, fast
        </p>

        <div className="flex flex-col gap-3 w-full">
          <Button
            asChild
            size="lg"
            className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
          >
            <Link href="/search">
              <Search className="mr-2 h-5 w-5" />
              Find a Station
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00]/10"
          >
            <Link href="/login">
              <LogIn className="mr-2 h-5 w-5" />
              Login
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
