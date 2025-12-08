import { AdminLayout } from '@/components/layout/admin-layout'

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}

