type SupabaseLikeError = {
  code?: string | null;
  message: string;
} | null | undefined;

export function getSupabaseErrorMessage(
  error: SupabaseLikeError,
  options?: { uniqueViolationMessage?: string }
): string | null {
  if (!error) return null;

  if (options?.uniqueViolationMessage && error.code === "23505") {
    return options.uniqueViolationMessage;
  }

  return error.message;
}


