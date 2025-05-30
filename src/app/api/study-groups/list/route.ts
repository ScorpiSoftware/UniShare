import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;

    // Pagination parameters
    const limit = parseInt(searchParams.get('limit') || '6', 10); // Number of items per page
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search') || '';

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's university
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("university_id")
      .eq("id", user.id)
      .single();

    // Get public study groups for user's university
    console.log('API: Fetching public study groups for university:', userProfile?.university_id);

    // Get total count first
    let countQuery = supabase
      .from('study_groups')
      .select('*', { count: 'exact', head: true })
      .eq('university_id', userProfile?.university_id)
      .eq('is_private', false);

    // Apply search filter to count query if provided
    if (search) {
      countQuery = countQuery.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,course_code.ilike.%${search}%`
      );
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('API: Error getting total count:', countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Build query with search if provided - use the member_count column directly
    let query = supabase
      .from('study_groups')
      .select('*')
      .eq('university_id', userProfile?.university_id)
      .eq('is_private', false);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,course_code.ilike.%${search}%`
      );
    }

    // Apply pagination
    query = query.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute the query
    const { data: studyGroups, error: studyGroupsError } = await query;

    if (studyGroupsError) {
      console.error('API: Error fetching study groups:', studyGroupsError);
      return NextResponse.json({ error: studyGroupsError.message }, { status: 500 });
    } else {
      console.log('API: Found study groups:', studyGroups?.length || 0);
    }

    // Get user's study groups
    const { data: userStudyGroups } = await supabase
      .from("study_group_members")
      .select("study_group_id")
      .eq("user_id", user.id);

    const userGroupIds =
      userStudyGroups?.map((group) => group.study_group_id) || [];

    // Get full details of user's study groups (including private ones)
    let myStudyGroups = [];

    if (userGroupIds.length > 0) {
      // Use a direct query to get all study groups the user is a member of
      const { data: memberGroups, error: memberGroupsError } = await supabase
        .from("study_groups")
        .select("*")
        .in("id", userGroupIds)
        .order("created_at", { ascending: false });

      if (memberGroupsError) {
        console.error('API: Error fetching user study groups:', memberGroupsError);
      } else {
        myStudyGroups = memberGroups || [];
        console.log('API: Found user study groups:', myStudyGroups.length);

        // Log the IDs of the groups for debugging
        console.log('API: User study group IDs:', myStudyGroups.map(g => g.id));
      }
    }

    // Log the data for debugging
    console.log('API: Returning data:', {
      studyGroups: studyGroups?.length || 0,
      userGroupIds: userGroupIds?.length || 0,
      myStudyGroups: myStudyGroups?.length || 0,
      myStudyGroupsIds: myStudyGroups?.map(g => g.id) || []
    });

    // Log the data for debugging
    console.log('API: Returning data:', {
      studyGroups: studyGroups?.length || 0,
      userGroupIds: userGroupIds?.length || 0,
      myStudyGroups: myStudyGroups?.length || 0,
      myStudyGroupsIds: myStudyGroups?.map(g => g.id) || []
    });

    return NextResponse.json({
      studyGroups,
      userGroupIds,
      myStudyGroups,
      totalCount
    });
  } catch (error) {
    console.error("API: Unexpected error fetching study groups:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
