import { AdminLayout } from '@/components/layout/admin-layout'

export default function AIAssistantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
