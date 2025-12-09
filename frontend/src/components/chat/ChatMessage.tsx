import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  attachments?: { type: "image" | "file"; name: string; url?: string }[];
}

const ChatMessage = ({ role, content, attachments }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex px-4 py-1.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("flex flex-col gap-1 max-w-[75%]", isUser && "items-end")}>
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-2xl bg-accent/50 px-3 py-2 text-sm"
              >
                {attachment.type === "image" && attachment.url ? (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="h-16 w-16 rounded-xl object-cover shadow-sm"
                  />
                ) : (
                  <span className="text-accent-foreground">{attachment.name}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            "rounded-3xl px-4 py-3 shadow-sm",
            isUser
              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-lg"
              : "bg-muted text-foreground rounded-bl-lg"
          )}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
