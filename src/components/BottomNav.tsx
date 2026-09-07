import { Home, Plus, MessageSquare, LayoutDashboard, User } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useUnreadCount } from '@/hooks/useUnreadCount';

export default function BottomNav() {
  const { path, navigate } = useRouter();
  const unreadCount = useUnreadCount();

  const items = [
    { icon: Home, label: 'Browse', path: '/' },
    { icon: Plus, label: 'Sell', path: '/sell' },
    { icon: MessageSquare, label: 'Chats', path: '/chats' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-pb">
      <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-1.5">
        {items.map((item) => {
          const active = path === item.path || (item.path !== '/' && path.startsWith(item.path));
          const Icon = item.icon;
          const showBadge = item.path === '/chats' && unreadCount > 0;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                active ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
