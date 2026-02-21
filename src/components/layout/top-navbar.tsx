"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Search, User, Clock, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function TopNavbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [currentTask, setCurrentTask] = React.useState({
    title: "Write documentation",
    elapsed: "1h 23m",
    active: true,
  });

  // Global search shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
      // Settings shortcut
      if (e.key === "," && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        router.push("/settings");
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <nav className="flex h-9 items-center justify-between border-b bg-card px-3 shadow-sm">
        {/* Left: Current Task */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            className="h-6 gap-1.5 px-2"
            onClick={() => {
              // Jump to current task
            }}
          >
            {currentTask.active && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            )}
            <Clock className="h-3 w-3" />
            <span className="max-w-[150px] truncate text-[11px] font-medium">
              {currentTask.title}
            </span>
            <Badge size="sm" variant="secondary" className="ml-1">
              {currentTask.elapsed}
            </Badge>
          </Button>
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-md mx-4">
          <Button
            variant="outline"
            size="xs"
            className="h-6 w-full justify-start gap-2 px-2 text-[11px] text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-3 w-3" />
            <span>Search tasks, events...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground opacity-100">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Right: Avatar & Settings */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="h-6 w-6 rounded-full">
                <User className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-medium">John Doe</p>
                  <p className="text-[10px] text-muted-foreground">
                    john@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs" onClick={() => router.push("/settings")}>
                Settings
                <kbd className="ml-auto text-[10px] text-muted-foreground">
                  ⌘,
                </kbd>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs">
                Keyboard Shortcuts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <Moon className="mr-2 h-3 w-3" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem 
                    className="text-xs" 
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="mr-2 h-3 w-3" />
                    Light
                    {theme === "light" && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-xs" 
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="mr-2 h-3 w-3" />
                    Dark
                    {theme === "dark" && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-xs" 
                    onClick={() => setTheme("system")}
                  >
                    <Monitor className="mr-2 h-3 w-3" />
                    System
                    {theme === "system" && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Global Search Command Palette */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search tasks, events, conversations..." className="text-xs" />
        <CommandList>
          <CommandEmpty className="text-xs py-6 text-center text-muted-foreground">
            No results found.
          </CommandEmpty>
          <CommandGroup heading="Tasks" className="text-xs">
            <CommandItem className="text-xs">
              <span>Review pull request</span>
            </CommandItem>
            <CommandItem className="text-xs">
              <span>Write documentation</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Events" className="text-xs">
            <CommandItem className="text-xs">
              <span>Team standup - Today 9:00 AM</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
