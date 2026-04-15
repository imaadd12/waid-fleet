import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';
import { Users, Truck, Clock } from 'lucide-react';
import '../styles/Dashboard.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const myEventsList = [
  {
    title: 'John Doe - Toyota Prius',
    start: new Date(new Date().setHours(8, 0, 0)),
    end: new Date(new Date().setHours(16, 0, 0)),
    type: 'Morning',
  },
  {
    title: 'Mike Johnson - Honda Civic',
    start: new Date(new Date().setHours(16, 0, 0)),
    end: new Date(new Date().setHours(23, 59, 59)),
    type: 'Night',
  },
  {
    title: 'Jane Smith - Ford Transit',
    start: new Date(new Date().setHours(12, 0, 0)),
    end: new Date(new Date().setHours(20, 0, 0)),
    type: 'Midday',
  },
];

export function Rostering() {
  const navigate = useNavigate();
  const [events, setEvents] = useState(myEventsList);

  const eventStyleGetter = (event) => {
    let backgroundColor = '#6366f1';
    if (event.type === 'Morning') backgroundColor = '#10b981';
    if (event.type === 'Night') backgroundColor = '#312e81';
    if (event.type === 'Midday') backgroundColor = '#f59e0b';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>WAID Fleet <span style={{ color: '#8b5cf6', fontSize: '1rem' }}>| Rostering</span></h1>
        </div>
        <ul className="navbar-menu">
          <li><a href="#dashboard" onClick={() => navigate('/')}>Back to Dashboard</a></li>
        </ul>
      </nav>

      <div className="main-content" style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h2>Shift Calendar</h2>
            <p style={{ color: 'var(--text-muted)' }}>Drag and drop to assign drivers to vehicles across time blocks.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}><div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }}></div> Morning</span>
             <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}><div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '50%' }}></div> Midday</span>
             <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}><div style={{ width: '12px', height: '12px', background: '#312e81', borderRadius: '50%' }}></div> Night</span>
          </div>
        </div>

        <div style={{ flex: 1, background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          {/* Specific override styles for react-big-calendar to blend into dark mode */}
          <style>
            {`
              .rbc-calendar { color: var(--text-main); font-family: 'Inter', sans-serif; }
              .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border-color: var(--border-color); }
              .rbc-header { border-bottom-color: var(--border-color); padding: 0.5rem; font-weight: 500; }
              .rbc-month-row, .rbc-day-bg { border-color: var(--border-color); }
              .rbc-off-range-bg { background: rgba(0,0,0,0.2); }
              .rbc-today { background: rgba(99, 102, 241, 0.1); }
              .rbc-time-content { border-top-color: var(--border-color); }
              .rbc-timeslot-group { border-bottom-color: var(--border-color); }
              .rbc-day-slot .rbc-time-slot { border-top-color: rgba(255,255,255,0.05); }
              .rbc-btn-group button { color: var(--text-main); border-color: var(--border-color); background: var(--bg-color); }
              .rbc-btn-group button.rbc-active { background: var(--primary-color); color: white; border-color: var(--primary-color); }
              .rbc-btn-group button:hover { background: rgba(99, 102, 241, 0.2); }
              .rbc-toolbar button { padding: 0.5rem 1rem; border-radius: 6px; }
            `}
          </style>

          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            eventPropGetter={eventStyleGetter}
            defaultView="week"
            views={['month', 'week', 'day']}
          />
        </div>
      </div>
    </div>
  );
}
