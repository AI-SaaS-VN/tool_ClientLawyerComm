import { ApiError } from "@/lib/api-error";

// REQ-CASE-01: title is required, 1-80 characters, no line breaks. The same
// rule is enforced by the cases_title_check constraint in the T03 migration.
export function assertValidTitle(title: unknown): asserts title is string {
  if (typeof title !== "string") throw new ApiError(400, "invalid_title");
  const length = [...title].length;
  if (length < 1 || length > 80 || /[\r\n]/.test(title)) {
    throw new ApiError(400, "invalid_title");
  }
}
