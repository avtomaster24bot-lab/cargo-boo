import type { Driver } from '../types'

export const DRIVERS: Driver[] = [
  {
    id: 'drv-arman',
    name: 'Арман Сериков',
    phone: '+7 707 111 22 01',
    vehicleId: 'gazelle',
    plate: '701 AZA 02',
    rating: 4.94,
    trips: 512,
    hue: 168,
    lat: 43.249,
    lng: 76.9,
  },
  {
    id: 'drv-daniyar',
    name: 'Данияр Нурланов',
    phone: '+7 707 111 22 02',
    vehicleId: 't3',
    plate: '445 BNK 02',
    rating: 4.87,
    trips: 338,
    hue: 28,
    lat: 43.23,
    lng: 76.87,
  },
  {
    id: 'drv-erlan',
    name: 'Ерлан Касымов',
    phone: '+7 707 111 22 03',
    vehicleId: 'kabluk',
    plate: '118 CMK 02',
    rating: 4.91,
    trips: 740,
    hue: 210,
    lat: 43.255,
    lng: 76.92,
  },
  {
    id: 'drv-azat',
    name: 'Азат Беков',
    phone: '+7 707 111 22 04',
    vehicleId: 't5',
    plate: '902 DTX 02',
    rating: 4.82,
    trips: 219,
    hue: 12,
    lat: 43.22,
    lng: 76.91,
  },
  {
    id: 'drv-nursultan',
    name: 'Нурсултан Иманов',
    phone: '+7 707 111 22 05',
    vehicleId: 'truck',
    plate: '017 FRR 02',
    rating: 4.88,
    trips: 164,
    hue: 265,
    lat: 43.27,
    lng: 76.88,
  },
  {
    id: 'drv-marat',
    name: 'Марат Жунусов',
    phone: '+7 707 111 22 06',
    vehicleId: 'evac',
    plate: '333 EVA 02',
    rating: 4.96,
    trips: 421,
    hue: 45,
    lat: 43.242,
    lng: 76.86,
  },
  {
    id: 'drv-bakhyt',
    name: 'Бахыт Оспанов',
    phone: '+7 707 111 22 07',
    vehicleId: 't10',
    plate: '560 KZH 02',
    rating: 4.79,
    trips: 188,
    hue: 195,
    lat: 43.215,
    lng: 76.94,
  },
  {
    id: 'drv-alisher',
    name: 'Алишер Тулегенов',
    phone: '+7 707 111 22 08',
    vehicleId: 'gazelle',
    plate: '208 GLM 02',
    rating: 4.93,
    trips: 605,
    hue: 142,
    lat: 43.26,
    lng: 76.95,
  },
]

export function driverById(id: string): Driver | undefined {
  return DRIVERS.find((d) => d.id === id)
}

export function driversForVehicle(vehicleId: Driver['vehicleId']): Driver[] {
  const exact = DRIVERS.filter((d) => d.vehicleId === vehicleId)
  if (exact.length >= 2) return exact
  return [...exact, ...DRIVERS.filter((d) => d.vehicleId !== vehicleId)].slice(0, 3)
}
