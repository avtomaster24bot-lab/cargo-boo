/** Тарифы абонемента водителя. Меняйте цены и сроки только здесь. */
export const TRIAL_DAYS = 7
export const EXPIRY_REMINDER_DAYS = 2

export type PlanId = 'day' | 'week' | 'month'

export interface Plan {
  id: PlanId
  name: string
  days: number
  price: number
  hint: string
  bestValue?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'day',
    name: 'День',
    days: 1,
    price: 1000,
    hint: 'На одну смену или пиковый день',
  },
  {
    id: 'week',
    name: 'Неделя',
    days: 7,
    price: 5000,
    hint: '≈ 714 ₸/день, выгоднее дня',
  },
  {
    id: 'month',
    name: 'Месяц',
    days: 30,
    price: 15000,
    hint: '500 ₸/день — самый выгодный',
    bestValue: true,
  },
]

export function planById(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[2]
}
