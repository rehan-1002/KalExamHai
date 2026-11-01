export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  const envAdmin = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  return (
    lower === "rehxnnn0@gmail.com" ||
    lower === "rehan.251316.co@mhssce.ac.in" ||
    (Boolean(envAdmin) && lower === envAdmin)
  );
}

