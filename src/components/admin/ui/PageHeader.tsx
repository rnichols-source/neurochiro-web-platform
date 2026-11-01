import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-bold text-neuro-navy">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-neuro-gray">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
