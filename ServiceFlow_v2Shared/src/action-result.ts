/** Shared success/error contract returned by server actions. */
export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string; error?: never }
  | { success: false; error: string; data?: never; message?: never };

/** Builds a typed successful server-action response. */
export function actionSuccess<T>(data?: T, message?: string): ActionResult<T> {
  return { success: true, ...(data === undefined ? {} : { data }), ...(message ? { message } : {}) };
}

/** Builds a typed failed server-action response. */
export function actionError<T = void>(error: string): ActionResult<T> {
  return { success: false, error };
}
