import { Profile } from "@/types";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import {
  QrCode,
  Settings2,
  Trash2,
  Smartphone,
  MessageSquare,
  Unplug,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProfileCardProps {
  profile: Profile;
  onConnectClick: () => void;
  onConfigClick: () => void;
  onDeleteClick: () => void;
  onDisconnectClick: () => void;
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

export function ProfileCard({
  profile,
  onConnectClick,
  onConfigClick,
  onDeleteClick,
  onDisconnectClick,
}: ProfileCardProps) {
  const getStatusDescription = () => {
    switch (profile.status) {
      case "not_connected":
        return "Connect WhatsApp first to enable the assistant.";

      case "connected":
        return profile.assistantConfig
          ? "WhatsApp linked. Assistant configured but inactive."
          : "WhatsApp linked. Configure your assistant.";

      case "ai_active":
        return `${profile.assistantConfig?.name || "AI"} is actively replying.`;

      default:
        return "Unknown status.";
    }
  };

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <Card className="h-full flex flex-col overflow-hidden border-border/60 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300">
        <CardHeader className="pb-4 relative">
          <div className="absolute right-4 top-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the "{profile.name}" profile and disconnect the AI agent.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDeleteClick}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 border border-primary/10">
            {profile.status === "ai_active" ? (
              <MessageSquare size={24} className="text-primary" />
            ) : (
              <Smartphone size={24} className="text-primary" />
            )}
          </div>

          <h3 className="font-bold text-xl leading-none text-foreground mb-1 pr-8 truncate">
            {profile.name}
          </h3>

          <p className="text-sm text-muted-foreground min-h-[20px]">
            {getStatusDescription()}
          </p>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="bg-muted/50 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Status</span>
              <StatusBadge status={profile.status} />
            </div>

            {profile.assistantConfig && profile.status === "ai_active" && (
              <>
                <div className="h-px bg-border/50 my-1" />

                <div className="flex justify-between items-center text-sm gap-3">
                  <span className="text-muted-foreground font-medium">Provider</span>
                  <span className="font-semibold text-foreground text-right">
                    {profile.assistantConfig.provider}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm gap-3">
                  <span className="text-muted-foreground font-medium">Type</span>
                  <span className="font-semibold text-foreground text-right">
                    {profile.assistantConfig.type}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex flex-col gap-2">
          {profile.status === "not_connected" ? (
            <Button
              className="w-full font-semibold shadow-sm hover:shadow-md transition-shadow group"
              onClick={onConnectClick}
              data-testid={`button-connect-${profile.id}`}
            >
              <QrCode className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              Connect WhatsApp
            </Button>
          ) : (
            <>
              <Button
                variant={profile.status === "ai_active" ? "outline" : "default"}
                className="w-full font-semibold transition-all group"
                onClick={onConfigClick}
                data-testid={`button-config-${profile.id}`}
              >
                <Settings2 className="mr-2 h-4 w-4 group-hover:rotate-45 transition-transform duration-300" />
                {profile.status === "ai_active" ? "Edit Assistant" : "Configure Assistant"}
              </Button>

              <Button
                variant="ghost"
                className="w-full font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 transition-all group"
                onClick={onDisconnectClick}
                data-testid={`button-disconnect-${profile.id}`}
              >
                <Unplug className="mr-2 h-4 w-4 group-hover:-rotate-12 transition-transform duration-300" />
                Disconnect WhatsApp
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}