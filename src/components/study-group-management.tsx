import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogScrollableContent,
  DialogHeaderNoBorder,
  DialogFooterNoBorder,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserPlus, UserMinus, Shield, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface Member {
  user_id: string;
  role: string;
  joined_at: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
}

interface StudyGroupManagementProps {
  groupId: string;
  isAdmin: boolean;
  isCreator: boolean;
  members: Member[];
  group: any;
  onMembersUpdated?: () => void;
}

export default function StudyGroupManagement({
  groupId,
  isAdmin,
  isCreator,
  members,
  group,
  onMembersUpdated,
}: StudyGroupManagementProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const handleDeleteGroup = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/study-groups/${groupId}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete study group");
      }

      console.log("Study group has been deleted successfully");

      // Redirect to the study groups page
      router.push("/dashboard/study-groups");
      router.refresh();
    } catch (error) {
      console.error("Error deleting study group:", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handlePromoteMember = async (userId: string) => {
    try {
      setIsUpdatingMember(true);
      setActionUserId(userId);

      const response = await fetch(`/api/study-groups/${groupId}/members/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "admin" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to promote member");
      }

      console.log("Member has been promoted to admin successfully");

      if (onMembersUpdated) {
        onMembersUpdated();
      }
    } catch (error) {
      console.error("Error promoting member:", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsUpdatingMember(false);
      setActionUserId(null);
    }
  };

  const handleDemoteMember = async (userId: string) => {
    try {
      setIsUpdatingMember(true);
      setActionUserId(userId);

      const response = await fetch(`/api/study-groups/${groupId}/members/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "member" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to demote admin");
      }

      console.log("Admin has been demoted to member successfully");

      if (onMembersUpdated) {
        onMembersUpdated();
      }
    } catch (error) {
      console.error("Error demoting admin:", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsUpdatingMember(false);
      setActionUserId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      setIsUpdatingMember(true);
      setActionUserId(userId);

      const response = await fetch(`/api/study-groups/${groupId}/members/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove member");
      }

      console.log("Member has been removed from the group successfully");

      if (onMembersUpdated) {
        onMembersUpdated();
      }
    } catch (error) {
      console.error("Error removing member:", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsUpdatingMember(false);
      setActionUserId(null);
    }
  };

  // Only show the management options if the user is an admin or creator
  if (!isAdmin && !isCreator) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Group Management</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsMembersDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Manage Members</span>
          </DropdownMenuItem>
          {isCreator && (
            <DropdownMenuItem
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 flex items-center"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Group</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeaderNoBorder>
            <DialogTitle>Delete Study Group</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the study group
              and all of its data, including messages, resources, and member information.
            </DialogDescription>
          </DialogHeaderNoBorder>
          <DialogFooterNoBorder>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteGroup}
              disabled={isDeleting}
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950/30"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooterNoBorder>
        </DialogContent>
      </Dialog>

      {/* Members Management Dialog */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div id="manage-members-description" className="sr-only">Manage study group members dialog</div>
          <DialogHeader>
            <DialogTitle>Manage Members</DialogTitle>
            <DialogDescription>
              Promote members to admins, demote admins to members, or remove members from the group.
            </DialogDescription>
          </DialogHeader>
          <DialogScrollableContent>
            {members.map((member) => (
              <div key={member.user_id} className="mb-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8 avatar">
                      <AvatarImage
                        src={member.avatar_url || undefined}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {(member.full_name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.full_name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">@{member.username || 'user'}</p>
                    </div>
                    {member.role === "admin" && (
                      <Badge variant="outline" className="ml-2">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    {isCreator && member.role !== "admin" && member.user_id !== actionUserId && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePromoteMember(member.user_id)}
                        disabled={isUpdatingMember}
                        title="Promote to Admin"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                    )}
                    {isCreator && member.role === "admin" && member.user_id !== actionUserId &&
                     member.user_id !== group.created_by && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDemoteMember(member.user_id)}
                        disabled={isUpdatingMember}
                        title="Demote to Member"
                      >
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    {((isCreator && member.user_id !== actionUserId && member.user_id !== group.created_by) ||
                      (isAdmin && member.role !== "admin" && member.user_id !== actionUserId)) && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={isUpdatingMember}
                        className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950/30"
                        title="Remove from Group"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                    {member.user_id === actionUserId && (
                      <Button variant="outline" size="sm" disabled>
                        Processing...
                      </Button>
                    )}
                  </div>
                </div>
                {/* Only add separator if not the last item */}
                {members.indexOf(member) < members.length - 1 && (
                  <Separator className="mt-2" />
                )}
              </div>
            ))}
          </DialogScrollableContent>
        </DialogContent>
      </Dialog>
    </>
  );
}
