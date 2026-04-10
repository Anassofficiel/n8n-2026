import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, ArrowRight, Bot } from "lucide-react";

interface HeroSectionProps {
  onCreateClick: () => void;
}

export function HeroSection({ onCreateClick }: HeroSectionProps) {
  return (
    <section className="relative rounded-3xl overflow-hidden bg-card border shadow-sm">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent z-0" />
      <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] z-0" />
      
      <div className="relative z-10 px-8 py-14 sm:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <motion.div 
          className="flex-1 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            <Sparkles size={16} />
            <span>Next-gen Autoreply System</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
            Put your WhatsApp <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              on Autopilot
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
            Deploy an intelligent AI assistant that answers questions, qualifies leads, and handles support on your WhatsApp numbers 24/7.
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <Button 
              size="lg" 
              className="rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 group"
              onClick={onCreateClick}
              data-testid="button-create-hero"
            >
              <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              Create Profile
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-6 text-base font-medium group bg-background/50 backdrop-blur-sm"
              data-testid="button-how-it-works"
            >
              How it works
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
        
        <motion.div 
          className="flex-1 w-full max-w-md hidden md:flex justify-end"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Abstract visual representation of the product */}
          <div className="relative w-full aspect-square max-w-[320px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute inset-4 bg-card border rounded-3xl shadow-xl flex flex-col overflow-hidden">
              <div className="h-12 border-b bg-muted/50 flex items-center px-4 gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                  <Bot size={16} />
                </div>
                <div>
                  <div className="text-sm font-bold leading-none">AI Agent</div>
                  <div className="text-[10px] text-green-500">Online</div>
                </div>
              </div>
              <div className="flex-1 p-4 flex flex-col gap-3">
                <div className="self-start bg-muted max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2 text-sm text-muted-foreground">
                  Hi! Do you offer enterprise pricing?
                </div>
                <div className="self-end bg-primary text-primary-foreground max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2 text-sm">
                  Yes, we do! Our enterprise plans start at $99/mo. Would you like me to connect you with sales?
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
