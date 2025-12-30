"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Database } from "lucide-react";

interface RAGToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function RAGToggle({ enabled, onToggle, disabled = false }: RAGToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Database className="h-4 w-4 text-muted-foreground" />
      <Label htmlFor="rag-toggle" className="text-sm font-medium">
        Knowledge Search
      </Label>
      <Switch
        id="rag-toggle"
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
    </div>
  );
}