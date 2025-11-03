import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRedirect } from "./components/RoleRedirect";
import Auth from "./pages/Auth";
import RoleSelection from "./pages/RoleSelection";
import ProfileCompletion from "./pages/ProfileCompletion";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import MenuManagement from "./pages/admin/MenuManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import InventoryManagement from "./pages/admin/InventoryManagement";
import StaffManagement from "./pages/admin/StaffManagement";
import CustomerManagement from "./pages/admin/CustomerManagement";
import ReservationManagement from "./pages/admin/ReservationManagement";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import KitchenDashboard from "./pages/kitchen/KitchenDashboard";
import WaiterLayout from "./pages/waiter/WaiterLayout";
import WaiterDashboard from "./pages/waiter/WaiterDashboard";
import OrderTaking from "./pages/waiter/OrderTaking";
import MyOrders from "./pages/waiter/MyOrders";
import WaiterTables from "./pages/waiter/Tables";
import WaiterMenu from "./pages/waiter/WaiterMenu";
import CustomerLayout from "./pages/customer/CustomerLayout";
import CustomerHome from "./pages/customer/CustomerHome";
import CustomerMenu from "./pages/customer/Menu";
import CustomerCart from "./pages/customer/Cart";
import CustomerOrders from "./pages/customer/Orders";
import CustomerReservations from "./pages/customer/Reservations";
import CustomerRewards from "./pages/customer/Rewards";
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
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile-completion" element={<ProfileCompletion />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            
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
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
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
                <WaiterLayout />
              </ProtectedRoute>
            }>
              <Route index element={<WaiterDashboard />} />
              <Route path="new-order" element={<OrderTaking />} />
              <Route path="orders" element={<MyOrders />} />
              <Route path="tables" element={<WaiterTables />} />
              <Route path="menu" element={<WaiterMenu />} />
            </Route>

            {/* Customer Routes */}
            <Route path="/customer" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout />
              </ProtectedRoute>
            }>
              <Route index element={<CustomerHome />} />
              <Route path="menu" element={<CustomerMenu />} />
              <Route path="cart" element={<CustomerCart />} />
              <Route path="orders" element={<CustomerOrders />} />
              <Route path="reservations" element={<CustomerReservations />} />
              <Route path="rewards" element={<CustomerRewards />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
