import { useState, useRef, useEffect } from "react";
// Remove ChatMessage import if you are no longer using it, 
// or keep it if you use it for other things.
// import ChatMessage from "./ChatMessage"; 
import ChatInput from "./ChatInput";
import ThemeToggle from "../ThemeToggle";
import ShootingStars from "./ShootingStars";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Zap, MessageCircle, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: { type: "image" | "file"; name: string; url?: string }[];
}

interface Attachment {
  type: "image" | "file";
  name: string;
  file: File;
  url?: string;
}

const API_URL = "https://polaris-ai.onrender.com/api/llm/chat";

const ChatContainer = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string, attachments: Attachment[]) => {
    const userMessage: Message = {
      role: "user",
      content,
      attachments: attachments.map((a) => ({
        type: a.type,
        name: a.name,
        url: a.url,
      })),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const history = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const formData = new FormData();
      formData.append("prompt", content);
      formData.append("history", JSON.stringify(history));
      attachments.forEach((att) => {
        formData.append("attachments", att.file);
      });

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.result || data.answer || "No response text",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Connection Error",
        description: "Could not connect. Ensure Backend is running and 'HF_MODEL' supports vision.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background selection:bg-primary/20">
      
      {/* Background Animation */}
      <ShootingStars />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-border/50 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-secondary to-primary shadow-sm">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Polaris</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Intelligence at lightspeed
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="mx-auto w-full max-w-3xl px-4 py-8">
            {messages.length === 0 ? (
              /* Empty State */
             <div className="flex h-full flex-col items-center justify-center px-4 mt-32 text-center animate-in fade-in-0 duration-500">
            <div className="relative mb-8">
              <div className="flex h-24 w-24 text-center items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-secondary to-primary shadow-2xl ring-4 ring-primary/20">
                <Sparkles className="h-12 w-12 text-primary-foreground" />
              </div>
              <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-primary shadow-lg animate-bounce">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
                <h2 className="mb-3 text-3xl font-semibold tracking-tight">
                  How can I help you?
                </h2>
                
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {[
                    { icon: MessageCircle, text: "Natural Chat" },
                    { icon: Brain, text: "Reasoning" },
                    { icon: Zap, text: "Fast Answers" },
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm font-medium text-foreground/80 shadow-sm transition-colors hover:bg-secondary/50 backdrop-blur-sm"
                    >
                      <feature.icon className="h-4 w-4 text-primary" />
                      {feature.text}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat Stream */
              <div className="flex flex-col gap-8 pb-8">
                {messages.map((message, index) => {
                  const isUser = message.role === "user";

                  return (
                    <div
                      key={index}
                      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} animate-in fade-in-0 slide-in-from-bottom-2`}
                    >
                      {isUser ? (
                        /* ✅ USER MESSAGE: Fixed width (2/3) and font size */
                        <div className="max-w-[66%] space-y-2">
                           {/* User Text Bubble */}
                           <div className="rounded-2xl rounded-tr-sm bg-primary/10 px-5 py-3 text-base leading-relaxed text-foreground shadow-sm dark:bg-primary/20 dark:text-foreground">
                              {message.content}
                           </div>
                           
                           {/* User Attachments (if any) */}
                           {message.attachments && message.attachments.length > 0 && (
                             <div className="flex flex-wrap justify-end gap-2">
                               {message.attachments.map((att, i) => (
                                 att.type === 'image' && att.url ? (
                                   <img key={i} src={att.url} alt={att.name} className="h-20 w-20 rounded-lg object-cover border border-border/50" />
                                 ) : (
                                   <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                                      <span className="truncate max-w-[100px]">{att.name}</span>
                                   </div>
                                 )
                               ))}
                             </div>
                           )}
                        </div>
                      ) : (
                        /* ✅ ASSISTANT MESSAGE */
                        <div className="flex gap-4 max-w-full lg:max-w-[90%]">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/40 bg-background/50 shadow-sm mt-1 backdrop-blur-sm">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="prose prose-neutral dark:prose-invert max-w-none text-base leading-relaxed">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  a: ({node, ...props}) => <a {...props} className="text-primary underline underline-offset-4 hover:text-primary/80" target="_blank" rel="noopener noreferrer" />,
                                  code: ({node, ...props}) => <code {...props} className="bg-secondary/50 rounded px-1 py-0.5 text-sm font-mono" />,
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex gap-4 animate-in fade-in-0">
                     <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/40 bg-background/50 shadow-sm mt-1">
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                     </div>
                     <div className="flex items-center gap-1 mt-2">
                        <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" />
                     </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 z-20 backdrop-blur-md pb-2">
          <div className="mx-auto w-full max-w-3xl px-4">
            <ChatInput onSend={sendMessage} isLoading={isLoading} />
            <p className="mt-2 text-center text-xs text-muted-foreground/50">
               Polaris can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;