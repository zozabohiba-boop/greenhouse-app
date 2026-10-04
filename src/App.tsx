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
import { ScoutGreenhouse, ScoutPick, ScoutSession } from './screens/Scout';
import { ActivityDetail, ActivityForm, ActivityList, ProductList } from './screens/Activities';
import { RecForm, RecList } from './screens/Recs';
import { Dashboard } from './screens/Dashboard';

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
          <Route path="scout" element={<ScoutPick />} />
          <Route path="scout/gh/:ghId" element={<ScoutGreenhouse />} />
          <Route path="scout/s/:id" element={<ScoutSession />} />
          <Route path="activities" element={<ActivityList />} />
          <Route path="activities/new" element={<ActivityForm />} />
          <Route path="activities/:id" element={<ActivityDetail />} />
          <Route path="activities/:id/edit" element={<ActivityForm />} />
          <Route path="products" element={<ProductList />} />
          <Route path="recs" element={<RecList />} />
          <Route path="recs/new" element={<RecForm />} />
          <Route path="recs/:id/edit" element={<RecForm />} />
          <Route path="dashboard" element={<Dashboard />} />
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
