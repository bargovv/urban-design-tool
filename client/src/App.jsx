import { useEffect } from 'react';
import PlanningMap from './components/PlanningMap';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Toolbar from './components/Toolbar';
import { usePlanningStore } from './store/usePlanningStore';

export default function App() {
  const loadData = usePlanningStore((state) => state.loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="app-shell">
      <Toolbar />
      <main className="layout">
        <section className="map-panel card">
          <PlanningMap />
        </section>
        <Sidebar />
        <Dashboard />
      </main>
    </div>
  );
}
