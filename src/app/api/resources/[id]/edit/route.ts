import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const resourceId = params.id;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 },
      );
    }

    // Check if user is the author of the resource
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("author_id, file_url, external_link, resource_type, course_code")
      .eq("id", resourceId)
      .single();

    if (resourceError) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    if (resource.author_id !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized to edit this resource" },
        { status: 403 },
      );
    }

    // Get the updated data from the request
    const data = await request.json();

    // Character limits
    const charLimits = {
      title: 25,
      description: 100,
      course_code: 10,
      external_link: 100
    };

    // Check character limits
    if (data.title && data.title.length > charLimits.title) {
      return NextResponse.json(
        { error: `Title must be ${charLimits.title} characters or less` },
        { status: 400 }
      );
    }

    if (data.description && data.description.length > charLimits.description) {
      return NextResponse.json(
        { error: `Description must be ${charLimits.description} characters or less` },
        { status: 400 }
      );
    }

    if (data.course_code && data.course_code.length > charLimits.course_code) {
      return NextResponse.json(
        { error: `Course code must be ${charLimits.course_code} characters or less` },
        { status: 400 }
      );
    }

    if (data.external_link && data.external_link.length > charLimits.external_link) {
      return NextResponse.json(
        { error: `External URL must be ${charLimits.external_link} characters or less` },
        { status: 400 }
      );
    }

    // Check for bad words in text fields
    const { containsBadWords } = await import('@/utils/badWords');

    // Check title
    if (data.title && await containsBadWords(data.title)) {
      return NextResponse.json(
        { error: "Title contains inappropriate language" },
        { status: 400 },
      );
    }

    // Check description
    if (data.description && await containsBadWords(data.description)) {
      return NextResponse.json(
        { error: "Description contains inappropriate language" },
        { status: 400 },
      );
    }

    // Check course code
    if (data.course_code && await containsBadWords(data.course_code)) {
      return NextResponse.json(
        { error: "Course code contains inappropriate language" },
        { status: 400 },
      );
    }

    // Update the resource
    const { error: updateError } = await supabase
      .from("resources")
      .update({
        title: data.title,
        description: data.description,
        resource_type: data.resource_type,
        course_code: data.course_code,
        external_link: data.external_link,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resourceId);

    if (updateError) {
      console.error("Error updating resource:", updateError);
      return NextResponse.json(
        { error: "Failed to update resource" },
        { status: 500 },
      );
    }

    // Check if we need to regenerate the thumbnail
    const needsNewThumbnail =
      (data.resource_type !== resource.resource_type) || // Resource type changed
      (data.external_link !== resource.external_link && data.resource_type === 'link'); // External link changed for link resources

    // Check if course code changed
    const courseCodeChanged = data.course_code && data.course_code !== resource.course_code;

    // If course code changed and is not empty, log it (notifications are handled by database triggers)
    if (courseCodeChanged && data.course_code) {
      console.log(`Resource updated with new course code ${data.course_code} - notifications will be handled by database triggers`);
    }

    if (needsNewThumbnail) {
      try {
        // Get the updated resource to ensure we have the latest data
        const { data: updatedResource } = await supabase
          .from("resources")
          .select("file_url, external_link")
          .eq("id", resourceId)
          .single();

        // Don't await this - let it run in the background
        fetch(`${request.nextUrl.origin}/api/thumbnails/screenshot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceId,
            resourceType: data.resource_type,
            fileUrl: updatedResource?.file_url || resource.file_url,
            externalLink: updatedResource?.external_link || data.external_link,
          }),
        }).catch(e => console.error('Background thumbnail regeneration failed:', e));
      } catch (e) {
        console.error('Error triggering thumbnail regeneration:', e);
        // Don't fail the request if thumbnail regeneration fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
