/**
 * Re-export shim — all auth actions have moved to @/lib/actions/auth.
 * This file is kept to avoid breaking imports in existing pages.
 */
export { registerUser, loginUser, logoutUser, forgotPassword, resetPassword } from "@/lib/actions/auth";
