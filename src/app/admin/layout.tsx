import AdminNav from "@/components/AdminNav";
import { getRole } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getRole();
  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-6">
      {role && (
        <div className="print:hidden">
          <AdminNav scorerOnly={role === "scorer"} />
        </div>
      )}
      {children}
    </div>
  );
}
