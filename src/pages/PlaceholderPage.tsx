import { Construction } from 'lucide-react'
import { EmptyState, Button } from '../components/ui'

interface PlaceholderPageProps {
  title: string
  description: string
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="cy-table-card">
      <EmptyState
        icon={<Construction size={24} strokeWidth={1.75} />}
        title={title}
        description={`${description} This module is ready to connect to the Carryoo API.`}
        action={
          <Button variant="secondary" disabled>
            Coming soon
          </Button>
        }
      />
    </div>
  )
}
