import { AdminLayout } from '@/components/layout/admin-layout'

export default function PromptsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
