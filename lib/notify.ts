// Fires a non-blocking notification email to alsiiec048@gmail.com
// on every successful registration submission

type RegType = "candidate" | "voter" | "party";

export async function notifyRegistration(
  type: RegType,
  data: Record<string, string>
): Promise<void> {
  try {
    await fetch("/api/notify-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data }),
    });
  } catch {
    // Non-blocking — registration already saved to DB
    console.warn("Registration notification failed silently.");
  }
}