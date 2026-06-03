export default function ChatTypingIndicator() {
  return (
    <div className="flex gap-3 items-end mb-4">
      {/* Bot Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white text-xs font-bold">
        C
      </div>
      {/* Typing bubble */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl rounded-bl-sm px-5 py-4 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '0.8s' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: '150ms', animationDuration: '0.8s' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: '300ms', animationDuration: '0.8s' }}
          />
        </div>
      </div>
    </div>
  );
}
