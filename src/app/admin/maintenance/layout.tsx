import { AdminLayout } from '@/components/layout/admin-layout'

export default function AdminMaintenanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
