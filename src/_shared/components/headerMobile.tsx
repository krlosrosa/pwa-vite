// components/HeaderMobile.tsx
import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/_shared/components/ui/button'
import { cn } from '@/_shared/lib/utils'

interface HeaderMobileProps {
  title?: string
  showBackButton?: boolean
  backButtonAction?: () => void
  className?: string
  children?: React.ReactNode
}

export function HeaderMobile({
  title,
  showBackButton = true,
  backButtonAction,
  className,
  children
}: HeaderMobileProps) {
  const navigate = useNavigate()
  const router = useRouter()

  const handleBack = () => {
    if (backButtonAction) {
      backButtonAction()
    } else {
      // Volta para a página anterior ou para a rota pai
      if (window.history.length > 1) {
        router.history.back()
      } else {
        navigate({ to: '/' }) // ou para sua rota padrão
      }
    }
  }

  return (
    <header
      className={cn(
        'flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50 md:hidden',
        className
      )}
    >
      {/* Botão Voltar */}
      <div className="flex items-center flex-1">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="mr-2"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Título */}
      <div className="flex-1 flex justify-center">
        {title && (
          <h1 className="text-lg font-semibold truncate max-w-[200px]">
            {title}
          </h1>
        )}
      </div>

      {/* Conteúdo adicional */}
      <div className="flex items-center justify-end flex-1">
        {children}
      </div>
    </header>
  )
}