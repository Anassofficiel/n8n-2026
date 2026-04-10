import { Profile } from "@/types";
import { ProfileCard } from "./ProfileCard";
import { EmptyState } from "./EmptyState";
import { motion } from "framer-motion";

interface ProfileGridProps {
  profiles: Profile[];
  onCreateClick: () => void;
  onConnectClick: (id: string) => void;
  onConfigClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onDisconnectClick: (id: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function ProfileGrid({
  profiles,
  onCreateClick,
  onConnectClick,
  onConfigClick,
  onDeleteClick,
  onDisconnectClick,
}: ProfileGridProps) {
  if (profiles.length === 0) {
    return <EmptyState onCreateClick={onCreateClick} />;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold tracking-tight">Your Profiles</h3>
        <span className="text-sm text-muted-foreground font-medium bg-muted px-3 py-1 rounded-full">
          {profiles.length} {profiles.length === 1 ? "Profile" : "Profiles"}
        </span>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onConnectClick={() => onConnectClick(profile.id)}
            onConfigClick={() => onConfigClick(profile.id)}
            onDeleteClick={() => onDeleteClick(profile.id)}
            onDisconnectClick={() => onDisconnectClick(profile.id)}
          />
        ))}
      </motion.div>
    </div>
  );
}