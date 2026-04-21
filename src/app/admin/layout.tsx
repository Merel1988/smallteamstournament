import AdminNav from "@/components/AdminNav";
import { isAdmin } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdmin();
  return (
    <div>
      {authed && <AdminNav />}
      {children}
    </div>
  );
}
