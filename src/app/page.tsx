"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  Download,
  Scissors,
  Maximize,
  Bot,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  MoveDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { aiBackgroundRemoval } from '@/ai/flows/ai-background-removal';
import { aiUpscale } from '@/ai/flows/ai-upscaling';
import { aiCompression } from '@/ai/flows/ai-compression';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Scale = '2x' | '4x';
type BgRemovalIntensity = 'subtle' | 'standard' | 'aggressive';
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [operation, setOperation] = useState<string | null>(null);
  const [scale, setScale] = useState<Scale>('2x');
  const [bgRemovalIntensity, setBgRemovalIntensity] = useState<BgRemovalIntensity>('standard');
  const [isImageTooLarge, setIsImageTooLarge] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Show tutorial only on the client-side after mount and if no image is loaded.
    if (!originalImage) {
      const timer = setTimeout(() => setShowTutorial(true), 500);
      return () => clearTimeout(timer);
    }
  }, [originalImage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 40 * 1024 * 1024) { // 40MB limit for browser
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 40MB.",
          variant: "destructive",
        });
        return;
      }
      setShowTutorial(false); // Hide tutorial arrow
      setIsImageTooLarge(file.size > MAX_SIZE_BYTES); // Check against AI limit
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCompression = async () => {
    if (!originalImage) return;
    setIsLoading(true);
    setOperation('compress');
    setProcessedImage(null);
    try {
      const result = await aiCompression({ photoDataUri: originalImage, targetSizeMB: 4 });
      setOriginalImage(result.compressedPhotoDataUri);
      setIsImageTooLarge(false);
      toast({
        title: "Image Compressed",
        description: "Your image is now ready for editing.",
        action: <div className="p-1 rounded-full bg-green-500"><CheckCircle2 className="h-5 w-5 text-white" /></div>,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error compressing image",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOperation(null);
    }
  };

  const handleBackgroundRemoval = async () => {
    if (!originalImage || isImageTooLarge) return;
    setIsLoading(true);
    setOperation('bg-removal');
    setProcessedImage(null);
    try {
      const result = await aiBackgroundRemoval({ photoDataUri: originalImage, intensity: bgRemovalIntensity });
      setProcessedImage(result.processedPhotoDataUri);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error removing background",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOperation(null);
    }
  };
  
  const handleUpscale = async () => {
    if (!originalImage || isImageTooLarge) return;
    setIsLoading(true);
    setOperation('upscale');
    setProcessedImage(null);
    try {
      const result = await aiUpscale({ photoDataUri: originalImage, scale });
      setProcessedImage(result.upscaledPhotoDataUri);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error upscaling image",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOperation(null);
    }
  };

  const showPlaceholderToast = () => {
    toast({
      title: "Feature Not Available",
      description: "This feature requires a custom backend and is not included in this demo.",
    });
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `processed_${operation || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getLoadingMessage = () => {
    switch (operation) {
      case 'bg-removal':
        return 'Removing background...';
      case 'upscale':
        return 'Upscaling image...';
      case 'compress':
        return 'Compressing image...';
      default:
        return 'Processing...';
    }
  };
  
  return (
    <div className="w-full relative">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-primary">Edición de imagen</h1>
        <p className="text-muted-foreground mt-2 text-lg">Su solución integral para la edición de imágenes con IA.</p>
      </header>

      {showTutorial && (
        <div className="absolute top-48 left-1/4 z-10 animate-tutorial-arrow">
          <p className="text-lg font-bold text-primary -rotate-12 mb-2">¡Empieza aquí!</p>
          <MoveDown className="w-20 h-20 text-primary rotate-[135deg]" strokeWidth={3} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UploadCloud className="h-6 w-6 text-accent" /> Subir Imagen</CardTitle>
              <CardDescription>Comience cargando una imagen desde su dispositivo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
              />
              <Button onClick={handleUploadClick} className="w-full" size="lg" variant="outline">
                Elegir un archivo
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">Tamaño máximo de archivo: 4 MB</p>
            </CardContent>
          </Card>

          {isImageTooLarge && !isLoading && (
            <Alert variant="destructive" className="shadow-lg rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Imagen Demasiado Grande para la IA</AlertTitle>
              <AlertDescription className="mt-2">
                La IA solo puede procesar imágenes de hasta 4 MB. Por favor, comprima su imagen para continuar.
                <Button onClick={handleCompression} className="w-full mt-4" size="sm">
                  <Bot className="mr-2 h-4 w-4" /> Comprimir con IA
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <Card className={`shadow-lg rounded-xl transition-opacity duration-300 ${!originalImage ? 'opacity-50 pointer-events-none' : ''}`}>
            <CardHeader>
              <CardTitle>Herramientas de Edición</CardTitle>
              <CardDescription>Seleccione una herramienta para procesar su imagen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Eliminación de Fondo</Label>
                <div className="mt-2 space-y-4">
                  <div>
                    <Label className="text-sm font-normal text-muted-foreground">Intensidad</Label>
                    <RadioGroup value={bgRemovalIntensity} onValueChange={(value) => setBgRemovalIntensity(value as BgRemovalIntensity)} className="flex gap-4 pt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="subtle" id="subtle" />
                        <Label htmlFor="subtle" className="font-normal">Sutil</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="standard" id="standard" />
                        <Label htmlFor="standard" className="font-normal">Estándar</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="aggressive" id="aggressive" />
                        <Label htmlFor="aggressive" className="font-normal">Agresiva</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="grid grid-cols-1 gap-2 pt-4">
                    <Button onClick={handleBackgroundRemoval} disabled={isLoading || !originalImage || isImageTooLarge}>
                      <Bot className="mr-2 h-4 w-4" /> Eliminar con IA de Google
                    </Button>
                    <Button onClick={showPlaceholderToast} disabled={isLoading || !originalImage} variant="secondary">
                      <Scissors className="mr-2 h-4 w-4" /> Eliminar con Rembg
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">Ampliación de Imagen</Label>
                <div className="mt-2 space-y-4">
                  <RadioGroup value={scale} onValueChange={(value: string) => setScale(value as Scale)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2x" id="2x" />
                      <Label htmlFor="2x">2x</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="4x" id="4x" />
                      <Label htmlFor="4x">4x</Label>
                    </div>
                  </RadioGroup>
                  <div className="grid grid-cols-1 gap-2 pt-4">
                    <Button onClick={handleUpscale} disabled={isLoading || !originalImage || isImageTooLarge}>
                      <Bot className="mr-2 h-4 w-4" /> Ampliar con IA de Google
                    </Button>
                    <Button onClick={showPlaceholderToast} disabled={isLoading || !originalImage} variant="secondary">
                      <Maximize className="mr-2 h-4 w-4" /> Ampliar con FFmpeg
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Imagen Original</CardTitle>
            </CardHeader>
            <CardContent className="aspect-square flex items-center justify-center bg-card-foreground/5 rounded-lg p-2">
              {originalImage ? (
                <Image src={originalImage} alt="Original" width={500} height={500} className="rounded-md object-contain max-h-full max-w-full" />
              ) : (
                <div className="text-center text-muted-foreground p-8 flex flex-col items-center justify-center">
                  <ImageIcon className="h-16 w-16 mb-4" />
                  <p className="font-semibold">Suba una imagen para comenzar</p>
                  <p className="text-sm">Su imagen se mostrará aquí.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Imagen Procesada</CardTitle>
              {processedImage && !isLoading && (
                <Button onClick={handleDownload} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Download className="mr-2 h-4 w-4" /> Descargar
                </Button>
              )}
            </CardHeader>
            <CardContent className="aspect-square flex items-center justify-center bg-card-foreground/5 rounded-lg p-2">
              {isLoading ? (
                <div className="text-center text-primary p-8 flex flex-col items-center justify-center">
                  <Loader2 className="h-16 w-16 animate-spin" />
                  <p className="mt-4 font-semibold text-lg">Procesando...</p>
                  <p className="text-sm text-muted-foreground">
                    {getLoadingMessage()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Esto puede tomar un momento.</p>
                </div>
              ) : processedImage ? (
                <Image src={processedImage} alt="Processed" width={500} height={500} className="rounded-md object-contain max-h-full max-w-full" />
              ) : (
                <div className="text-center text-muted-foreground p-8 flex flex-col items-center justify-center">
                  <ImageIcon className="h-16 w-16 mb-4" />
                  <p className="font-semibold">Su obra maestra espera</p>
                  <p className="text-sm">La imagen procesada aparecerá aquí.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
