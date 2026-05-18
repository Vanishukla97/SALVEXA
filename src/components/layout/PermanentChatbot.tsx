import { Icon } from '../ui/Icon';

export function PermanentChatbot() {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button className="relative flex items-center justify-center w-16 h-16 bg-primary text-on-primary rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 group">
        <Icon name="smart_toy" className="h-8 w-8" />
        
        {/* Notification Badge */}
        <span className="absolute top-3 right-3 w-3 h-3 bg-error rounded-full border-2 border-primary animate-pulse"></span>
        
        {/* Tooltip */}
        <span className="absolute right-full mr-4 bg-surface-container-highest text-on-surface text-sm font-bold px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
          Chat with AI Health Assistant
        </span>
      </button>
    </div>
  );
}
