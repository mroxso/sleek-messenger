import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { BottomNavigation } from "./components/BottomNavigation";

import Index from "./pages/Index";
import Profile from "./pages/Profile";
import ChatPage from "./pages/ChatPage";
import { NIP19Page } from "./pages/NIP19Page";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chat/:pubkey" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;