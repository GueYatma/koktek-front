import { useNavigate } from 'react-router-dom'
import { Undo2 } from 'lucide-react'

interface BackButtonProps {
  fallback: string
  className?: string
  label?: string
}

export default function BackButton({ fallback, className = '', label }: BackButtonProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    // Vérifier si un historique React Router existe (idx > 0 indique une navigation interne)
    // S'il n'y a pas d'historique (entrée directe URL), on utilise le fallback
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate(fallback)
    }
  }

  return (
    <button
      onClick={handleBack}
      className={`group flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3.5 py-2 text-gray-700 shadow-sm backdrop-blur transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 motion-safe:hover:-translate-x-1.5 motion-safe:hover:scale-[1.02] motion-safe:hover:bg-white motion-safe:hover:text-gray-900 motion-safe:hover:shadow-md active:scale-95 ${className}`}
      aria-label={label || 'Retour'}
    >
      <Undo2 className="h-[20px] w-[20px] transition-transform duration-300 group-hover:-rotate-12" />
      {label && <span className="text-sm font-semibold">{label}</span>}
    </button>
  )
}
