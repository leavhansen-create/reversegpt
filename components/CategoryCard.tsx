interface CategoryCardProps {
  name: string
  description: string
  icon: string
  onClick: () => void
}

export default function CategoryCard({ name, description, icon, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-start p-6 bg-zinc-900 border border-zinc-800 rounded-lg text-left transition-all duration-200 hover:border-red-900/70 focus:outline-none focus:border-red-800 active:scale-[0.97]"
    >
      <div className="absolute inset-0 bg-red-950/0 group-hover:bg-red-950/[0.07] rounded-lg transition-colors duration-200 pointer-events-none" />

      <span className="relative text-xl mb-4 text-zinc-600 group-hover:text-red-600 transition-colors duration-200 font-mono leading-none select-none">
        {icon}
      </span>

      <h3 className="relative text-xs font-semibold text-zinc-300 mb-2 tracking-widest uppercase group-hover:text-zinc-100 transition-colors duration-200">
        {name}
      </h3>

      <p className="relative text-xs text-zinc-600 leading-relaxed group-hover:text-zinc-500 transition-colors duration-200">
        {description}
      </p>
    </button>
  )
}
