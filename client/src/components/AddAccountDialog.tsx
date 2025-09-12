import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AddAccountForm from "./AddAccountForm";

interface AddAccountDialogProps {
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export default function AddAccountDialog({ trigger, children }: AddAccountDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const defaultTrigger = (
    <Button data-testid="button-add-account-dialog-trigger">
      <Plus className="h-4 w-4 mr-2" />
      Add Account
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || children || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
          <DialogDescription>
            Add a new bank account or credit card to track your finances. 
            All information is stored securely and only visible to you.
          </DialogDescription>
        </DialogHeader>
        <AddAccountForm 
          onSuccess={handleSuccess} 
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}

// Export a simple trigger component for easy use
export function AddAccountTrigger() {
  return (
    <AddAccountDialog>
      <Button data-testid="button-add-account">
        <Plus className="h-4 w-4 mr-2" />
        Add Account
      </Button>
    </AddAccountDialog>
  );
}