import { useCallback, useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { HeroSection } from "@/components/HeroSection";
import { ProfileGrid } from "@/components/ProfileGrid";
import { CreateProfileModal } from "@/components/modals/CreateProfileModal";
import { ConnectWhatsAppModal } from "@/components/modals/ConnectWhatsAppModal";
import { ConfigureAssistantModal } from "@/components/modals/ConfigureAssistantModal";
import { Profile, AssistantConfig } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  getProfiles,
  createProfile,
  deleteProfile,
  saveAssistantConfig,
  connectWhatsApp,
  disconnectWhatsApp,
} from "@/lib/profileApi";

type SupabaseAssistantConfigRow = {
  profile_id: string;
  assistant_name: string;
  assistant_type: string;
  ai_provider: string;
  system_prompt: string;
  knowledge_base: string | null;
  voice_enabled: boolean;
  is_active: boolean;
};

type SupabaseWhatsAppSessionRow = {
  profile_id: string;
  session_id: string | null;
  status: string;
  qr_code: string | null;
  connected_at: string | null;
  updated_at: string;
};

type SupabaseProfileRow = {
  id: string;
  name: string;
  connection_status: string;
  phone_number: string | null;
  created_at: string;
  assistant_configs?: SupabaseAssistantConfigRow | SupabaseAssistantConfigRow[] | null;
  whatsapp_sessions?: SupabaseWhatsAppSessionRow | SupabaseWhatsAppSessionRow[] | null;
};

function mapSupabaseProfiles(data: SupabaseProfileRow[]): Profile[] {
  return (data || []).map((item) => {
    const rawConfig = Array.isArray(item.assistant_configs)
      ? item.assistant_configs[0]
      : item.assistant_configs || null;

    const rawSession = Array.isArray(item.whatsapp_sessions)
      ? item.whatsapp_sessions[0]
      : item.whatsapp_sessions || null;

    const isConnected =
      rawSession?.status === "connected" ||
      item.connection_status === "connected";

    const assistantConfig = rawConfig
      ? {
        name: rawConfig.assistant_name,
        type: rawConfig.assistant_type,
        provider: rawConfig.ai_provider,
        systemPrompt: rawConfig.system_prompt,
        knowledgeBase: rawConfig.knowledge_base || "",
        voiceResponse: rawConfig.voice_enabled,
        isActive: rawConfig.is_active,
      }
      : undefined;

    return {
      id: item.id,
      name: item.name,
      status:
        assistantConfig?.isActive && isConnected
          ? "ai_active"
          : isConnected
            ? "connected"
            : "not_connected",
      assistantConfig,
    } satisfies Profile;
  });
}

export default function Dashboard() {
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [connectModalProfileId, setConnectModalProfileId] = useState<string | null>(null);
  const [configModalProfileId, setConfigModalProfileId] = useState<string | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  const loadProfiles = useCallback(async () => {
    try {
      setIsLoadingProfiles(true);

      const data = (await getProfiles()) as SupabaseProfileRow[];
      console.log("Profiles from Supabase:", data);

      const mappedProfiles = mapSupabaseProfiles(data || []);
      setProfiles(mappedProfiles);
    } catch (error) {
      console.error("Error loading profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load profiles from Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleCreateProfile = async (name: string) => {
    try {
      const created = await createProfile(name);

      await loadProfiles();
      setCreateModalOpen(false);

      toast({
        title: "Profile Created 🎉",
        description: `WhatsApp profile "${created.name}" has been created successfully.`,
      });
    } catch (error) {
      console.error("Error creating profile:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to create profile.";

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });

      throw error;
    }
  };

  const handleDeleteProfile = async (id: string) => {
    try {
      await deleteProfile(id);

      setProfiles((prev) => prev.filter((p) => p.id !== id));

      toast({
        title: "Profile Deleted",
        description: "The profile has been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast({
        title: "Error",
        description: "Failed to delete profile.",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppConnected = async (id: string) => {
    try {
      await connectWhatsApp(id);
      await loadProfiles();
      setConnectModalProfileId(null);

      toast({
        title: "WhatsApp Connected ✅",
        description: "Your WhatsApp account is now linked through Evolution API.",
      });
    } catch (error) {
      console.error("Error connecting WhatsApp:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to save WhatsApp connection.";

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDisconnectWhatsApp = async (id: string) => {
    try {
      await disconnectWhatsApp(id);
      await loadProfiles();

      toast({
        title: "WhatsApp Disconnected",
        description: "The WhatsApp account has been disconnected from the dashboard.",
      });
    } catch (error) {
      console.error("Error disconnecting WhatsApp:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect WhatsApp.",
        variant: "destructive",
      });
    }
  };

  const handleSaveConfig = async (id: string, config: AssistantConfig) => {
    try {
      const selectedProfile = profiles.find((p) => p.id === id);

      if (!selectedProfile) {
        throw new Error("Profile not found.");
      }

      if (selectedProfile.status === "not_connected") {
        throw new Error("Connect WhatsApp first before activating the assistant.");
      }

      await saveAssistantConfig(id, config);
      await loadProfiles();
      setConfigModalProfileId(null);

      if (config.isActive) {
        toast({
          title: "AI Activated 🚀",
          description: "Your assistant is now ready to reply automatically.",
        });
      } else {
        toast({
          title: "Configuration Saved",
          description: "Assistant settings updated.",
        });
      }
    } catch (error) {
      console.error("Error saving assistant config:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to save assistant configuration.";

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <DashboardHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col gap-12 z-0">
        <HeroSection onCreateClick={() => setCreateModalOpen(true)} />

        <ProfileGrid
          profiles={profiles}
          onCreateClick={() => setCreateModalOpen(true)}
          onConnectClick={(id) => setConnectModalProfileId(id)}
          onConfigClick={(id) => {
            const selectedProfile = profiles.find((p) => p.id === id);

            if (!selectedProfile) return;

            if (selectedProfile.status === "not_connected") {
              toast({
                title: "Connect WhatsApp First",
                description: "You need to connect WhatsApp before configuring the assistant.",
                variant: "destructive",
              });
              return;
            }

            setConfigModalProfileId(id);
          }}
          onDeleteClick={handleDeleteProfile}
          onDisconnectClick={handleDisconnectWhatsApp}
        />

        {isLoadingProfiles && (
          <div className="text-sm text-muted-foreground px-1">
            Syncing profiles...
          </div>
        )}
      </main>

      <CreateProfileModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateProfile}
      />

      <ConnectWhatsAppModal
        isOpen={!!connectModalProfileId}
        profileId={connectModalProfileId}
        onClose={() => setConnectModalProfileId(null)}
        onConnected={async () => {
          setConnectModalProfileId(null);
          await loadProfiles();

          toast({
            title: "WhatsApp Connected ✅",
            description: "Your WhatsApp account is now linked successfully.",
          });
        }}
      />

      {configModalProfileId && (
        <ConfigureAssistantModal
          isOpen={!!configModalProfileId}
          onClose={() => setConfigModalProfileId(null)}
          profile={profiles.find((p) => p.id === configModalProfileId)}
          onSave={(config) => handleSaveConfig(configModalProfileId, config)}
        />
      )}
    </div>
  );
}