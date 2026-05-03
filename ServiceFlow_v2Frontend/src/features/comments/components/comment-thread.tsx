"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Pencil, Shield, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteComment, updateComment } from "@backend/features/comments/actions";
import { Avatar, AvatarFallback } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Textarea } from "@frontend/components/ui/textarea";
import type { CommentWithAuthor } from "@shared/types";
import { cn } from "@shared/utils";

interface CommentItemProps {
  comment: CommentWithAuthor;
  currentUserId: string;
  currentUserRole: string;
}

function CommentItem({ comment, currentUserId, currentUserRole }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const initials = comment.author.name
    .split(" ")
    .map((segment) => segment[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const canEdit = String(comment.authorId) === currentUserId;
  const canDelete = currentUserRole === "admin" || currentUserRole === "superadmin";
  const isElevated = comment.author.role === "admin" || comment.author.role === "superadmin";
  const roleLabel = comment.author.role === "superadmin" ? "Superadmin" : "Admin";

  const handleSave = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    const result = await updateComment(comment.id, editContent.trim());
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setEditing(false);
    toast.success("Comment updated.");
  };

  const handleDelete = async () => {
    const result = await deleteComment(comment.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Comment deleted.");
  };

  return (
    <div className="flex gap-3 group">
      <Avatar className="w-7 h-7 shrink-0 mt-0.5">
        <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">{comment.author.name}</span>
          {isElevated && (
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" />
              {roleLabel}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              className="min-h-[72px] text-sm resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 px-3 text-xs gap-1"
                onClick={handleSave}
                disabled={saving || !editContent.trim()}
              >
                <Check className="w-3 h-3" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-3 text-xs gap-1"
                onClick={() => {
                  setEditing(false);
                  setEditContent(comment.content);
                }}
              >
                <X className="w-3 h-3" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>
            {(canEdit || canDelete) && (
              <div className={cn("flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity")}>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 text-muted-foreground hover:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentThreadProps {
  comments: CommentWithAuthor[];
  currentUserId: string;
  currentUserRole: string;
}

// Renders the request comment list or an empty conversation state.
export function CommentThread({ comments, currentUserId, currentUserRole }: CommentThreadProps) {
  if (comments.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      ))}
    </div>
  );
}
