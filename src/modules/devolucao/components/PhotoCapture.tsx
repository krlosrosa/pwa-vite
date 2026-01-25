import { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { Label } from '@/_shared/components/ui/label';
import { Button } from '@/_shared/components/ui/button';
import { convertFileToBase64 } from '@/_shared/lib/convertBase64';

/**
 * Component for capturing and displaying photos
 * Supports file upload with Base64 conversion and image preview
 */
export function PhotoCapture({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (photo: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const base64 = await convertFileToBase64(file);
      onChange(base64);
    } catch (error) {
      console.error('Erro ao converter arquivo:', error);
      alert('Erro ao processar a imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Camera className="h-4 w-4" />
        {label}
      </Label>
      {value ? (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden border-2 border-border">
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <div
            onClick={handleClick}
            className="relative aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <div className="text-center space-y-2">
              {isUploading ? (
                <>
                  <div className="h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Processando...</p>
                </>
              ) : (
                <>
                  <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Toque para capturar foto</p>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
