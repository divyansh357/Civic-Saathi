import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store';
import { apiGet } from '../services/api/client';
import { PagedResponse, Worker, Complaint } from '../types';
import { AlertTriangle, HardHat, AlertCircle } from 'lucide-react';
import LiveMap from '../components/LiveMap';

export default function LiveMapPage() {
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);
  
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      // Fetch workers
      const workersRes = await apiGet<PagedResponse<Worker>>('/workers?page=0&size=500', accessToken);
      setWorkers(workersRes.content ?? []);

      // Fetch complaints
      const complaintsRes = await apiGet<PagedResponse<Complaint>>('/complaints?page=0&size=500', accessToken);
      // Only keep active complaints for the map
      const activeComplaints = (complaintsRes.content ?? []).filter(c => 
        !['CLOSED', 'RESOLVED', 'REJECTED', 'CANCELLED'].includes(c.status)
      );
      setComplaints(activeComplaints);

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Sequentially geocode complaints missing coordinates but possessing an address
  useEffect(() => {
    const needsGeocode = complaints.find(c => (!c.latitude || !c.longitude) && c.address);
    if (!needsGeocode) return;

    // Respect OpenStreetMap Nominatim 1 request/sec limit
    const timer = setTimeout(() => {
      const query = encodeURIComponent(`${needsGeocode.address}, Indore`);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setComplaints(prev => prev.map(c => 
              c.id === needsGeocode.id ? { ...c, latitude: lat, longitude: lon } : c
            ));
          } else {
            // Mark with fallback coordinates if address is unresolvable to prevent infinite retry
            setComplaints(prev => prev.map(c => 
              c.id === needsGeocode.id ? { ...c, latitude: 22.7196, longitude: 75.8577 } : c
            ));
          }
        })
        .catch(() => {
          setComplaints(prev => prev.map(c => 
            c.id === needsGeocode.id ? { ...c, latitude: 22.7196, longitude: 75.8577 } : c
          ));
        });
    }, 1200);

    return () => clearTimeout(timer);
  }, [complaints]);

  const mapWorkers = workers.filter(w => w.latitude != null && w.longitude != null);
  const mapComplaints = complaints.filter(c => c.latitude != null && c.longitude != null);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t('sidebar.livemap')}</h1>
          <p>Real-time view of field workers and active complaints across the city.</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
            <HardHat size={16} className="icon-inline" />
          </div>
          <div className="stat-value">{mapWorkers.length}</div>
          <div className="stat-label">Workers on Map</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
            <AlertCircle size={16} className="icon-inline" />
          </div>
          <div className="stat-value">{mapComplaints.length}</div>
          <div className="stat-label">Active Complaints on Map</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)' }}>
            <span className="spinner" style={{ marginRight: 8 }} /> Loading map data...
          </div>
        )}

        {error && (
          <div className="auth-error" style={{ margin: 16 }}>
            <AlertTriangle size={16} className="icon-inline" /> {error}
          </div>
        )}

        {!loading && !error && (
          <LiveMap workers={mapWorkers} complaints={mapComplaints} />
        )}
      </div>
    </div>
  );
}
