import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { sendNotification } from "@/utils/notifications";

export const dynamic = "force-dynamic";


/**
 * Simplified follow/unfollow API with no RLS concerns
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    // Get target user ID from route params
    const targetUserId = params.userId;

    // Parse request body
    const body = await request.json();
    const action = body.action;

    if (!action || (action !== "follow" && action !== "unfollow")) {
      return NextResponse.json(
        { success: false, error: "Valid action (follow/unfollow) is required" },
        { status: 400 },
      );
    }

    // Get current user
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Prevent following yourself
    if (targetUserId === user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot follow yourself" },
        { status: 400 },
      );
    }

    // Check if target user exists
    const { data: targetUser } = await supabase
      .from("user_profiles")
      .select("id, username, full_name")
      .eq("id", targetUserId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Use the regular client with RLS policies
    // We'll rely on the RLS policies to control access
    const client = supabase;

    // Handle follow/unfollow
    if (action === "follow") {
      // Check if already following
      const { data: existing } = await client
        .from("user_followers")
        .select("*")
        .eq("user_id", targetUserId)
        .eq("follower_id", user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          success: true,
          message: "Already following this user",
        });
      }

      // Create follow relationship
      const { error: followError } = await client
        .from("user_followers")
        .insert({
          user_id: targetUserId,
          follower_id: user.id,
          created_at: new Date().toISOString(),
        });

      // Update follower and following counts
      if (!followError) {
        // Increment target user's follower count
        await client.rpc("increment_follower_count", {
          user_id: targetUserId,
        });

        // Increment current user's following count
        await client.rpc("increment_following_count", {
          user_id: user.id,
        });
      }

      if (followError) {
        console.error("Follow error:", followError);
        return NextResponse.json(
          { success: false, error: "Failed to follow user" },
          { status: 500 },
        );
      }

      // Check if a notification already exists for this follow action to prevent duplicates
      try {
        const { data: followerProfile } = await client
          .from("user_profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        const followerUsername = followerProfile?.username || "someone";

        // Check for existing notifications from this user to prevent duplicates
        const { data: existingNotifications } = await client
          .from("notifications")
          .select("*")
          .eq("user_id", targetUserId)
          .eq("actor_id", user.id)
          .eq("type", "follow")
          .limit(1);

        // Only insert if no existing notification is found
        if (!existingNotifications || existingNotifications.length === 0) {
          // Send notification (both in-app and push)
          await sendNotification({
            user_id: targetUserId,
            title: "New Follower",
            message: `User @${followerUsername} started following you`,
            type: "follow",
            link: `/u/${followerUsername}`,
            actor_id: user.id,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      } catch (notificationError) {
        console.log(
          "Failed to create notification, but follow was successful:",
          notificationError,
        );
        // Continue even if notification creation fails
      }

      return NextResponse.json({
        success: true,
        action: "follow",
        message: `You are now following ${targetUser.username || targetUser.full_name || "this user"}`,
      });
    } else {
      // Unfollow action
      const { error: unfollowError } = await client
        .from("user_followers")
        .delete()
        .eq("user_id", targetUserId)
        .eq("follower_id", user.id);

      // Update follower and following counts
      if (!unfollowError) {
        // Decrement target user's follower count
        await client.rpc("decrement_follower_count", {
          user_id: targetUserId,
        });

        // Decrement current user's following count
        await client.rpc("decrement_following_count", {
          user_id: user.id,
        });
      }

      if (unfollowError) {
        console.error("Unfollow error:", unfollowError);
        return NextResponse.json(
          { success: false, error: "Failed to unfollow user" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        action: "unfollow",
        message: `You have unfollowed ${targetUser.username || targetUser.full_name || "this user"}`,
      });
    }
  } catch (error) {
    console.error("Error in follow API:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
