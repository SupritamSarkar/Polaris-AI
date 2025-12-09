import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Attachment {
  type: "image" | "file";
  name: string;
  file: File;
  url?: string;
}

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- NEW CODE: Auto-resize logic ---
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to correctly calculate scrollHeight for shrinking
      textarea.style.height = "auto";
      // Set to scrollHeight to fit content
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);
  // -----------------------------------

  const handleSend = () => {
    if ((!message.trim() && attachments.length === 0) || isLoading) return;
    onSend(message.trim(), attachments);
    setMessage("");
    setAttachments([]);
    
    // Reset height manually after sending
    if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "file"
  ) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      type,
      name: file.name,
      file,
      url: type === "image" ? URL.createObjectURL(file) : undefined,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const newAttachments = [...prev];
      if (newAttachments[index].url) {
        URL.revokeObjectURL(newAttachments[index].url!);
      }
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  return (
    <div className="w-full p-2">
      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 px-1 animate-in fade-in-0 slide-in-from-bottom-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="group relative flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-3 py-2 text-xs shadow-sm transition-all hover:bg-secondary"
            >
              {attachment.type === "image" && attachment.url ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="h-8 w-8 rounded-md object-cover"
                />
              ) : (
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="max-w-[100px] truncate font-medium text-foreground/80">
                {attachment.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="ml-1 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Bar */}
      <div className="flex items-end gap-3">
        {/* Upload Buttons */}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e, "file")}
            className="hidden"
            multiple
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={(e) => handleFileChange(e, "image")}
            accept="image/*"
            className="hidden"
            multiple
          />

          {/* File Upload Button */}
          <div className="group relative">
            <Button
              type="button"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="h-12 w-12 rounded-xl border border-border/40 bg-secondary/30 shadow-sm transition-all duration-300 hover:bg-primary/20 hover:border-primary/50 hover:text-primary hover:scale-105"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-90 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 bg-popover text-popover-foreground text-[10px] py-1 px-2 rounded-md whitespace-nowrap pointer-events-none border border-border/50 shadow-md">
              Upload File
            </span>
          </div>

          {/* Image Upload Button */}
          <div className="group relative">
            <Button
              type="button"
              variant="ghost"
              onClick={() => imageInputRef.current?.click()}
              className="h-12 w-12 rounded-xl border border-border/40 bg-secondary/30 shadow-sm transition-all duration-300 hover:bg-primary/20 hover:border-primary/50 hover:text-primary hover:scale-105"
            >
              <Image className="h-5 w-5" />
            </Button>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-90 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 bg-popover text-popover-foreground text-[10px] py-1 px-2 rounded-md whitespace-nowrap pointer-events-none border border-border/50 shadow-md">
              Upload Image
            </span>
          </div>
        </div>

        {/* Text Input */}
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className={cn(
              // Added overflow-hidden to prevent scrollbar flicker while typing
              // The max-h-[200px] controls when the scrollbar finally appears
              "min-h-[48px] max-h-[200px] w-full resize-none rounded-xl border border-border/50 bg-secondary/20 px-4 py-3 text-base shadow-inner backdrop-blur-sm",
              "placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary",
              "focus-visible:shadow-[0_0_10px_rgba(var(--primary),0.1)]",
              "transition-all duration-300 ease-in-out",
              "overflow-y-auto" 
            )}
            rows={1}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={isLoading || (!message.trim() && attachments.length === 0)}
          className={cn(
            "h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md",
            "transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          )}
          size="icon"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;