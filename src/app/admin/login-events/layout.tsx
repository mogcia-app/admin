import { AdminLayout } from '@/components/layout/admin-layout'

export default function LoginEventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
