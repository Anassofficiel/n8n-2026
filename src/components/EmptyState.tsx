import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, MessagesSquare } from "lucide-react";

interface EmptyStateProps {
  onCreateClick: () => void;
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full flex flex-col items-center justify-center p-12 py-24 text-center border-2 border-dashed border-border/60 rounded-3xl bg-muted/20"
    >
      <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 shadow-inner">
        <MessagesSquare size={36} strokeWidth={1.5} />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-2">No profiles yet</h3>
      <p className="text-muted-foreground max-w-md mb-8">
        Create your first profile to connect your WhatsApp account and deploy an intelligent AI assistant in minutes.
      </p>
      <Button 
        size="lg" 
        onClick={onCreateClick}
        className="rounded-full px-8 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
        data-testid="button-create-empty"
      >
        <Plus className="mr-2 h-5 w-5" />
        Create Profile
      </Button>
    </motion.div>
  );
}
