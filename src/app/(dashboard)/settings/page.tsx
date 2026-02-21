"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = React.useState("appearance");
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Bar */}
      <div className="flex h-12 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <h1 className="text-base font-semibold">Settings</h1>
        </div>
        <Button size="xs">Save Changes</Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-56 border-r bg-muted/30">
          <div className="p-3">
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-6 text-xs"
              />
            </div>
            <nav className="space-y-1">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-left transition-colors",
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span className="text-sm">{section.icon}</span>
                  <span className="truncate">{section.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-3xl">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">
                  {settingsSections.find((s) => s.id === activeSection)?.label}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure your {settingsSections.find((s) => s.id === activeSection)?.label.toLowerCase()} preferences
                </p>
              </div>

              <div className="space-y-6">
                {activeSection === "appearance" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="theme" className="text-sm">
                        Theme
                      </Label>
                      <Select defaultValue="light">
                        <SelectTrigger id="theme" className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light" className="text-sm">
                            Light
                          </SelectItem>
                          <SelectItem value="dark" className="text-sm">
                            Dark
                          </SelectItem>
                          <SelectItem value="system" className="text-sm">
                            System
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Choose your preferred theme or sync with system preferences
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="density" className="text-sm">
                        UI Density
                      </Label>
                      <Select defaultValue="compact">
                        <SelectTrigger id="density" className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact" className="text-sm">
                            Compact - More information per screen
                          </SelectItem>
                          <SelectItem value="comfortable" className="text-sm">
                            Comfortable - Balanced spacing
                          </SelectItem>
                          <SelectItem value="spacious" className="text-sm">
                            Spacious - More breathing room
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Adjust the information density and spacing throughout the app
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="font-size" className="text-sm">
                        Font Size
                      </Label>
                      <Select defaultValue="small">
                        <SelectTrigger id="font-size" className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small" className="text-sm">
                            Small (13px) - Compact
                          </SelectItem>
                          <SelectItem value="medium" className="text-sm">
                            Medium (14px) - Default
                          </SelectItem>
                          <SelectItem value="large" className="text-sm">
                            Large (16px) - Comfortable
                          </SelectItem>
                          <SelectItem value="xl" className="text-sm">
                            Extra Large (18px) - Accessibility
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Animations</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable smooth transitions and animations
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Reduce Motion</Label>
                        <p className="text-xs text-muted-foreground">
                          Minimize animations for accessibility
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </>
                )}

                {activeSection === "workflow" && (
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <div className="mb-3 text-3xl">🔄</div>
                    <h3 className="text-sm font-semibold mb-2">Workflow Editor</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Visual workflow diagram builder with drag-and-drop state management,
                      custom transitions, and import/export functionality.
                    </p>
                    <Button size="sm" disabled>
                      Coming Soon
                    </Button>
                  </div>
                )}

                {activeSection === "working-hours" && (
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <div className="mb-3 text-3xl">⏰</div>
                    <h3 className="text-sm font-semibold mb-2">Working Hours Configuration</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Set your daily working hours, breaks, and focus time preferences
                      to optimize AI scheduling suggestions.
                    </p>
                    <Button size="sm" disabled>
                      Coming Soon
                    </Button>
                  </div>
                )}

                {/* Placeholder for other sections */}
                {activeSection !== "appearance" &&
                  activeSection !== "workflow" &&
                  activeSection !== "working-hours" && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="text-sm">
                        {settingsSections.find((s) => s.id === activeSection)?.label} settings
                      </p>
                      <p className="text-xs mt-2">Configuration options will appear here</p>
                    </div>
                  )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
