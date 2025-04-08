
import React from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export const ModeToggle = () => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme}>
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
