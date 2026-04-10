import { ProfileStatus } from "@/types";
import { motion } from "framer-motion";

export function StatusBadge({ status }: { status: ProfileStatus }) {
  const getBadgeConfig = () => {
    switch (status) {
      case "not_connected":
        return {
          label: "Not Connected",
          bg: "bg-muted",
          text: "text-muted-foreground",
          dot: "bg-muted-foreground/40",
          glow: ""
        };
      case "connected":
        return {
          label: "Connected",
          bg: "bg-amber-500/10",
          text: "text-amber-600 dark:text-amber-500",
          dot: "bg-amber-500",
          glow: "shadow-[0_0_10px_rgba(245,158,11,0.2)]"
        };
      case "ai_active":
        return {
          label: "AI Active",
          bg: "bg-green-500/10",
          text: "text-green-600 dark:text-green-500",
          dot: "bg-green-500",
          glow: "shadow-[0_0_15px_rgba(34,197,94,0.3)]"
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} ${config.glow} transition-colors duration-300`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {status !== "not_connected" && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`}></span>
      </span>
      {config.label}
    </motion.div>
  );
}
