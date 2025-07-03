"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  Download,
  Scissors,
  Maximize,
  Bot,
  Loader2,
  Image as ImageIcon,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { aiBackgroundRemoval } from '@/ai/flows/ai-background-removal';
import { aiUpscale } from '@/ai/flows/ai-upscaling';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Scale = '2x' | '4x';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [operation, setOperation] = useState<string | null>(null);
  const [scale, setScale] = useState<Scale>('2x');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit for Gemini
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 4MB.",
          variant: "destructive",
        });
        return;
      }
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

  const handleBackgroundRemoval = async () => {
    if (!originalImage) return;
    setIsLoading(true);
    setOperation('bg-removal');
    setProcessedImage(null);
    try {
      const result = await aiBackgroundRemoval({ photoDataUri: originalImage });
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
    if (!originalImage) return;
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
  
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-primary">Remove Background Pro</h1>
          <p className="text-muted-foreground mt-2 text-lg">Your one-stop solution for image editing with AI.</p>
        </header>

        <Alert className="mb-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>¡Atención!</AlertTitle>
          <AlertDescription>
            Para utilizar las funciones de IA, necesitas una clave de API de Google AI. 
            Consigue tu clave en <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">Google AI Studio</a>, 
            añádela a tu archivo <code>.env</code> como <code>GOOGLE_API_KEY=TU_CLAVE_AQUI</code> y reinicia el servidor.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Card className="shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UploadCloud className="h-6 w-6 text-accent" /> Upload Image</CardTitle>
                <CardDescription>Start by uploading an image from your device.</CardDescription>
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
                  Choose a file
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">Max file size: 4MB</p>
              </CardContent>
            </Card>
            
            <Card className={`shadow-lg rounded-xl transition-opacity duration-300 ${!originalImage ? 'opacity-50 pointer-events-none' : ''}`}>
              <CardHeader>
                <CardTitle>Editing Tools</CardTitle>
                <CardDescription>Select a tool to process your image.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Background Removal</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <Button onClick={handleBackgroundRemoval} disabled={isLoading || !originalImage}>
                      <Bot className="mr-2 h-4 w-4" /> Remove with Google AI
                    </Button>
                    <Button onClick={showPlaceholderToast} disabled={isLoading || !originalImage} variant="secondary">
                      <Scissors className="mr-2 h-4 w-4" /> Remove with Rembg
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-medium">Image Upscaling</Label>
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
                    <div className="grid grid-cols-1 gap-2">
                      <Button onClick={handleUpscale} disabled={isLoading || !originalImage}>
                        <Bot className="mr-2 h-4 w-4" /> Upscale with Google AI
                      </Button>
                      <Button onClick={showPlaceholderToast} disabled={isLoading || !originalImage} variant="secondary">
                        <Maximize className="mr-2 h-4 w-4" /> Upscale with FFmpeg
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
                <CardTitle>Original Image</CardTitle>
              </CardHeader>
              <CardContent className="aspect-square flex items-center justify-center bg-card-foreground/5 rounded-lg p-2">
                {originalImage ? (
                  <Image src={originalImage} alt="Original" width={500} height={500} className="rounded-md object-contain max-h-[400px] max-w-full" />
                ) : (
                  <div className="text-center text-muted-foreground p-8 flex flex-col items-center justify-center">
                    <ImageIcon className="h-16 w-16 mb-4" />
                    <p className="font-semibold">Upload an image to get started</p>
                    <p className="text-sm">Your image will be displayed here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="shadow-lg rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Processed Image</CardTitle>
                {processedImage && !isLoading && (
                  <Button onClick={handleDownload} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                )}
              </CardHeader>
              <CardContent className="aspect-square flex items-center justify-center bg-card-foreground/5 rounded-lg p-2">
                {isLoading ? (
                  <div className="text-center text-primary p-8 flex flex-col items-center justify-center">
                    <Loader2 className="h-16 w-16 animate-spin" />
                    <p className="mt-4 font-semibold text-lg">Processing...</p>
                    <p className="text-sm text-muted-foreground">
                      {operation === 'bg-removal' ? 'Removing background...' : 'Upscaling image...'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">This may take a moment.</p>
                  </div>
                ) : processedImage ? (
                  <Image src={processedImage} alt="Processed" width={500} height={500} className="rounded-md object-contain max-h-[400px] max-w-full" />
                ) : (
                  <div className="text-center text-muted-foreground p-8 flex flex-col items-center justify-center">
                    <ImageIcon className="h-16 w-16 mb-4" />
                    <p className="font-semibold">Your masterpiece awaits</p>
                    <p className="text-sm">The processed image will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
