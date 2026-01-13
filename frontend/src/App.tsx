import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Dashboard,
  Recommendations,
  BudgetOptimizer,
  Analytics,
  Anomalies,
  Settings,
  Login,
} from '@/pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="recommendations" element={<Recommendations />} />
            <Route
              path="budget"
              element={
                <ProtectedRoute requiredRole="manager">
                  <BudgetOptimizer />
                </ProtectedRoute>
              }
            />
            <Route path="analytics" element={<Analytics />} />
            <Route path="anomalies" element={<Anomalies />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
