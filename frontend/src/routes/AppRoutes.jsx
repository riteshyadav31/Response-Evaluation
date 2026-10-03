import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout.jsx'
import { DashboardPage } from '../pages/DashboardPage.jsx'
import { EvaluationDetailPage } from '../pages/EvaluationDetailPage.jsx'
import { HistoryPage } from '../pages/HistoryPage.jsx'
import { NewEvaluationPage } from '../pages/NewEvaluationPage.jsx'
import { ReportsPage } from '../pages/ReportsPage.jsx'
import { SettingsPage } from '../pages/SettingsPage.jsx'
import { LoginPage } from '../pages/LoginPage.jsx'
import { RegisterPage } from '../pages/RegisterPage.jsx'
import { ProfilePage } from '../pages/ProfilePage.jsx'
import { GuestOnly, RequireAuth } from './AuthGuards.jsx'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="evaluations" element={<HistoryPage />} />
        <Route path="evaluations/new" element={<NewEvaluationPage />} />
        <Route path="evaluations/:evaluationId" element={<EvaluationDetailPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}