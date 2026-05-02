"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@shared/utils";
import { buttonVariants } from "@frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@frontend/components/ui/card";
import { RequestForm } from "@frontend/features/requests/components/request-form";
import { createRequest } from "@backend/features/requests/actions";
import type { CreateRequestInput } from "@shared/validation/request";

// Renders the create request page and handles submission feedback.
export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateRequestInput) => {
    setLoading(true);
    const result = await createRequest(data);
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Request ${result.data?.requestCode} created successfully`);
    router.push("/requests");
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/requests" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Request</h1>
          <p className="text-sm text-muted-foreground">Submit a new service request</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestForm mode="create" onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
