import { useState, useEffect } from "react";
import { Profile, AssistantConfig } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Save, Sparkles, Activity, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface ConfigureAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: Profile;
  onSave: (config: AssistantConfig) => Promise<void> | void;
}

const DEFAULT_CONFIG: AssistantConfig = {
  name: "My Assistant",
  type: "Normal Q&A",
  provider: "Gemini Flash",
  systemPrompt: "You are a helpful assistant for our business.",
  knowledgeBase: "",
  webhookUrl: "",
  voiceResponse: false,
  isActive: false,
};

export function ConfigureAssistantModal({
  isOpen,
  onClose,
  profile,
  onSave,
}: ConfigureAssistantModalProps) {
  const [config, setConfig] = useState<AssistantConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && profile) {
      setConfig(
        profile.assistantConfig || {
          ...DEFAULT_CONFIG,
          name: `${profile.name} Bot`,
          isActive: false,
        }
      );
      setError("");
      setIsSaving(false);
    }
  }, [isOpen, profile]);

  const handleChange = <K extends keyof AssistantConfig>(
    field: K,
    value: AssistantConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSave = async () => {
    if (!config.name.trim()) {
      setError("Assistant name is required.");
      return;
    }

    if (!config.type.trim()) {
      setError("Assistant type is required.");
      return;
    }

    if (!config.provider.trim()) {
      setError("AI provider is required.");
      return;
    }

    if (!config.systemPrompt.trim()) {
      setError("System prompt is required.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      await onSave({
        ...config,
        name: config.name.trim(),
        type: config.type.trim(),
        provider: config.provider.trim(),
        systemPrompt: config.systemPrompt.trim(),
        knowledgeBase: config.knowledgeBase.trim(),
        webhookUrl: config.webhookUrl?.trim() || "",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save configuration.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSaving) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/60">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-purple-400 to-indigo-500" />

        <DialogHeader className="px-6 py-6 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/20">
                <Bot size={24} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  Configure Agent
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  for <span className="font-semibold text-foreground">{profile.name}</span>
                </p>
              </div>
            </div>

            <AnimatePresence>
              {config.isActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-600 border-green-500/30 gap-1.5 py-1 px-3"
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Ready to reply
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] px-6 py-6">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="agent-name" className="text-sm font-semibold">
                  Assistant Name
                </Label>
                <Input
                  id="agent-name"
                  value={config.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="bg-background/50 focus-visible:ring-primary"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">AI Provider</Label>
                <Select
                  value={config.provider}
                  onValueChange={(v) => handleChange("provider", v)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OpenAI">OpenAI (GPT-4o)</SelectItem>
                    <SelectItem value="Claude">Anthropic (Claude 3.5)</SelectItem>
                    <SelectItem value="Gemini Flash">Google (Gemini Flash)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Assistant Role / Type</Label>
              <Select
                value={config.type}
                onValueChange={(v) => handleChange("type", v)}
                disabled={isSaving}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal Q&A">Normal Q&A (General)</SelectItem>
                  <SelectItem value="Sales">Sales & Conversions</SelectItem>
                  <SelectItem value="Customer Support">Customer Support</SelectItem>
                  <SelectItem value="Lead Qualification">Lead Qualification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6 bg-muted/30 p-5 rounded-2xl border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-primary" />
                <h4 className="font-semibold text-lg">Brain & Behavior</h4>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-prompt" className="text-sm font-semibold">
                  System Prompt (Instructions)
                </Label>
                <Textarea
                  id="system-prompt"
                  rows={4}
                  value={config.systemPrompt}
                  onChange={(e) => handleChange("systemPrompt", e.target.value)}
                  placeholder="Tell the AI how to behave, what tone to use, and rules to follow..."
                  className="resize-none bg-background/50 focus-visible:ring-primary font-mono text-sm"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="knowledge" className="text-sm font-semibold">
                  Knowledge Base (Context)
                </Label>
                <Textarea
                  id="knowledge"
                  rows={4}
                  value={config.knowledgeBase}
                  onChange={(e) => handleChange("knowledgeBase", e.target.value)}
                  placeholder="Paste FAQ, product details, pricing, or business context here..."
                  className="resize-none bg-background/50 focus-visible:ring-primary"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="webhook"
                  className="text-sm font-semibold flex items-center justify-between"
                >
                  n8n Webhook URL{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (Optional)
                  </span>
                </Label>
                <Input
                  id="webhook"
                  type="url"
                  value={config.webhookUrl || ""}
                  onChange={(e) => handleChange("webhookUrl", e.target.value)}
                  placeholder="https://your-n8n.com/webhook/..."
                  className="bg-background/50 font-mono text-sm"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  Trigger external workflows when specific intents are detected.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/20 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Voice Notes</Label>
                    <p className="text-xs text-muted-foreground">
                      Reply with AI voice notes
                    </p>
                  </div>
                  <Switch
                    checked={config.voiceResponse}
                    onCheckedChange={(v) => handleChange("voiceResponse", v)}
                    disabled={isSaving}
                  />
                </div>

                <div
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${config.isActive
                      ? "border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(124,58,237,0.1)]"
                      : "border-border/60 bg-card"
                    }`}
                >
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold flex items-center gap-2">
                      Enable Agent
                      {config.isActive && (
                        <Activity size={16} className="text-primary animate-pulse" />
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Take over incoming chats
                    </p>
                  </div>
                  <Switch
                    checked={config.isActive}
                    onCheckedChange={(v) => handleChange("isActive", v)}
                    className="data-[state=checked]:bg-primary"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-muted/10 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={onClose}
            className="font-medium"
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            size="lg"
            className="rounded-full px-8 font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all gap-2"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}