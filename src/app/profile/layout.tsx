import { AdminLayout } from '@/components/layout/admin-layout'

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
