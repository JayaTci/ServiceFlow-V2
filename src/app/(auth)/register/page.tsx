import { redirect } from "next/navigation";

/**
 * Public registration is disabled — accounts are created by admins only.
 * Redirect any direct visits to the login page.
 */
export default function RegisterPage() {
  redirect("/login");
}
