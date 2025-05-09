import { DashboardNavbarServer } from "@/components/server/dashboard-navbar-server";
import BottomNavbar from "@/components/bottom-navbar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClientWrapper } from "@/components/dashboard-client-wrapper";
import AppilixUserIdentity from "@/components/appilix-user-identity";
import AppilixUrlIdentity from "@/components/appilix-url-identity";
import AppilixCookieIdentity from "@/components/appilix-cookie-identity";
import AppilixCookieScript from "@/components/appilix-cookie-script";

export const metadata = {
  title: "UniShare | Dashboard",
  description:
    "View your personalized dashboard with resources and study groups",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/sign-in?error=Please sign in to access the dashboard");
  }

  // Get user settings for initial color scheme and font size
  const { data: userSettings } = await supabase
    .from("user_settings")
    .select("color_scheme, font_size")
    .eq("user_id", data.user.id)
    .single();

  const colorScheme = userSettings?.color_scheme || "default";
  const fontSize = userSettings?.font_size || 2;
  const rootSize = 16 + (fontSize - 2) * 1; // Base size is 16px, each step changes by 1px

  // Prepare attributes for the dashboard container
  const dataAccentAttr =
    colorScheme !== "default" ? { "data-accent": colorScheme } : {};
  // Apply font size directly to html element for immediate effect
  const styleAttr = { fontSize: `${rootSize}px` };

  return (
    <DashboardClientWrapper
      initialAuthState={true}
      initialFontSize={fontSize}
      initialAccentColor={colorScheme}
    >
      <div
        className="flex flex-col min-h-screen dashboard-styles"
        {...dataAccentAttr}
        style={styleAttr}
      >
        {/* Appilix user identity script for push notifications */}
        <AppilixUserIdentity />
        {/* Appilix user identity from URL parameters */}
        <AppilixUrlIdentity />
        {/* Appilix user identity from cookies */}
        <AppilixCookieIdentity />
        {/* Script to read cookie and set Appilix identity */}
        <AppilixCookieScript />
        <DashboardNavbarServer />
        <main className="flex-1 w-full pb-20 md:pb-0">{children}</main>
        <BottomNavbar />
      </div>
    </DashboardClientWrapper>
  );
}
