"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@frontend/components/ui/button";
import { Textarea } from "@frontend/components/ui/textarea";
import { createComment } from "@backend/features/comments/actions";

interface CommentFormProps {
  requestId: number;
}

// Renders the request comment composer and submits new comments.
export function CommentForm({ requestId }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setLoading(true);
    const result = await createComment(requestId, trimmed);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setContent("");
    toast.success("Comment added.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        placeholder="Write a comment…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px] text-sm resize-none"
        onKeyDown={(e) => {
          // Cmd/Ctrl+Enter submits
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
          }
        }}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          <kbd className="px-1 py-0.5 text-[10px] bg-muted rounded border border-border">⌘ Enter</kbd> to submit
        </p>
        <Button
          type="submit"
          size="sm"
          className="gap-1.5 h-8"
          disabled={loading || !content.trim()}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          Comment
        </Button>
      </div>
    </form>
  );
}
