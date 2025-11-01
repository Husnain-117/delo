import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import RoleSelection from "./pages/RoleSelection";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import MenuManagement from "./pages/admin/MenuManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import InventoryManagement from "./pages/admin/InventoryManagement";
import StaffManagement from "./pages/admin/StaffManagement";
import CustomerManagement from "./pages/admin/CustomerManagement";
import ReservationManagement from "./pages/admin/ReservationManagement";
import KitchenDashboard from "./pages/kitchen/KitchenDashboard";
import WaiterDashboard from "./pages/waiter/WaiterDashboard";
import OrderTaking from "./pages/waiter/OrderTaking";
import CustomerHome from "./pages/customer/CustomerHome";
import CustomerMenu from "./pages/customer/Menu";
import CustomerOrders from "./pages/customer/Orders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RoleSelection />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="reservations" element={<ReservationManagement />} />
            </Route>

            {/* Kitchen Routes */}
            <Route path="/kitchen" element={
              <ProtectedRoute allowedRoles={['chef', 'admin', 'manager']}>
                <KitchenDashboard />
              </ProtectedRoute>
            } />

            {/* Waiter Routes */}
            <Route path="/waiter" element={
              <ProtectedRoute allowedRoles={['waiter', 'admin', 'manager']}>
                <WaiterDashboard />
              </ProtectedRoute>
            } />
            <Route path="/waiter/order-taking" element={
              <ProtectedRoute allowedRoles={['waiter', 'admin', 'manager']}>
                <OrderTaking />
              </ProtectedRoute>
            } />

            {/* Customer Routes */}
            <Route path="/customer" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerHome />
              </ProtectedRoute>
            } />
            <Route path="/customer/menu" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerMenu />
              </ProtectedRoute>
            } />
            <Route path="/customer/orders" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerOrders />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
