"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RequestForm } from "@frontend/features/requests/components/request-form";
import { updateRequest } from "@backend/features/requests/actions";
import type { UpdateRequestInput } from "@shared/validation/request";

interface RequestEditFormProps {
  requestId: number;
  defaultValues: UpdateRequestInput;
}

// Connects the shared request form to the update server action.
export function RequestEditForm({ requestId, defaultValues }: RequestEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: UpdateRequestInput) => {
    setLoading(true);
    const result = await updateRequest(requestId, data);
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Request updated successfully");
    router.push(`/requests/${requestId}`);
    router.refresh();
  };

  return (
    <RequestForm
      mode="edit"
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
}
