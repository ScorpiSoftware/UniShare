"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let mounted = true;

    const initializeSupabase = async () => {
      try {
        // Dynamically import to avoid issues with environment variables
        const { createClientOnlyClient } = await import(
          "@/utils/supabase/client-only"
        );
        const supabaseClient = createClientOnlyClient();

        // Only update state if component is still mounted
        if (mounted) {
          setSupabase(supabaseClient);
        }

        // Get user immediately after initializing
        try {
          const { data, error: authError } =
            await supabaseClient.auth.getUser();
          if (!authError && data?.user && mounted) {
            setUser(data.user);
          }
        } catch (userError) {
          console.error("Error fetching user:", userError);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }

        // Set up auth listener
        try {
          const { data: listener } = supabaseClient.auth.onAuthStateChange(
            (event, session) => {
              if (!mounted) return;

              if (session?.user) {
                setUser(session.user);
              } else {
                setUser(null);
              }
              setLoading(false);
            },
          );

          // Store cleanup function to be called on unmount
          if (listener && listener.subscription) {
            cleanup = () => {
              if (
                listener &&
                listener.subscription &&
                typeof listener.subscription.unsubscribe === "function"
              ) {
                try {
                  listener.subscription.unsubscribe();
                } catch (unsubError) {
                  console.error(
                    "Error unsubscribing from auth listener:",
                    unsubError,
                  );
                }
              }
            };
          }
        } catch (listenerError) {
          console.error("Error setting up auth listener:", listenerError);
          if (mounted) {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to initialize Supabase client:", err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    };

    initializeSupabase();

    // Return cleanup function
    return () => {
      mounted = false;
      if (cleanup && typeof cleanup === "function") {
        try {
          cleanup();
        } catch (cleanupError) {
          console.error("Error during cleanup:", cleanupError);
        }
      }
    };
  }, []);

  // If there's an error initializing Supabase, show a simplified navbar
  if (error) {
    return (
      <nav className="w-full border-b border-border bg-background py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/android-chrome-192x192.png"
              alt="UniShare Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-xl font-bold">UniShare</span>
          </Link>
          <div className="flex gap-4 items-center">
            <ThemeToggle />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full border-b border-border bg-background py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/android-chrome-192x192.png"
            alt="UniShare Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-xl font-bold">UniShare</span>
        </Link>

        <div className="hidden lg:flex gap-6 items-center">
          <button
            type="button"
            className="text-foreground/80 hover:text-primary font-medium bg-transparent border-none cursor-pointer p-0 m-0"
            onClick={() => {
              // Direct scroll without any router involvement
              const featuresSection = document.getElementById("platform-features");
              if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: "smooth" });
              } else if (window.location.pathname !== "/") {
                // If not on homepage, navigate to homepage with hash
                window.location.href = "/#platform-features";
              }
            }}
          >
            Features
          </button>
          <button
            type="button"
            className="text-foreground/80 hover:text-primary font-medium bg-transparent border-none cursor-pointer p-0 m-0"
            onClick={() => {
              // Direct scroll without any router involvement
              const howItWorksSection = document.getElementById("how-it-works");
              if (howItWorksSection) {
                howItWorksSection.scrollIntoView({ behavior: "smooth" });
              } else if (window.location.pathname !== "/") {
                // If not on homepage, navigate to homepage with hash
                window.location.href = "/#how-it-works";
              }
            }}
          >
            How It Works
          </button>
          <Link
            href="/universities"
            className="text-foreground/80 hover:text-primary font-medium"
          >
            Universities
          </Link>
          <Link
            href="/pricing"
            className="text-foreground/80 hover:text-primary font-medium"
          >
            Pricing
          </Link>
        </div>

        <div className="flex gap-4 items-center">
          <ThemeToggle />
          {!loading && user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden md:block px-4 py-2 text-sm font-medium"
              >
                <Button>Dashboard</Button>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary"
              >
                Sign In
              </Link>
              <Link
                href="/verify-invite"
                className="hidden md:block px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
              >
                Join Now
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
