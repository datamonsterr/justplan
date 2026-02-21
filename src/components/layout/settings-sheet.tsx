"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const settingsSections = [
  { id: "general", label: "General", icon: "🔧" },
  { id: "appearance", label: "Appearance", icon: "🎨" },
  { id: "account", label: "Account & Profile", icon: "👤" },
  { id: "workflow", label: "Workflow Configuration", icon: "🔄" },
  { id: "working-hours", label: "Working Hours", icon: "⏰" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "integrations", label: "Integrations", icon: "🔗" },
  { id: "shortcuts", label: "Keyboard Shortcuts", icon: "⌨️" },
  { id: "data", label: "Data & Privacy", icon: "📦" },
];

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const [activeSection, setActiveSection] = React.useState("appearance");
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] p-0 sm:max-w-[600px]">
        <div className="flex h-full">
          {/* Left Sidebar */}
          <div className="w-48 border-r bg-muted/30">
            <div className="p-3">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-6 pl-6 text-xs"
                />
              </div>
              <nav className="space-y-0.5">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1 text-xs text-left transition-colors",
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <span>{section.icon}</span>
                    <span className="truncate">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle className="text-base">
                {settingsSections.find((s) => s.id === activeSection)?.label}
              </SheetTitle>
              <SheetDescription className="text-xs">
                Configure your settings and preferences
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-80px)]">
              <div className="space-y-4 p-4">
                {activeSection === "appearance" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="theme" className="text-xs">
                        Theme
                      </Label>
                      <Select defaultValue="light">
                        <SelectTrigger id="theme" className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light" className="text-xs">
                            Light
                          </SelectItem>
                          <SelectItem value="dark" className="text-xs">
                            Dark
                          </SelectItem>
                          <SelectItem value="system" className="text-xs">
                            System
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="density" className="text-xs">
                        UI Density
                      </Label>
                      <Select defaultValue="compact">
                        <SelectTrigger id="density" className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact" className="text-xs">
                            Compact (More information)
                          </SelectItem>
                          <SelectItem value="comfortable" className="text-xs">
                            Comfortable (Balanced)
                          </SelectItem>
                          <SelectItem value="spacious" className="text-xs">
                            Spacious (More space)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">
                        Adjust the spacing and size of UI elements
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="font-size" className="text-xs">
                        Font Size
                      </Label>
                      <Select defaultValue="small">
                        <SelectTrigger id="font-size" className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small" className="text-xs">
                            Small (13px)
                          </SelectItem>
                          <SelectItem value="medium" className="text-xs">
                            Medium (14px)
                          </SelectItem>
                          <SelectItem value="large" className="text-xs">
                            Large (16px)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs">Animations</Label>
                        <p className="text-[10px] text-muted-foreground">
                          Enable UI animations and transitions
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </>
                )}

                {activeSection === "workflow" && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-xs">Workflow editor coming soon...</p>
                    <p className="text-[10px] mt-1">
                      Visual workflow diagram builder with drag-drop
                    </p>
                  </div>
                )}

                {/* Placeholder for other sections */}
                {activeSection !== "appearance" && activeSection !== "workflow" && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-xs">{settingsSections.find((s) => s.id === activeSection)?.label} settings</p>
                    <p className="text-[10px] mt-1">Configuration options will appear here</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t px-4 py-2">
              <div className="flex gap-2">
                <Button size="xs" className="flex-1">
                  Save Changes
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
