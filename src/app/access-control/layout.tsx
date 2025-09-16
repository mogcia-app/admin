import { AdminLayout } from '@/components/layout/admin-layout'

export default function AccessControlLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
