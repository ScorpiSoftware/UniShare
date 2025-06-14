"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CreditCard, Sparkles, XCircle, CheckCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogHeaderNoBorder,
  DialogFooterNoBorder,
} from "@/components/ui/dialog";

interface SubscriptionManagementProps {
  onSubscriptionUpdate?: (subscriptionData: any) => void;
  showAccessButton?: boolean;
}

export default function SubscriptionManagement({
  onSubscriptionUpdate,
  showAccessButton = true
}: SubscriptionManagementProps = {}) {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);
  const [isAppilixEnvironment, setIsAppilixEnvironment] = useState(false);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError("User not found. Please sign in.");
          setLoading(false);
          return;
        }

        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subscriptionError) {
          console.error("Error fetching subscription:", subscriptionError);
          setError("Error fetching subscription data.");
          setLoading(false);
          return;
        }

        setSubscription(subscriptionData);

        // Notify parent component about subscription data
        if (onSubscriptionUpdate && subscriptionData) {
          // Convert to the format expected by the parent component
          const subscriptionPlan = {
            status: subscriptionData.status,
            // If subscription is active, it's a premium plan
            plan: subscriptionData.status === "active" ? "premium" : "free",
            nextBillingDate: subscriptionData.current_period_end,
            cancelAtPeriodEnd: subscriptionData.cancel_at_period_end
          };

          console.log("Updating parent with subscription data:", subscriptionPlan);
          onSubscriptionUpdate(subscriptionPlan);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error in fetchSubscription:", error);
        setError("An unexpected error occurred.");
        setLoading(false);
      }
    }

    fetchSubscription();

    // Check if we're in Appilix environment and set up mock function for testing
    if (typeof window !== 'undefined') {
      // Check for Appilix environment
      const isAppilix = navigator.userAgent.includes('Appilix');
      const isLocalhost = window.location.hostname.includes('localhost') || window.location.hostname.includes('192.');
      const isMobileView = window.innerWidth <= 768; // Simple mobile detection

      // Set Appilix environment state
      const appilixEnv = isAppilix || (isLocalhost && isMobileView);
      setIsAppilixEnvironment(appilixEnv);

      // Only create mock function in development, not in real Appilix app
      const isDevelopment = isLocalhost && isMobileView;
      if (isDevelopment && !isAppilix && typeof (window as any).appilixPurchaseProduct !== 'function') {
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

  const handleCancelSubscription = async () => {
    try {
      setCancelLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("User not found. Please sign in.");
        setCancelLoading(false);
        return;
      }

      // Get the session to include the access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        console.error("No access token available");
        setError("Authentication error. Please try logging in again.");
        setCancelLoading(false);
        return;
      }

      // Call the Supabase Edge Function to cancel the subscription
      const { error } = await supabase.functions.invoke(
        "supabase-functions-cancel-subscription",
        {
          body: {
            subscription_id: subscription.stripe_id,
            user_id: user.id,
          },
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        },
      );

      if (error) {
        console.error("Error canceling subscription:", error);
        setError("Error canceling subscription. Please try again.");
        setCancelLoading(false);
        return;
      }

      // Update the local subscription state
      const updatedSubscription = {
        ...subscription,
        cancel_at_period_end: true,
      };

      setSubscription(updatedSubscription);

      // Notify parent component about subscription update
      if (onSubscriptionUpdate) {
        const subscriptionPlan = {
          status: updatedSubscription.status,
          // Even if canceling, it's still premium until the end of the period
          plan: updatedSubscription.status === "active" ? "premium" : "free",
          nextBillingDate: updatedSubscription.current_period_end,
          cancelAtPeriodEnd: true
        };

        console.log("Updating parent after cancellation:", subscriptionPlan);
        onSubscriptionUpdate(subscriptionPlan);
      }

      setCancelSuccess(true);
      setCancelLoading(false);
    } catch (error) {
      console.error("Error in handleCancelSubscription:", error);
      setError("An unexpected error occurred.");
      setCancelLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("User not found. Please sign in.");
        setPortalLoading(false);
        return;
      }

      // Get the session to include the access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        console.error("No access token available");
        setError("Authentication error. Please try logging in again.");
        setPortalLoading(false);
        return;
      }

      // Call the Supabase Edge Function to create a customer portal session
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-create-portal",
        {
          body: {
            customer_id: subscription.customer_id,
            user_id: user.id,
            return_url: window.location.href,
          },
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        },
      );

      if (error) {
        console.error("Error creating portal session:", error);
        setError("Error creating portal session. Please try again.");
        setPortalLoading(false);
        return;
      }

      // Redirect to the customer portal
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError("No portal URL returned.");
        setPortalLoading(false);
      }
    } catch (error) {
      console.error("Error in handleManageSubscription:", error);
      setError("An unexpected error occurred.");
      setPortalLoading(false);
    }
  };



  // Helper function to check if subscription is from Appilix
  const isAppilixSubscription = (subscription: any) => {
    return subscription?.stripe_id?.startsWith('appilix_') ||
           subscription?.metadata?.source === 'appilix';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-4">
        <div className="grid gap-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium">Active</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan:</span>
            <span className="font-medium">Free</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Features:</span>
            <span className="font-medium">Basic</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-2 pt-4">
          <Button asChild className="w-full md:w-auto">
            <Link href="/pricing">
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade to Scholar+
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isActive = subscription.status === "active";
  const isCanceled = subscription.status === "canceled";
  const willCancel = subscription.cancel_at_period_end;
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;

  return (
    <div className="space-y-4">
      {cancelSuccess && (
        <div className="flex items-center gap-3 p-4 mb-4 rounded-lg bg-primary/10 border border-primary/20 text-primary">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-sm">Subscription Canceled</h4>
            <p className="text-sm text-primary/80 mt-1">
              Your subscription has been canceled. You will still have access to Scholar+ features until the end of your current billing period.
            </p>
          </div>
          <button
            onClick={() => setCancelSuccess(false)}
            className="flex-shrink-0 text-primary/60 hover:text-primary"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="grid gap-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <span className="font-medium">
            {isActive
              ? willCancel
                ? "Active (Canceling)"
                : "Active"
              : isCanceled
              ? "Canceled"
              : subscription.status}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Plan:</span>
          <span className="font-medium">Scholar+</span>
        </div>

        {currentPeriodEnd && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {willCancel
                ? "Access Until:"
                : isAppilixSubscription(subscription)
                  ? "Access Until:"
                  : "Next Billing Date:"
              }
            </span>
            <span className="font-medium">{format(currentPeriodEnd, "MMMM d, yyyy")}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount:</span>
          <span className="font-medium">
            ${(subscription.amount / 100).toFixed(2)}/{subscription.interval}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 pt-4">
        {/* Buttons for active subscription */}
        {subscription && isActive && (
          <>
            {/* Access Scholar+ Button - always show for active subscribers */}
            {showAccessButton && (
              <Button variant="outline" asChild className="w-full md:w-auto">
                <Link href="/dashboard/tools">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Access Scholar+
                </Link>
              </Button>
            )}

            {/* Different buttons based on subscription type */}
            {isAppilixSubscription(subscription) ? (
              /* Appilix Subscription - Show Renew Button only in Appilix environment */
              isAppilixEnvironment && (
                <div
                  dangerouslySetInnerHTML={{
                    __html: `
                      <button
                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full md:w-auto"
                        ${renewLoading ? 'disabled' : ''}
                        onclick="localStorage.setItem('appilix_product_id', '${subscription?.interval === "year" ? process.env.NEXT_PUBLIC_APPILIX_YEARLY_PRODUCT_ID : process.env.NEXT_PUBLIC_APPILIX_MONTHLY_PRODUCT_ID}'); appilixPurchaseProduct('${subscription?.interval === "year" ? process.env.NEXT_PUBLIC_APPILIX_YEARLY_PRODUCT_ID : process.env.NEXT_PUBLIC_APPILIX_MONTHLY_PRODUCT_ID}', 'consumable', window.location.origin + '/dashboard/success')"
                      >
                        ${renewLoading ? `
                          <svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ` : `
                          <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                            <path d="M21 3v5h-5"></path>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                            <path d="M3 21v-5h5"></path>
                          </svg>
                        `}
                        Renew ${subscription.interval === "year" ? "Year" : "Month"}
                      </button>
                    `
                  }}
                />
              )
            ) : (
              /* Stripe Subscription - Show Manage and Cancel Buttons */
              <>
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="w-full md:w-auto"
                >
                  {portalLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Manage Subscription
                </Button>

                {!willCancel && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelDialog(true)}
                      className="w-full md:w-auto text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950/30"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Subscription
                    </Button>

                    {/* Cancel Confirmation Dialog */}
                    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeaderNoBorder>
                          <DialogTitle>Cancel Subscription</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to cancel your Scholar+ subscription? You'll still have access to all Scholar+ features until the end of your current billing period.
                          </DialogDescription>
                        </DialogHeaderNoBorder>
                        <DialogFooterNoBorder>
                          <Button
                            variant="outline"
                            onClick={() => setShowCancelDialog(false)}
                            disabled={cancelLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              handleCancelSubscription();
                              setShowCancelDialog(false);
                            }}
                            disabled={cancelLoading}
                            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950/30"
                          >
                            {cancelLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Canceling...
                              </>
                            ) : (
                              "Cancel Subscription"
                            )}
                          </Button>
                        </DialogFooterNoBorder>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Upgrade Button for Free Users is now in the Free Plan section */}
      </div>
    </div>
  );
}
