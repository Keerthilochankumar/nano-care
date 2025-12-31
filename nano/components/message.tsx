import { getToolName, type UIMessage } from "ai";
import { memo } from "react";
import * as equal from "fast-deep-equal";
import { Sparkles } from "lucide-react";

import { Markdown } from "./markdown";
import { cn } from "@/lib/utils";

const PureMessage = memo(
  ({
    message,
    isLoading,
    status,
    isLatestMessage,
  }: {
    message: UIMessage;
    isLoading: boolean;
    status: "error" | "submitted" | "streaming" | "ready";
    isLatestMessage: boolean;
  }) => {
    return (
      <div className="w-full mx-auto px-4 group/message" data-role={message.role}>
        <div
          className={cn(
            "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
            "group-data-[role=user]/message:w-fit",
          )}
        >
          {message.role === "assistant" && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="">
                <Sparkles size={14} />
              </div>
            </div>
          )}

          <div className="flex flex-col w-full space-y-4">
            {message.parts?.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    <div
                      key={`message-${message.id}-part-${i}`}
                      className="flex flex-row gap-2 items-start w-full pb-4"
                    >
                      <div
                        className={cn("flex flex-col gap-4", {
                          "bg-muted px-3 py-2 rounded-lg max-w-fit group-data-[role=user]/message:bg-primary group-data-[role=user]/message:text-primary-foreground":
                            message.role === "user",
                        })}
                      >
                        <Markdown>{part.text}</Markdown>
                      </div>
                    </div>
                  );

                case "tool-call":
                  return (
                    <div
                      key={`message-${message.id}-part-${i}`}
                      className="flex flex-col gap-2"
                    >
                      <div className="text-sm text-muted-foreground">
                        Calling tool...
                      </div>
                    </div>
                  );

                case "tool-result":
                  return (
                    <div
                      key={`message-${message.id}-part-${i}`}
                      className="flex flex-col gap-2"
                    >
                      <div className="text-sm text-muted-foreground">
                        Tool completed
                      </div>
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.isLatestMessage !== nextProps.isLatestMessage) return false;
    if (prevProps.status !== nextProps.status) return false;

    return equal.default(prevProps.message, nextProps.message);
  },
);

PureMessage.displayName = "PureMessage";

export const Message = PureMessage;