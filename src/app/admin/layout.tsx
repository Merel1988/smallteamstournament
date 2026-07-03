import AdminNav from "@/components/AdminNav";
import { isAdmin } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdmin();
  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-6">
      {authed && <AdminNav />}
      {children}
    </div>
  );
}
