"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function AjustesPage() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.classList.remove('dark', 'dark-barbie', 'dark-captain-america');
    document.body.classList.add(savedTheme);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.classList.remove('dark', 'dark-barbie', 'dark-captain-america');
    document.body.classList.add(newTheme);
  };

  return (
    <div className="w-full">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-primary">Ajustes</h1>
        <p className="text-muted-foreground mt-2 text-lg">Personaliza la apariencia de la aplicación.</p>
      </header>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Selección de Tema</CardTitle>
            <CardDescription>Elige tu tema preferido. El cambio se aplicará al instante.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={theme} onValueChange={handleThemeChange} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark">Oscuro (Predeterminado)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark-barbie" id="barbie" />
                <Label htmlFor="barbie">Barbie Dark Theme</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark-captain-america" id="captain-america" />
                <Label htmlFor="captain-america">Captain America Theme</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
