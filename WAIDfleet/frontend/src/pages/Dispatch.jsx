import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Search } from 'lucide-react';
import '../styles/Dashboard.css';

const initialData = {
  tasks: {
    'task-1': { id: 'task-1', content: 'Trip to Airport', driver: 'Unassigned', price: '$45', eta: '10 mins' },
    'task-2': { id: 'task-2', content: 'Downtown Pickup', driver: 'John Doe', price: '$22', eta: '5 mins' },
    'task-3': { id: 'task-3', content: 'Package Delivery', driver: 'Jane Smith', price: '$15', eta: '15 mins' },
    'task-4': { id: 'task-4', content: 'VIP Transport', driver: 'Mike Johnson', price: '$120', eta: '2 mins' },
    'task-5': { id: 'task-5', content: 'Station Transfer', driver: 'Sarah Wilson', price: '$35', eta: '8 mins' },
  },
  columns: {
    'column-1': {
      id: 'column-1',
      title: 'Unassigned',
      taskIds: ['task-1'],
    },
    'column-2': {
      id: 'column-2',
      title: 'En Route',
      taskIds: ['task-2', 'task-3', 'task-5'],
    },
    'column-3': {
      id: 'column-3',
      title: 'Completed',
      taskIds: ['task-4'],
    },
  },
  columnOrder: ['column-1', 'column-2', 'column-3'],
};

export function Dispatch() {
  const navigate = useNavigate();
  const [data, setData] = useState(initialData);

  const onDragEnd = result => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...start, taskIds: newTaskIds };
      setData({ ...data, columns: { ...data.columns, [newColumn.id]: newColumn } });
      return;
    }

    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...start, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finish, taskIds: finishTaskIds };

    setData({
      ...data,
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    });
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>WAID Fleet <span style={{ color: '#8b5cf6', fontSize: '1rem' }}>| Dispatch Center</span></h1>
        </div>
        <ul className="navbar-menu">
          <li><a href="#dashboard" onClick={() => navigate('/')}>Back to Dashboard</a></li>
        </ul>
      </nav>

      <div className="main-content" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h2>Live Dispatch Board</h2>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Search size={18}/> New Trip</button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            {data.columnOrder.map(columnId => {
              const column = data.columns[columnId];
              const tasks = column.taskIds.map(taskId => data.tasks[taskId]);

              return (
                <div key={column.id} style={{
                  flex: 1,
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  backdropFilter: 'blur(8px)',
                  minHeight: '400px'
                }}>
                  <h3 style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{column.title} ({tasks.length})</h3>
                  
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{ minHeight: '100px' }}
                      >
                        {tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  background: 'var(--card-bg)',
                                  padding: '1rem',
                                  marginBottom: '0.75rem',
                                  borderRadius: '8px',
                                  boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                                  border: '1px solid var(--border-color)',
                                  transform: snapshot.isDragging ? `${provided.draggableProps.style.transform} scale(1.02)` : provided.draggableProps.style.transform
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                  <strong style={{ color: 'var(--primary-color)' }}>{task.content}</strong>
                                  <span style={{ fontWeight: '600', color: '#10b981' }}>{task.price}</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Driver: {task.driver}</div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                                  <Clock size={12} /> ETA: {task.eta}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
