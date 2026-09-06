import { Home, Plus, MessageSquare, LayoutDashboard, User } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';

export default function BottomNav() {
  const { path, navigate } = useRouter();

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
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                active ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
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
