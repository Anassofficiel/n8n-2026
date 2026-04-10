import { useEffect, useRef, useState } from "react";
import {
  connectWhatsApp,
  getWhatsAppSessionByProfileId,
  refreshProfileConnectionState,
} from "@/lib/profileApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConnectWhatsAppModalProps {
  isOpen: boolean;
  profileId: string | null;
  onClose: () => void;
  onConnected: () => void | Promise<void>;
}

type SessionData = {
  profile_id: string;
  session_id: string | null;
  instance_name?: string | null;
  status: string;
  qr_code: string | null;
  pairing_code?: string | null;
  connected_at: string | null;
  updated_at: string;
} | null;

export function ConnectWhatsAppModal({
  isOpen,
  profileId,
  onClose,
  onConnected,
}: ConnectWhatsAppModalProps) {
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [session, setSession] = useState<SessionData>(null);
  const [statusText, setStatusText] = useState("Preparing WhatsApp connection...");

  const pollingRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const initializedProfileRef = useRef<string | null>(null);

  const clearPolling = () => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const loadSession = async (targetProfileId: string) => {
    const data = await getWhatsAppSessionByProfileId(targetProfileId);

    if (mountedRef.current) {
      setSession(data);
    }

    return data;
  };

  const syncConnectionState = async (targetProfileId: string) => {
    const state = await refreshProfileConnectionState(targetProfileId);

    if (mountedRef.current) {
      setSession((prev) =>
        prev
          ? {
            ...prev,
            status: state,
            connected_at:
              state === "connected"
                ? prev.connected_at ?? new Date().toISOString()
                : null,
            updated_at: new Date().toISOString(),
          }
          : prev
      );
    }

    return state;
  };

  const startPolling = (targetProfileId: string) => {
    clearPolling();

    pollingRef.current = window.setInterval(async () => {
      try {
        const state = await syncConnectionState(targetProfileId);
        const latestSession = await loadSession(targetProfileId);

        if (state === "connected" || latestSession?.status === "connected") {
          clearPolling();

          if (mountedRef.current) {
            setStatusText("WhatsApp connected successfully ✅");
          }

          toast({
            title: "WhatsApp Connected ✅",
            description: "The QR was scanned and the profile is now connected.",
          });

          await onConnected();
          return;
        }

        if (mountedRef.current) {
          if (latestSession?.qr_code) {
            setStatusText("Scan this QR code with WhatsApp.");
          } else if (latestSession?.pairing_code) {
            setStatusText("Use the pairing code below to connect.");
          } else {
            setStatusText("Waiting for QR code...");
          }
        }
      } catch (error) {
        console.error("Polling connection state failed:", error);
      }
    }, 3000);
  };

  const initializeConnection = async (targetProfileId: string) => {
    try {
      setIsGenerating(true);
      setStatusText("Preparing WhatsApp connection...");

      const existingSession = await loadSession(targetProfileId);

      if (existingSession?.status === "connected") {
        setStatusText("WhatsApp connected successfully ✅");
        await onConnected();
        return;
      }

      if (!existingSession?.qr_code && !existingSession?.pairing_code) {
        setStatusText("Generating QR code...");
        await connectWhatsApp(targetProfileId);
      }

      const sessionData = await loadSession(targetProfileId);

      if (sessionData?.status === "connected") {
        setStatusText("WhatsApp connected successfully ✅");
        await onConnected();
        return;
      }

      if (sessionData?.qr_code) {
        setStatusText("Scan this QR code with WhatsApp.");
      } else if (sessionData?.pairing_code) {
        setStatusText("Use the pairing code below to connect.");
      } else {
        setStatusText("Waiting for QR code...");
      }

      startPolling(targetProfileId);
    } catch (error) {
      console.error("Failed to initialize WhatsApp connection:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate WhatsApp QR code.";

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });

      setStatusText("Failed to generate QR code.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = async () => {
    if (!profileId) return;

    try {
      setIsRefreshing(true);

      const state = await syncConnectionState(profileId);
      let sessionData = await loadSession(profileId);

      if (state === "connected" || sessionData?.status === "connected") {
        toast({
          title: "Already Connected ✅",
          description: "This WhatsApp profile is already connected.",
        });

        await onConnected();
        return;
      }

      if (!sessionData?.qr_code && !sessionData?.pairing_code) {
        await connectWhatsApp(profileId);
        sessionData = await loadSession(profileId);
      }

      if (sessionData?.qr_code) {
        setStatusText("Scan this QR code with WhatsApp.");
      } else if (sessionData?.pairing_code) {
        setStatusText("Use the pairing code below to connect.");
      } else {
        setStatusText("Still waiting for QR code...");
      }
    } catch (error) {
      console.error("Failed to refresh QR/session:", error);

      const message =
        error instanceof Error ? error.message : "Failed to refresh session.";

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearPolling();
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !profileId) {
      clearPolling();
      setSession(null);
      setStatusText("Preparing WhatsApp connection...");
      initializedProfileRef.current = null;
      return;
    }

    if (initializedProfileRef.current !== profileId) {
      initializedProfileRef.current = profileId;
      initializeConnection(profileId);
    } else {
      loadSession(profileId)
        .then((existingSession) => {
          if (existingSession?.status === "connected") {
            setStatusText("WhatsApp connected successfully ✅");
            return;
          }

          if (existingSession?.qr_code) {
            setStatusText("Scan this QR code with WhatsApp.");
          } else if (existingSession?.pairing_code) {
            setStatusText("Use the pairing code below to connect.");
          } else {
            setStatusText("Waiting for QR code...");
          }

          startPolling(profileId);
        })
        .catch((error) => {
          console.error("Failed to load existing session:", error);
        });
    }

    return () => {
      clearPolling();
    };
  }, [isOpen, profileId]);

  const isConnected = session?.status === "connected";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          clearPolling();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect WhatsApp</DialogTitle>
          <DialogDescription>
            Scan the QR code below with the WhatsApp account for this profile.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {isGenerating ? (
            <div className="w-full flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{statusText}</p>
            </div>
          ) : session?.qr_code ? (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                <img
                  src={session.qr_code}
                  alt="WhatsApp QR Code"
                  className="h-64 w-64 object-contain"
                />
              </div>

              <p className="text-sm text-center text-muted-foreground">
                {statusText}
              </p>
            </div>
          ) : session?.pairing_code ? (
            <div className="w-full flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 p-6">
              <Smartphone className="h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground text-center">
                Pairing code available. Use it from WhatsApp linked devices.
              </p>
              <div className="rounded-lg border bg-background px-4 py-3 font-mono text-sm break-all text-center">
                {session.pairing_code}
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 p-6">
              <p className="text-sm text-muted-foreground text-center">
                {statusText || "Waiting for QR code..."}
              </p>
            </div>
          )}

          <div className="w-full rounded-xl border border-border bg-muted/20 p-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Session status</span>
              <span className="font-semibold">
                {isConnected ? "connected" : session?.status || "not_connected"}
              </span>
            </div>

            {session?.instance_name && (
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-muted-foreground">Instance</span>
                <span className="font-mono text-xs text-right">
                  {session.instance_name}
                </span>
              </div>
            )}
          </div>

          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleRefresh}
              disabled={isGenerating || isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>

            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                clearPolling();
                onClose();
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}