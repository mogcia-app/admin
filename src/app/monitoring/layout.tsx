import { AdminLayout } from '@/components/layout/admin-layout'

export default function MonitoringLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
