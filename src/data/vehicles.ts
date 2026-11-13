import type { Vehicle } from '../types'

export const VEHICLES: Vehicle[] = [
  {
    id: 'kabluk',
    name: 'Каблук',
    hint: 'Ларгус, берлинго',
    capacity: 'до 700 кг, 3 м³',
    emoji: '🚐',
    baseFare: 2500,
    perKm: 200,
    minFare: 3000,
  },
  {
    id: 'gazelle',
    name: 'Газель',
    hint: 'Самый ходовой кузов',
    capacity: 'до 1,5 т, 9 м³',
    emoji: '🚚',
    baseFare: 4000,
    perKm: 280,
    minFare: 5000,
  },
  {
    id: 't3',
    name: '3 тонны',
    hint: 'Переезд, стройка',
    capacity: 'до 3 т, 16 м³',
    emoji: '🚛',
    baseFare: 6000,
    perKm: 350,
    minFare: 7500,
  },
  {
    id: 't5',
    name: '5 тонн',
    hint: 'Паллеты и павильоны',
    capacity: 'до 5 т, 25 м³',
    emoji: '🚛',
    baseFare: 8500,
    perKm: 420,
    minFare: 10000,
  },
  {
    id: 't10',
    name: '10 тонн',
    hint: 'Крупные партии',
    capacity: 'до 10 т, 40 м³',
    emoji: '🚚',
    baseFare: 12000,
    perKm: 500,
    minFare: 15000,
  },
  {
    id: 'truck',
    name: 'Фура',
    hint: 'Межгород и фуры 20 т',
    capacity: 'до 20 т, 82 м³',
    emoji: '🚜',
    baseFare: 20000,
    perKm: 700,
    minFare: 25000,
  },
  {
    id: 'evac',
    name: 'Эвакуатор',
    hint: 'Легковые и внедорожники',
    capacity: 'до 3,5 т',
    emoji: '🛠️',
    baseFare: 8000,
    perKm: 450,
    minFare: 10000,
  },
]

export function vehicleById(id: Vehicle['id']): Vehicle {
  return VEHICLES.find((v) => v.id === id) ?? VEHICLES[1]
}
