/**
 * Re-export shim. Auth actions live in the auth feature module.
 */
export {
  forgotPassword,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updateProfile,
} from "@backend/features/auth/actions";
