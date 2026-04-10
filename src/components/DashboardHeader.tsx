import { Bot, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center shadow-lg shadow-primary/20 text-white">
            <Bot size={22} className="stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight leading-tight text-foreground">
              WhatsApp AI Agent
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Connect & Autoreply
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full h-9 w-9">
            <Bell size={18} />
          </Button>
          
          <div className="h-5 w-px bg-border hidden sm:block"></div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold">Acme Corp</span>
              <span className="text-xs text-green-600 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                System Operational
              </span>
            </div>
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" />
              <AvatarFallback className="bg-primary/10 text-primary">AC</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
