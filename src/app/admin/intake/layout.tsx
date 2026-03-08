import { AdminLayout } from '@/components/layout/admin-layout'

export default function AdminIntakeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
