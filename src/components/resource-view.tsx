"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Download,
  ThumbsUp,
  Edit,
  Trash,
  ExternalLink,
  MessageSquare,
  Send,
  RefreshCw,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import ResourceEditForm from "./resource-edit-form";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  course_code?: string;
  professor?: string;
  file_url?: string;
  external_link?: string;
  author_id: string;
  created_at: string;
  view_count: number;
  download_count: number;
  likes?: number;
  comment_count?: number;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  resource_id: string;
  user_profiles: {
    id?: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

// Format numbers to use k, m, etc. for thousands, millions, etc.
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "m";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toString();
};

export default function ResourceView({
  resource,
  isOwner = false,
}: {
  resource: Resource;
  isOwner?: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(resource.likes || 0);
  const [showPdfViewer, setShowPdfViewer] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState<number>(
    resource.comment_count || 0,
  );
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isRefreshingComments, setIsRefreshingComments] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch comments and update the count
  const fetchComments = async () => {
    try {
      setIsRefreshingComments(true);
      const timestamp = new Date().getTime(); // Add timestamp to prevent caching
      const response = await fetch(
        `/api/resources/${resource.id}/comments?t=${timestamp}`,
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.comments) {
          setComments(data.comments);
          // Always use the server's count
          setCommentCount(data.count);
          console.log("Updated comment count:", data.count);
        } else {
          console.error("No comments in response:", data);
          setComments([]);
          setCommentCount(0);
        }
      } else {
        console.error("Error fetching comments:", await response.text());
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setIsRefreshingComments(false);
    }
  };

  // Submit a new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      const response = await fetch(`/api/resources/${resource.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: newComment }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewComment("");
        // Update comments list with the new comment
        if (data.comment) {
          setComments((prevComments) => [data.comment, ...prevComments]);
        }

        // Update comment count from server response
        setCommentCount(data.count);
        console.log("New comment count after adding:", data.count);
      } else {
        setCommentError(data.error || "Failed to post comment");
      }
    } catch (err: any) {
      setCommentError(err.message || "An error occurred");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/resources/${resource.id}/comments?commentId=${commentId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Remove the deleted comment from the list
        setComments((prevComments) =>
          prevComments.filter((comment) => comment.id !== commentId),
        );

        // Update comment count from server response
        setCommentCount(data.count);
        console.log("New comment count after deleting:", data.count);
      } else {
        const data = await response.json();
        console.error("Error deleting comment:", data.error);
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  // Format date for comments
  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Initialize comments and setup
  useEffect(() => {
    // Fetch comments when the component mounts
    fetchComments();

    // Store the original body styles
    const originalBodyStyle = document.body.style.cssText;
    const originalBodyClassName = document.body.className;

    // Add a global style to use theme background on PDF viewers
    const styleElement = document.createElement("style");
    styleElement.id = "pdf-viewer-styles";
    styleElement.textContent = `
      .bg-background {
        background-color: hsl(var(--background)) !important;
      }
      iframe[title*="PDF viewer"] {
        background-color: hsl(var(--background)) !important;
      }
      iframe[title*="PDF viewer"]::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: hsl(var(--background)) !important;
        z-index: 0;
      }
    `;

    // Check if the style element already exists before appending
    if (!document.getElementById("pdf-viewer-styles")) {
      document.head.appendChild(styleElement);
    }

    // Listen for the custom event to close the edit dialog
    const handleEditComplete = () => setShowEditDialog(false);
    document.addEventListener("resource-edit-complete", handleEditComplete);

    // Check if the user has already liked this resource
    const checkLikeStatus = async () => {
      try {
        setIsLoading(true);
        const timestamp = new Date().getTime(); // Add timestamp to prevent caching
        const response = await fetch(
          `/api/resources/${resource.id}/like?t=${timestamp}`,
          {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setHasLiked(data.hasLiked);
          setLikeCount(data.likeCount);
        }
      } catch (err) {
        console.error("Error checking like status:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkLikeStatus();

    // Set up a realtime subscription for like count updates
    const setupRealtimeSubscription = async () => {
      try {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();

        // Subscribe to changes on the resource_likes table for this resource
        const subscription = supabase
          .channel("resource-likes-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "resource_likes",
              filter: `resource_id=eq.${resource.id}`,
            },
            () => {
              // When a change occurs, refresh the like count
              checkLikeStatus();
            },
          )
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
        };
      } catch (err) {
        console.error("Error setting up realtime subscription:", err);
        return () => {};
      }
    };

    const unsubscribe = setupRealtimeSubscription();

    return () => {
      // Restore the original body styles when component unmounts
      document.body.style.cssText = originalBodyStyle;
      document.body.className = originalBodyClassName;

      // Force a reset of any background-color that might have been applied
      document.body.style.removeProperty("background-color");

      // Remove the added style element
      const styleToRemove = document.getElementById("pdf-viewer-styles");
      if (styleToRemove && document.head.contains(styleToRemove)) {
        document.head.removeChild(styleToRemove);
      }

      // Remove any other PDF viewer styles that might have been added
      const allStyles = document.head.getElementsByTagName("style");
      for (let i = allStyles.length - 1; i >= 0; i--) {
        const style = allStyles[i];
        if (style.textContent && style.textContent.includes("PDF viewer")) {
          document.head.removeChild(style);
        }
      }

      document.removeEventListener(
        "resource-edit-complete",
        handleEditComplete,
      );
      // Clean up the subscription when component unmounts
      if (typeof unsubscribe === "function") {
        unsubscribe();
      } else if (unsubscribe instanceof Promise) {
        unsubscribe.then((fn) => typeof fn === "function" && fn());
      }
    };
  }, [resource.id]);

  // Set up a realtime subscription for comments
  useEffect(() => {
    const setupCommentsSubscription = async () => {
      try {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();

        // Subscribe to changes on the resource_comments table for this resource
        const subscription = supabase
          .channel("resource-comments-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "resource_comments",
              filter: `resource_id=eq.${resource.id}`,
            },
            () => {
              // When a change occurs, refresh the comments
              fetchComments();
            },
          )
          .subscribe();

        // Also subscribe to changes on the resources table for this resource
        // to catch comment_count updates
        const resourceSubscription = supabase
          .channel("resource-updates")
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "resources",
              filter: `id=eq.${resource.id}`,
            },
            (payload) => {
              // When the resource is updated, check if comment_count changed
              if (
                payload.new &&
                typeof payload.new.comment_count === "number"
              ) {
                console.log(
                  "Resource updated with new comment count:",
                  payload.new.comment_count,
                );
                setCommentCount(payload.new.comment_count);
              }
            },
          )
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
          supabase.removeChannel(resourceSubscription);
        };
      } catch (err) {
        console.error("Error setting up comments subscription:", err);
        return () => {};
      }
    };

    const unsubscribe = setupCommentsSubscription();

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      } else if (unsubscribe instanceof Promise) {
        unsubscribe.then((fn) => typeof fn === "function" && fn());
      }
    };
  }, [resource.id]);

  // Scroll to the bottom of the comments when a new comment is added
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Determine if we're handling an external link or a file
      const isExternalLink = !!resource.external_link;
      const isFileResource = !!resource.file_url;

      if (!isExternalLink && !isFileResource) {
        throw new Error("No downloadable content available");
      }

      // Record the download in a more resilient way
      const recordDownload = () => {
        // Create a hidden image to make a silent request
        // This approach avoids console errors completely
        const img = new Image();
        const timestamp = new Date().getTime();
        img.src = `/api/resources/${resource.id}/download?t=${timestamp}`;
        img.style.display = "none";
        img.onload = img.onerror = () => {
          // Remove the image after it loads or errors
          if (document.body.contains(img)) {
            document.body.removeChild(img);
          }
        };
        document.body.appendChild(img);
      };

      // Call the record function but don't await it
      recordDownload();

      // Handle external link
      if (isExternalLink && resource.external_link) {
        try {
          // Use a safer way to open links
          const newWindow = window.open();
          if (newWindow) {
            newWindow.opener = null; // For security
            newWindow.location.href = resource.external_link;
            newWindow.focus();
          } else {
            // Fallback if popup is blocked
            window.location.href = resource.external_link;
          }
          router.refresh();
          return;
        } catch (linkError) {
          console.error("Error opening external link:", linkError);
          setError(
            "Failed to open external link. It may be blocked by your browser.",
          );
        }
      }

      // Handle file download
      if (isFileResource && resource.file_url) {
        try {
          // Create a hidden anchor element for more reliable downloads
          const link = document.createElement("a");
          link.href = resource.file_url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.download = resource.title || "download"; // Use resource title as filename if available

          // Append to body, click, and remove
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            // Use setTimeout to ensure the click event has time to fire
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
          }, 100);

          router.refresh();
        } catch (fileError) {
          console.error("Error downloading file:", fileError);
          setError("Failed to download file. Please try again later.");
        }
      }
    } catch (err: any) {
      console.error("Download error:", err);
      // Only show errors related to the actual download, not the recording
      if (err.name !== "AbortError") {
        setError(
          typeof err.message === "string"
            ? err.message
            : "An error occurred while downloading",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPdf = () => {
    setShowPdfViewer(!showPdfViewer);
  };

  const handleLike = async () => {
    if (hasLiked) return; // Prevent multiple likes

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/resources/${resource.id}/like`, {
        method: "POST",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to like resource");
      }

      // Update local state
      setHasLiked(true);
      setLikeCount(data.likeCount);
    } catch (err: any) {
      setError(err.message || "An error occurred while liking the resource");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/resources/${resource.id}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete resource");
      }

      setShowDeleteDialog(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting the resource");
    } finally {
      setIsLoading(false);
    }
  };

  // Format date
  const formattedDate = new Date(resource.created_at).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  // Get resource type color
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "notes":
        return "bg-blue-100 text-blue-800";
      case "textbook":
        return "bg-purple-100 text-purple-800";
      case "solution":
        return "bg-green-100 text-green-800";
      case "study guide":
        return "bg-yellow-100 text-yellow-800";
      case "practice exam":
        return "bg-red-100 text-red-800";
      case "link":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <Badge className={getTypeColor(resource.resource_type)}>
                {resource.resource_type}
              </Badge>
              {resource.course_code && (
                <Badge variant="outline" className="ml-2">
                  {resource.course_code}
                </Badge>
              )}
            </div>
            {isOwner && (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <CardTitle className="text-2xl mt-2">{resource.title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            Uploaded on {formattedDate}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">{resource.description}</p>

            {resource.professor && (
              <div>
                <span className="font-medium">Professor:</span>{" "}
                {resource.professor}
              </div>
            )}

            {resource.external_link && (
              <div className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                <a
                  href={resource.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {resource.external_link}
                </a>
              </div>
            )}

            {error && (
              <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>

          {/* PDF Viewer */}
          {showPdfViewer &&
            resource.file_url &&
            resource.file_url.toLowerCase().endsWith(".pdf") && (
              <div
                className="mt-4 border rounded-md overflow-hidden bg-background"
                style={{ height: "600px", position: "relative" }}
              >
                <iframe
                  src={`${resource.file_url}#toolbar=0&navpanes=0`}
                  width="100%"
                  height="100%"
                  style={{
                    border: "none",
                    position: "relative",
                    zIndex: 1,
                    backgroundColor: "hsl(var(--background))",
                  }}
                  title={`PDF viewer for ${resource.title}`}
                  onLoad={(e) => {
                    // Force theme background on the iframe and its contents
                    const iframe = e.currentTarget;
                    try {
                      // Try to access the iframe content document if same-origin
                      if (iframe.contentDocument) {
                        const iframeDoc = iframe.contentDocument;
                        const existingStyle =
                          iframeDoc.getElementById("pdf-iframe-styles");
                        if (existingStyle) {
                          iframeDoc.head.removeChild(existingStyle);
                        }

                        const style = iframeDoc.createElement("style");
                        style.id = "pdf-iframe-styles";
                        style.textContent = `
                          body, .pdfViewer, .page, .canvasWrapper, canvas {
                            background-color: hsl(var(--background)) !important;
                          }
                        `;
                        iframeDoc.head.appendChild(style);
                      }
                    } catch (err) {
                      console.log(
                        "Cannot access iframe content - cross-origin restriction",
                      );
                    }
                  }}
                />
              </div>
            )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex items-center text-sm text-gray-500">
            <div className="flex items-center mr-3">
              <Download className="h-4 w-4 mr-1" />
              <span>
                {formatNumber(
                  resource.downloads || resource.download_count || 0,
                )}
              </span>
            </div>
            <div className="flex items-center mr-3">
              <ThumbsUp className="h-4 w-4 mr-1" />
              <span>{formatNumber(likeCount)}</span>
            </div>
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              <span>{formatNumber(commentCount)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={hasLiked ? "default" : "outline"}
              onClick={handleLike}
              disabled={isLoading || hasLiked}
              className={hasLiked ? "bg-primary hover:bg-primary/90" : ""}
            >
              <ThumbsUp
                className={`h-4 w-4 mr-2 ${hasLiked ? "fill-white" : ""}`}
              />
              {hasLiked ? "Liked" : "Like"}
            </Button>
            <div className="flex gap-2">
              {resource.file_url &&
                resource.file_url.toLowerCase().endsWith(".pdf") && (
                  <Button variant="outline" onClick={handleViewPdf}>
                    <Eye className="h-4 w-4 mr-2" />
                    {showPdfViewer ? "Hide PDF" : "View PDF"}
                  </Button>
                )}
              <Button onClick={handleDownload} disabled={isLoading}>
                {resource.external_link ? (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Link
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Comments Section */}
      <Card className="w-full mt-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Comments ({commentCount})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchComments}
              disabled={isRefreshingComments}
              className="h-8 w-8 p-0"
              title="Refresh comments"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshingComments ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Comment Input */}
          <div className="mb-6">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="resize-none mb-2"
              rows={3}
            />
            {commentError && (
              <p className="text-red-500 text-sm mb-2">{commentError}</p>
            )}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={isSubmittingComment || !newComment.trim()}
                size="sm"
              >
                {isSubmittingComment ? "Posting..." : "Post Comment"}
                <Send className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Comments List */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={comment.user_profiles?.avatar_url || undefined}
                    />
                    <AvatarFallback>
                      {(
                        comment.user_profiles?.full_name ||
                        comment.user_profiles?.username ||
                        "User"
                      )
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {comment.user_profiles?.full_name ||
                            comment.user_profiles?.username ||
                            "User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCommentDate(comment.created_at)}
                        </p>
                      </div>
                      {comment.user_id === resource.author_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="mt-1 text-sm">{comment.comment}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          <ResourceEditForm resource={resource} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete this resource? This action cannot
              be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="hover:bg-red-600 dark:hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
