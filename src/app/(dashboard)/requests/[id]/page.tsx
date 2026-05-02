import { auth } from "@backend/auth/config";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Building2, User, Tag, Clock } from "lucide-react";
import { cn } from "@shared/utils";
import { buttonVariants } from "@frontend/components/ui/button";
import { Separator } from "@frontend/components/ui/separator";
import { ActivityTimeline } from "@frontend/features/activities/components/activity-timeline";
import { CommentForm } from "@frontend/features/comments/components/comment-form";
import { CommentThread } from "@frontend/features/comments/components/comment-thread";
import { PriorityBadge, StatusBadge } from "@frontend/features/requests/components/status-badge";
import { RequestEditForm } from "@frontend/features/requests/components/request-edit-form";
import { REQUEST_TYPE_LABELS } from "@shared/constants/requests";
import { getActivitiesForRequest } from "@backend/features/activities/queries";
import { getCommentsForRequest } from "@backend/features/comments/queries";
import { getRequestById } from "@backend/features/requests/queries";
import { formatDate } from "@shared/utils";

// Renders a request detail view with comments, edit form, and activity timeline.
export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const { edit } = await searchParams;
  const requestId = parseInt(id);
  if (isNaN(requestId)) notFound();

  const [request, activities, comments] = await Promise.all([
    getRequestById(requestId),
    getActivitiesForRequest(requestId),
    getCommentsForRequest(requestId),
  ]);

  if (!request) notFound();

  const isAdmin = session.user.role === "admin";
  const isOwner = String(request.requestedById) === session.user.id;
  const canEdit = isAdmin || isOwner;
  const isEditMode = edit === "true" && canEdit;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/requests"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0 mt-0.5")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {request.requestCode}
            </span>
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
          <h1 className="text-xl font-bold text-foreground leading-snug">{request.title}</h1>
        </div>
        {canEdit && !isEditMode && (
          <Link
            href={`/requests/${id}?edit=true`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 mt-0.5")}
          >
            Edit
          </Link>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        {/* Left — details or edit form */}
        <div className="space-y-4">
          {isEditMode ? (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Edit Request</h2>
              <RequestEditForm
                requestId={requestId}
                defaultValues={{
                  title: request.title,
                  description: request.description,
                  requestType: request.requestType,
                  department: request.department,
                  dateRequested: request.dateRequested,
                  priority: request.priority,
                  status: request.status,
                }}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              {/* Description */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Description
                </p>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {request.description}
                </p>
              </div>

              <Separator />

              {/* Meta grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Tag className="w-3 h-3" />
                    Type
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {REQUEST_TYPE_LABELS[request.requestType]}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="w-3 h-3" />
                    Department
                  </div>
                  <p className="text-sm font-medium text-foreground">{request.department}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    Requested by
                  </div>
                  <p className="text-sm font-medium text-foreground">{request.requestedBy.name}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="w-3 h-3" />
                    Date requested
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(request.dateRequested)}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Created
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(request.createdAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Updated
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(request.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Comments
              {comments.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {comments.length}
                </span>
              )}
            </h2>
            <CommentThread
              comments={comments}
              currentUserId={session.user.id}
              currentUserRole={session.user.role}
            />
            <Separator />
            <CommentForm requestId={requestId} />
          </div>
        </div>

        {/* Right — activity timeline */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 h-fit">
          <h2 className="text-sm font-semibold text-foreground">Activity</h2>
          <ActivityTimeline activities={activities} />
        </div>
      </div>
    </div>
  );
}
