import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/layout/PageTransition';


import Index from "./pages/Index";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard";
import StartupsList from "./pages/Startups/StartupsList";
import StartupDetail from "./pages/Startups/StartupDetail";
import CreateStartup from "./pages/Startups/CreateStartup";
import EditStartup from "./pages/Startups/EditStartup";
import Profile from "./pages/Profile/Profile";
import PublicProfile from "./pages/Profile/PublicProfile";
import EditProfile from "./pages/Profile/EditProfile";
import Messages from "./pages/Messages/Messages";


const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route
          path="/home"
          element={
            <PageTransition>
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route path="/auth/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/auth/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/startups" element={<PageTransition><StartupsList /></PageTransition>} />
        <Route path="/startups/:id" element={<PageTransition><StartupDetail /></PageTransition>} />
        <Route
          path="/startups/create"
          element={
            <PageTransition>
              <ProtectedRoute requiredRole="founder">
                <CreateStartup />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route
          path="/startups/:id/edit"
          element={
            <PageTransition>
              <ProtectedRoute requiredRole="founder">
                <EditStartup />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PageTransition>
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route
          path="/profile"
          element={
            <PageTransition>
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <PageTransition>
              <ProtectedRoute>
                <PublicProfile />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <PageTransition>
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route
          path="/messages"
          element={
            <PageTransition>
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route
          path="/messages/:conversationId"
          element={
            <PageTransition>
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
