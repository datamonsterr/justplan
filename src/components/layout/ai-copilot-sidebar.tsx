"use client";

import * as React from "react";
import { Send, Bot, Sparkles, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { mockAIMessages, quickActions, mockAIResponses, type AIMessage } from "@/lib/mock-ai-data";

export function AICopilotSidebar() {
  const [inputValue, setInputValue] = React.useState("");
  const [messages, setMessages] = React.useState<AIMessage[]>(mockAIMessages);
  const [isTyping, setIsTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: AIMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    const userInput = inputValue.toLowerCase();
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      
      // Find matching response based on keywords
      let aiResponse: AIMessage | null = null;
      
      if (userInput.includes("find") && (userInput.includes("time") || userInput.includes("slot"))) {
        aiResponse = mockAIResponses["find time"];
      } else if (userInput.includes("show") || userInput.includes("due")) {
        aiResponse = mockAIResponses["show tasks"];
      } else if (userInput.includes("reschedule") || userInput.includes("move")) {
        aiResponse = mockAIResponses["reschedule"];
      } else if (userInput.includes("break") || userInput.includes("subtask")) {
        aiResponse = mockAIResponses["break down"];
      } else if (userInput.includes("optimize")) {
        aiResponse = mockAIResponses["optimize"];
      } else if (userInput.includes("summary") || userInput.includes("week")) {
        aiResponse = mockAIResponses["summary"];
      } else {
        // Default response
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: "I understand you'd like help with that. I can assist with:\n\n• Finding available time slots\n• Managing and scheduling tasks\n• Breaking down complex tasks\n• Optimizing your schedule\n• Providing summaries and insights\n\nWhat would you like me to help with?",
          timestamp: new Date(),
        };
      }

      setMessages((prev) => [...prev, { ...aiResponse!, id: Date.now().toString(), timestamp: new Date() }]);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt);
    // Optionally auto-send
    // setTimeout(() => handleSend(), 100);
  };

  const clearConversation = () => {
    setMessages([mockAIMessages[0]]); // Keep welcome message
  };

  return (
    <div className="flex h-full flex-col border-r bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="h-4 w-4 text-primary" />
            <Sparkles className="absolute -right-1 -top-1 h-2 w-2 text-yellow-500" />
          </div>
          <span className="text-xs font-semibold">AI Copilot</span>
          <Badge size="sm" variant="secondary" className="text-[9px]">
            Beta
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={clearConversation}
            title="Clear conversation"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-1",
                message.type === "user" ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-2.5 py-2 text-xs leading-relaxed",
                  message.type === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>

              {message.tool && (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Badge
                    size="sm"
                    variant={
                      message.tool.status === "success"
                        ? "default"
                        : message.tool.status === "error"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-[9px]"
                  >
                    {message.tool.name}
                  </Badge>
                  {message.tool.result && (
                    <span className="text-[10px]">{message.tool.result}</span>
                  )}
                </div>
              )}

              <span className="text-[9px] text-muted-foreground">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-start gap-2">
              <div className="rounded-lg bg-muted px-2.5 py-2">
                <div className="flex gap-1">
                  <span className="animate-bounce text-xs">●</span>
                  <span className="animate-bounce text-xs" style={{ animationDelay: "0.2s" }}>●</span>
                  <span className="animate-bounce text-xs" style={{ animationDelay: "0.4s" }}>●</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Quick Actions */}
      <div className="border-t px-3 py-2">
        <div className="mb-2">
          <p className="text-[10px] font-medium text-muted-foreground mb-1.5">
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-1">
            {quickActions.slice(0, 4).map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="xs"
                className="h-5 text-[10px]"
                onClick={() => handleQuickAction(action.prompt)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t p-2">
        <div className="flex gap-1">
          <Input
            placeholder="Ask AI copilot..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="h-7 text-xs"
            disabled={isTyping}
          />
          <Button
            size="icon-sm"
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="h-7 w-7"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
        <p className="mt-1 text-[9px] text-muted-foreground">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
