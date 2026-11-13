export function Avatar({
  name,
  hue,
  size = 44,
}: {
  name: string
  hue: number
  size?: number
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(180deg, hsl(${hue} 50% 42%), hsl(${hue} 50% 30%))`,
      }}
    >
      {initials}
    </div>
  )
}
