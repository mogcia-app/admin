import { AdminLayout } from '@/components/layout/admin-layout'

export default function UiEventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
