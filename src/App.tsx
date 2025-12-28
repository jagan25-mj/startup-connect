import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";


import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard";
import StartupsList from "./pages/Startups/StartupsList";
import StartupDetail from "./pages/Startups/StartupDetail";
import CreateStartup from "./pages/Startups/CreateStartup";
import EditStartup from "./pages/Startups/EditStartup";
import Profile from "./pages/Profile/Profile";
import EditProfile from "./pages/Profile/EditProfile";
import Messages from "./pages/Messages/Messages";
import InvestorDashboard from "./pages/Investor/InvestorDashboard";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
        <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/startups" element={<StartupsList />} />
            <Route path="/startups/:id" element={<StartupDetail />} />
            <Route 
              path="/startups/create" 
              element={
                <ProtectedRoute requiredRole="founder">
                  <CreateStartup />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/startups/:id/edit" 
              element={
                <ProtectedRoute requiredRole="founder">
                  <EditStartup />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/investor-dashboard" 
              element={
                <ProtectedRoute requiredRole="investor">
                  <InvestorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/edit" 
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/messages" 
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/messages/:conversationId" 
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
