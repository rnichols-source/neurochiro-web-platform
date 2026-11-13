'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleShoppingItem } from '@/lib/community/library-actions'
import { FormError } from '@/components/community/ui'

type Item = { key: string; label: string }
type Category = { key: string; title: string; items: Item[] }

export function ShoppingList({ categories, checked }: { categories: Category[]; checked: string[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const done = new Set(checked)

  return (
    <div className="space-y-4">
      <FormError message={error} />
      {categories.map((category) => (
        <section key={category.key}>
          <h2 className="font-heading text-[16px] font-bold text-neuro-navy">{category.title}</h2>
          <ul className="mt-2 space-y-2">
            {category.items.map((item) => (
              <li key={item.key}>
                <label className="flex items-start gap-2 text-[13.5px] leading-snug text-[#16202a]">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={done.has(item.key)}
                    disabled={pending}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setError(null)
                      start(async () => {
                        const result = await toggleShoppingItem(item.key, checked)
                        if (!result.ok) setError(result.error)
                        else router.refresh()
                      })
                    }}
                  />
                  <span>{item.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
