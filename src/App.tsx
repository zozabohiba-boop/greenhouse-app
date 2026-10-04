import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './app/context';
import { Shell } from './components/Shell';
import { Login } from './screens/Login';
import { FarmGate } from './screens/FarmGate';
import { Home } from './screens/Home';
import { CycleDetail, CycleForm, GreenhouseDetail, GreenhouseForm, SetupHome } from './screens/Setup';
import { RegisterEntry, RegisterPick } from './screens/Register';
import { RegisterSummary } from './screens/Summary';
import { Team } from './screens/Team';

function Protected() {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <FarmGate>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="setup" element={<SetupHome />} />
          <Route path="setup/greenhouses/new" element={<GreenhouseForm />} />
          <Route path="setup/greenhouses/:id" element={<GreenhouseDetail />} />
          <Route path="setup/greenhouses/:id/edit" element={<GreenhouseForm />} />
          <Route path="setup/greenhouses/:ghId/cycles/new" element={<CycleForm />} />
          <Route path="setup/cycles/:id" element={<CycleDetail />} />
          <Route path="setup/cycles/:id/edit" element={<CycleForm />} />
          <Route path="register" element={<RegisterPick />} />
          <Route path="register/:cycleId" element={<RegisterEntry />} />
          <Route path="register/:cycleId/summary" element={<RegisterSummary />} />
          <Route path="team" element={<Team />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </FarmGate>
  );
}

export function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<Protected />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
