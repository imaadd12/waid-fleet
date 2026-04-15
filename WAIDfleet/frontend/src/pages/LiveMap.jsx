import React, { useState, useEffect, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { Focus, Navigation } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import '../styles/Dashboard.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;

const enRouteIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export function LiveMap() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    fetchActiveDrivers();
    const interval = setInterval(() => {
      fetchActiveDrivers();
    }, 10000); // Polling every 10 seconds

    return () => clearInterval(interval);
  }, [token]);

  const fetchActiveDrivers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/drivers/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const mapped = data.data.map(d => ({
          id: d._id,
          driver: d.name,
          phone: d.phone,
          status: 'En Route',
          lat: d.currentLocation?.lat || (40.7128 + (Math.random() - 0.5) * 0.1), // Fallback fuzzing for demo
          lng: d.currentLocation?.lng || (-74.0060 + (Math.random() - 0.5) * 0.1),
          icon: enRouteIcon
        }));
        setVehicles(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch active drivers:', err);
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>WAID Fleet <span style={{ color: '#8b5cf6', fontSize: '1rem' }}>| Live Telematics</span></h1>
        </div>
        <ul className="navbar-menu">
          <li><a href="#dashboard" onClick={() => navigate('/admin')}>Back to Admin Panel</a></li>
        </ul>
      </nav>

      <div className="main-content" style={{ display: 'flex', flexDirection: 'row', height: 'calc(100vh - 70px)' }}>
        {/* Sidebar */}
        <div style={{ width: '350px', background: 'var(--card-bg)', borderRight: '1px solid var(--border-color)', padding: '1.5rem', overflowY: 'auto' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <Focus className="text-primary" /> Active Drivers Matrix
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {vehicles.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No drivers currently on duty.</p>
            ) : null}

            {vehicles.map(v => (
              <div key={v.id} style={{
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(15, 23, 42, 0.3)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{v.driver}</span>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    padding: '2px 8px', 
                    borderRadius: '12px',
                    backgroundColor: '#dcfce7',
                    color: '#166534'
                  }}>Active</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {v.phone}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Navigation size={14} color="#10b981" /> Last ping: Just now
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Area */}
        <div style={{ flex: 1, position: 'relative' }}>
          <MapContainer center={[40.7306, -73.9942]} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {vehicles.map(v => (
              <Marker key={v.id} position={[v.lat, v.lng]} icon={v.icon}>
                <Popup>
                  <strong>{v.driver}</strong><br/>
                  {v.phone} <br/>
                  Status: Active
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
