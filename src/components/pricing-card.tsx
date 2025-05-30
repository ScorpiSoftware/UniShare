"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Check,
  Sparkles,
  FileText,
  MessageSquare,
  Mic,
  BookMarked,
  Globe,
  BarChart3
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "./ui/badge";
import { isAppilixOrDevelopment } from "@/utils/appilix-detection";

// Helper function to render the appropriate icon based on the iconName
const renderIcon = (iconName: string, className: string) => {
  switch (iconName) {
    case "FileText":
      return <FileText className={className} />;
    case "MessageSquare":
      return <MessageSquare className={className} />;
    case "Mic":
      return <Mic className={className} />;
    case "BookMarked":
      return <BookMarked className={className} />;
    case "Globe":
      return <Globe className={className} />;
    case "BarChart3":
      return <BarChart3 className={className} />;
    default:
      return <Check className={className} />;
  }
};

export default function PricingCard({
  item,
  user,
}: {
  item: any;
  user: User | null;
}) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [isAppilix, setIsAppilix] = useState(false);

  // Only show Appilix button if user is signed in AND in Appilix environment
  const shouldShowAppilixButton = isAppilix && user;

  // Check if we're in Appilix or development environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAppilix(isAppilixOrDevelopment());

      // Check if we're in a real Appilix app or development
      const isRealAppilix = navigator.userAgent.includes('Appilix');
      const isDevelopment = (window.location.hostname.includes('localhost') ||
                           window.location.hostname.includes('192.')) &&
                           window.innerWidth < 768;

      // Only create mock function in development, not in real Appilix app
      if (isDevelopment && !isRealAppilix && typeof (window as any).appilixPurchaseProduct !== 'function') {
        (window as any).appilixPurchaseProduct = function(productId: string, type: string, redirectUrl: string) {
          console.log('Mock Appilix Purchase:', { productId, type, redirectUrl });
          // Simulate successful purchase by redirecting with a test code
          const testCode = 'test_purchase_code_' + Date.now();
          window.location.href = redirectUrl + '?code=' + testCode;
        };
        console.log('Mock appilixPurchaseProduct function created for testing');
      }
    }
  }, []);



  // Handle checkout process
  const handleCheckout = async (priceId: string) => {
    if (!user) {
      // Redirect to login if user is not authenticated
      window.location.href = "/sign-in";
      return;
    }

    if (priceId === "free" || priceId === "price_free") {
      // For free tier, just redirect to sign up
      window.location.href = "/sign-up";
      return;
    }

    try {
      const supabase = createClient();
      // Get the session to include the access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        console.error("No access token available");
        alert("Authentication error. Please try logging in again.");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-create-checkout",
        {
          body: {
            price_id: priceId,
            user_id: user.id,
            return_url: `${window.location.origin}/dashboard`,
          },
          headers: {
            "X-Customer-Email": user.email || "",
            "Authorization": `Bearer ${accessToken}`,
          },
        },
      );

      if (error) {
        console.error("Error creating checkout session:", error);
        console.error("Error details:", JSON.stringify(error));

        // Show a more detailed error message
        let errorMessage = "Error creating checkout session. ";

        if (error.message) {
          errorMessage += error.message;
        } else if (error.error) {
          errorMessage += error.error;
        } else {
          errorMessage += "Please try again later.";
        }

        alert(errorMessage);
        return;
      }

      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        alert("Error creating checkout session. Please try again later.");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("An unexpected error occurred. Please try again later.");
    }
  };

  return (
    <Card
      className={`w-full relative overflow-hidden ${
        item.popular
          ? "border-2 border-primary shadow-lg md:shadow-xl md:scale-105"
          : "border border-border"
      }`}
    >
      {item.popular && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5 opacity-50" />
      )}
      <CardHeader className="relative">
        {item.popular && item.badge && (
          <div className="flex justify-start mb-4">
            <Badge variant="default" className="px-3 py-1 rounded-full text-xs font-medium bg-primary hover:bg-primary w-auto inline-flex">
              {item.badge}
            </Badge>
          </div>
        )}
        <div className="flex items-center gap-2">
          {item.name === "Scholar+" && <Sparkles className="h-5 w-5 text-primary" />}
          <CardTitle className="text-2xl font-bold tracking-tight">
            {item.name}
          </CardTitle>
        </div>
        <div className="flex flex-col mt-2 text-sm text-muted-foreground">
          {item.amount > 0 ? (
            <>
              {item.yearlyPrice && (
                <div className="flex justify-start mb-4">
                  <div className="inline-flex items-center gap-2 p-1 rounded-full border border-border">
                    <div
                      className={`cursor-pointer px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        billingInterval === "monthly"
                          ? "bg-primary/90 text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-accent"
                      }`}
                      onClick={() => setBillingInterval("monthly")}
                    >
                      Monthly
                    </div>
                    <div
                      className={`cursor-pointer px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        billingInterval === "yearly"
                          ? "bg-primary/90 text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-accent"
                      }`}
                      onClick={() => setBillingInterval("yearly")}
                    >
                      Yearly
                      <span className={`text-xs font-semibold ml-1 ${
                        billingInterval === "yearly"
                          ? "text-primary-foreground"
                          : "text-primary"
                      }`}>
                        Save 30%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-bold text-foreground">
                  ${billingInterval === "yearly" && item.yearlyPrice ? item.yearlyPrice / 100 : item.amount / 100}
                </span>
                <span className="text-muted-foreground">
                  /{billingInterval === "yearly" ? "year" : item.interval}
                </span>
              </div>

              {billingInterval === "monthly" && item.yearlyPrice && (
                <div className="mt-1 text-sm text-muted-foreground">
                  ${(item.amount * 12) / 100}/year if paying monthly
                </div>
              )}
            </>
          ) : (
            <span className="text-3xl md:text-4xl font-bold text-foreground">Free</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-3">
          {item.features?.map((feature: any, index: number) => (
            <li key={index} className="flex items-start gap-2">
              {feature.included ? (
                feature.iconName ? (
                  renderIcon(feature.iconName, "h-5 w-5 text-primary shrink-0 mt-0.5")
                ) : (
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                )
              ) : (
                <span className="h-5 w-5 shrink-0"></span>
              )}
              <span
                className={
                  feature.included
                    ? feature.iconName ? "font-medium text-primary" : ""
                    : "text-muted-foreground"
                }
              >
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="relative">
        {item.name === "Scholar+" ? (
          <>
            {/* Appilix button - ALWAYS rendered in DOM so Appilix can detect it on page load */}
            <div
              className={`w-full ${shouldShowAppilixButton ? "block" : "hidden"}`}
              dangerouslySetInnerHTML={{
                __html: `
                  <button
                    class="inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 px-4 w-full h-auto py-3 text-base md:text-lg font-medium appilix-upgrade-button"
                    onclick="localStorage.setItem('appilix_product_id', '${billingInterval === "yearly" ? process.env.NEXT_PUBLIC_APPILIX_YEARLY_PRODUCT_ID : process.env.NEXT_PUBLIC_APPILIX_MONTHLY_PRODUCT_ID}'); appilixPurchaseProduct('${billingInterval === "yearly" ? process.env.NEXT_PUBLIC_APPILIX_YEARLY_PRODUCT_ID : process.env.NEXT_PUBLIC_APPILIX_MONTHLY_PRODUCT_ID}', 'consumable', window.location.origin + '/dashboard/success')"
                  >
                    Upgrade to Scholar+
                  </button>
                `
              }}
            />

            {/* Regular React button - hidden when showing Appilix button */}
            <Button
              onClick={async () => {
                // Use Stripe checkout with environment variables
                const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;
                const yearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID;

                if (!monthlyPriceId || !yearlyPriceId) {
                  console.error("Missing Stripe price IDs in environment variables");
                  alert("Configuration error. Please contact support.");
                  return;
                }

                // Use the appropriate price ID based on the selected billing interval
                const selectedPriceId = billingInterval === "yearly" ? yearlyPriceId : monthlyPriceId;

                await handleCheckout(selectedPriceId);
              }}
              variant="default"
              className={`w-full h-auto py-3 text-base md:text-lg font-medium ${
                shouldShowAppilixButton ? "hidden" : "block"
              }`}
            >
              Upgrade to Scholar+
            </Button>
          </>
        ) : (
          <Button
            onClick={async () => {
              await handleCheckout(item.id);
            }}
            variant="outline"
            className="w-full h-auto py-3 text-base md:text-lg font-medium"
          >
            Get Started
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
