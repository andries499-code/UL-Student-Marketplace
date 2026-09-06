import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import AuthPage from '@/pages/AuthPage';
import BrowsePage from '@/pages/BrowsePage';
import ListingDetailPage from '@/pages/ListingDetailPage';
import SellPage from '@/pages/SellPage';
import DashboardPage from '@/pages/DashboardPage';
import ChatsPage from '@/pages/ChatsPage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import BottomNav from '@/components/BottomNav';
import { GraduationCap } from 'lucide-react';

function AppContent() {
  const { path } = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const parts = path.split('/').filter(Boolean);
  let page: React.ReactNode;
  let showNav = true;

  if (parts.length === 0) {
    page = <BrowsePage />;
  } else if (parts[0] === 'listing' && parts[1]) {
    page = <ListingDetailPage id={parts[1]} />;
  } else if (parts[0] === 'sell') {
    page = <SellPage editId={parts[1]} />;
  } else if (parts[0] === 'dashboard') {
    page = <DashboardPage />;
  } else if (parts[0] === 'chats' && parts.length === 1) {
    page = <ChatsPage />;
  } else if (parts[0] === 'chat' && parts[1]) {
    page = <ChatPage conversationId={parts[1]} />;
    showNav = false;
  } else if (parts[0] === 'profile') {
    page = <ProfilePage userId={parts[1]} />;
  } else {
    page = <BrowsePage />;
  }

  return (
    <>
      {page}
      {showNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}
