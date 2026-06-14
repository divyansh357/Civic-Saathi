import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Worker, Complaint } from '../types';

interface LiveMapProps {
  workers: Worker[];
  complaints: Complaint[];
}

// Custom icons using HTML
const createWorkerIcon = (worker: Worker) => {
  const initial = worker.name?.charAt(0) || 'W';
  
  // A worker is live if they are ACTIVE and have pinged their location in the last 15 minutes
  let isLive = false;
  if (worker.status === 'ACTIVE' && worker.lastActiveAt) {
    const lastActive = new Date(worker.lastActiveAt).getTime();
    const now = new Date().getTime();
    if (now - lastActive < 15 * 60 * 1000) { // 15 mins
      isLive = true;
    }
  }

  const color = isLive ? 'var(--blue)' : 'var(--text-3)';
  
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        ${initial}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const createComplaintIcon = (complaint: Complaint) => {
  let color = 'var(--red)';
  if (complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') color = 'var(--green)';
  else if (complaint.status === 'IN_PROGRESS' || complaint.status === 'ASSIGNED') color = 'var(--yellow)';

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 4px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        !
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};


export default function LiveMap({ workers, complaints }: LiveMapProps) {
  // Indore coordinates as default center
  const defaultCenter: [number, number] = [22.7196, 75.8577];
  
  // Combine all coordinates to check for overlaps
  const coordCounts = new Map<string, number>();
  
  const processJitter = <T extends { latitude?: number; longitude?: number }>(item: T): T => {
    if (!item.latitude || !item.longitude) return item;
    // Group items within roughly 11 meters
    const key = `${item.latitude.toFixed(4)}_${item.longitude.toFixed(4)}`;
    const count = coordCounts.get(key) || 0;
    coordCounts.set(key, count + 1);
    
    if (count > 0) {
      // Create a small spiral separation for overlapping markers
      const angle = count * 1.5;
      const radius = 0.0002 * Math.sqrt(count); // ~22m separation per unit
      return {
        ...item,
        latitude: item.latitude + Math.sin(angle) * radius,
        longitude: item.longitude + Math.cos(angle) * radius
      };
    }
    return item;
  };

  const mapWorkers = workers.filter(w => w.latitude && w.longitude).map(processJitter);
  const mapComplaints = complaints.filter(c => c.latitude && c.longitude).map(processJitter);
  
  const center = mapWorkers.length > 0 
    ? [mapWorkers[0].latitude!, mapWorkers[0].longitude!] as [number, number]
    : mapComplaints.length > 0
    ? [mapComplaints[0].latitude!, mapComplaints[0].longitude!] as [number, number]
    : defaultCenter;

  return (
    <div style={{ height: 'calc(100vh - 120px)', width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', zIndex: 0 }}>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render Workers */}
        {mapWorkers.map((worker) => (
          <Marker 
            key={`worker-${worker.id}`} 
            position={[worker.latitude!, worker.longitude!]}
            icon={createWorkerIcon(worker)}
            zIndexOffset={100} // Keep workers on top
          >
            <Popup>
              <div style={{ minWidth: 200, fontFamily: 'var(--font)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: (() => {
                    let isLive = false;
                    if (worker.status === 'ACTIVE' && worker.lastActiveAt) {
                      const lastActive = new Date(worker.lastActiveAt).getTime();
                      if (new Date().getTime() - lastActive < 15 * 60 * 1000) isLive = true;
                    }
                    return isLive ? 'var(--blue)' : 'var(--text-3)';
                  })(), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {worker.name?.charAt(0) || 'W'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: 14 }}>{worker.name || 'Unnamed Worker'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{worker.designation || 'Field Worker'}</div>
                  </div>
                </div>
                
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  <strong>Dept:</strong> {worker.departmentName || '—'}
                </div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  <strong>Status:</strong> {(() => {
                    let isLive = false;
                    if (worker.status === 'ACTIVE' && worker.lastActiveAt) {
                      const lastActive = new Date(worker.lastActiveAt).getTime();
                      if (new Date().getTime() - lastActive < 15 * 60 * 1000) isLive = true;
                    }
                    return <span style={{ color: isLive ? 'var(--green)' : 'var(--red)' }}>{isLive ? 'ONLINE (LIVE)' : 'OFFLINE'}</span>;
                  })()}
                </div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  <strong>Assigned Tasks:</strong> {worker.complaintsAssigned ?? 0}
                </div>
                {worker.lastActiveAt && (
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
                    Last Active: {new Date(worker.lastActiveAt).toLocaleString()}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Complaints */}
        {mapComplaints.map((complaint) => (
          <Marker 
            key={`complaint-${complaint.id}`} 
            position={[complaint.latitude!, complaint.longitude!]}
            icon={createComplaintIcon(complaint)}
          >
            <Popup>
              <div style={{ minWidth: 200, fontFamily: 'var(--font)' }}>
                <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                  {complaint.complaintNumber || 'Complaint'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
                  {complaint.title}
                </div>
                
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  <strong>Status:</strong> {complaint.status}
                </div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  <strong>Dept:</strong> {complaint.departmentName || '—'}
                </div>
                {complaint.assignedWorkerName && (
                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    <strong>Worker:</strong> {complaint.assignedWorkerName}
                  </div>
                )}
                {complaint.address && (
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
                    📍 {complaint.address}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
}
