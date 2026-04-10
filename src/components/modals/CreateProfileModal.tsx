import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function CreateProfileModal({
  isOpen,
  onClose,
  onCreate,
}: CreateProfileModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setError("");
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Profile name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onCreate(name.trim());
      resetForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create profile";
      setError(message);
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      onClose();
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-400 to-primary" />

        <DialogHeader className="pt-4">
          <DialogTitle className="text-2xl font-bold">
            Create Profile
          </DialogTitle>
          <DialogDescription>
            Give your new WhatsApp profile a memorable name.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">
              Profile Name
            </Label>

            <Input
              id="name"
              placeholder="e.g. Main Support Line"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              className={`h-11 transition-all duration-200 focus-visible:ring-primary ${error
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
                }`}
              autoFocus
              disabled={isSubmitting}
              data-testid="input-profile-name"
            />

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="font-semibold shadow-md shadow-primary/20"
              data-testid="button-submit-profile"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}