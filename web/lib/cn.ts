type ClassValue = string | false | null | undefined;

/** Joins conditional class names. Later values do not override earlier ones —
 *  keep base classes and overrides in the order Tailwind should see them. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
