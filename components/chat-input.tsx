import { useState, useRef, useEffect } from "react";

export default function ChatInput({
  status,
  onSubmit,
  stop,
}: {
  status: string;
  onSubmit: (text: string) => void;
  stop?: () => void;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() === "") return;
    onSubmit(text);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <textarea
        ref={textareaRef}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[40px] max-h-[200px]"
        placeholder="Say something... (Shift+Enter for new line)"
        disabled={status !== "ready"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
      />
      <div className="flex gap-2">
        {stop && (status === "streaming" || status === "submitted") && (
          <button
            className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            type="button"
            onClick={stop}
          >
            Stop
          </button>
        )}
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          type="submit"
          disabled={status !== "ready" || text.trim() === ""}
        >
          Send
        </button>
      </div>
    </form>
  );
}
