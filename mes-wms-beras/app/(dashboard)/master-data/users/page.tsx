"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ErrorState from "@/components/shared/ErrorState";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Admin", OPR_PROD: "Production", OPR_WHS: "Warehouse", DRIVER: "Driver",
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/master-data/users");
      const json = await res.json();
      if (json.success) setUsers(json.data);
      else setError(json.error);
    } catch { setError("Failed to fetch users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  if (error && !loading) return <ErrorState message={error} onRetry={fetchUsers} />;

  const columns = [
    { header: "Name", accessorKey: "name" as keyof User },
    { header: "Email", accessorKey: "email" as keyof User },
    { header: "Role", cell: (row: User) => (
      <span className="text-xs font-medium text-slate-300">{roleLabels[row.role] || row.role}</span>
    )},
    { header: "Status", cell: (row: User) => <StatusBadge status={row.status} type="user" /> },
    { header: "Created", cell: (row: User) => (
      <span className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</span>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage system users and their roles"
        actions={
          <button
            onClick={() => router.push("/master-data/users/create")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        }
      />
      <DataTable columns={columns} data={users} isLoading={loading} onRowClick={(row) => router.push(`/master-data/users/${row.id}`)} emptyMessage="No users found" />
    </div>
  );
}
