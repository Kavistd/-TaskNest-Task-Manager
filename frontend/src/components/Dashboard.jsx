import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const navigate = useNavigate();

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'research',
    dueDate: '',
    imageUrl: ''
  });

  const API_BASE = 'http://localhost:5000/api';

  const statusColumns = useMemo(() => ([
    { key: 'research', label: 'Research' },
    { key: 'design', label: 'Design' },
    { key: 'in_review', label: 'In Review' },
    { key: 'development', label: 'Development' },
  ]), []);

  const statusColors = {
    research: 'bg-purple-100 text-purple-700',
    design: 'bg-blue-100 text-blue-700',
    in_review: 'bg-yellow-100 text-yellow-700',
    development: 'bg-emerald-100 text-emerald-700',
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'x-auth-token': token
    };
  };

  const fetchUser = async () => {
    const response = await fetch(`${API_BASE}/users/me`, { headers: getAuthHeaders() });
    if (!response.ok) {
      localStorage.removeItem('token');
      navigate('/login');
      return;
    }
    setUser(await response.json());
  };

  const fetchTasks = async () => {
    const response = await fetch(`${API_BASE}/tasks`, { headers: getAuthHeaders() });
    if (!response.ok) return;
    setTasks(await response.json());
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const load = async () => {
      setLoading(true);
      await fetchUser();
      await fetchTasks();
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        status: taskForm.status,
        imageUrl: taskForm.imageUrl,
        dueDate: taskForm.dueDate || null
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.msg || 'Failed to create task');
      return;
    }
    const newTask = await response.json();
    setTasks([newTask, ...tasks]);
    setTaskForm({ title: '', description: '', priority: 'medium', status: 'research', dueDate: '', imageUrl: '' });
    setShowAddTask(false);
  };

  const handleUpdateTask = async (taskId, updates) => {
    const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.msg || 'Failed to update task');
      return;
    }
    const updatedTask = await response.json();
    setTasks(tasks.map(t => t._id === taskId ? updatedTask : t));
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTaskForm((prev) => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.msg || 'Failed to delete task');
      return;
    }
    setTasks(tasks.filter(t => t._id !== taskId));
  };

  const groupByStatus = statusColumns.map(col => ({
    ...col,
    items: tasks.filter(t => t.status === col.key)
  }));

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-fuchsia-500 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-fuchsia-500/40">
              <span className="text-white font-black text-lg">TN</span>
            </div>
            <div>
              <p className="font-semibold text-slate-50 flex items-center gap-2">
                TaskNest Board
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
                  Live
                </span>
              </p>
              <p className="text-xs text-slate-400">Beautiful Kanban board for your team</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center -space-x-2 mr-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-900 bg-gradient-to-tr from-sky-400 to-indigo-500 text-[11px] font-semibold text-white">
                {user.name.charAt(0)}
              </span>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-900 bg-gradient-to-tr from-emerald-400 to-teal-500 text-[11px] font-semibold text-white">
                TN
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-50">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-slate-900 bg-slate-50 rounded-full hover:bg-white shadow-sm shadow-slate-900/40 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1 border border-slate-700/60 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-slate-200">Now working on this board</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-50">Tasks Board</h1>
            <p className="text-sm text-slate-400">Track work across colorful stages</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-sky-400 text-white rounded-full hover:shadow-lg hover:shadow-fuchsia-500/30 transition shadow-md"
            >
              <span className="mr-2 text-lg">＋</span>
              New Task
            </button>
          </div>
        </div>

        {showAddTask && (
          <div className="bg-slate-900/60 rounded-2xl shadow-lg shadow-slate-900/60 border border-slate-700/60 p-5 mb-6 backdrop-blur">
            <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-200">Title *</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/70 text-slate-50 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 placeholder:text-slate-500"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Design Analysis for Marketplace by NFT"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-200">Description</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/70 text-slate-50 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 placeholder:text-slate-500"
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Add a short description"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-200">Priority</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/70 text-slate-50 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-200">Status</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/70 text-slate-50 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                >
                  {statusColumns.map(col => (
                    <option key={col.key} value={col.key}>{col.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-200">Due Date</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/70 text-slate-50 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-200">Cover Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 w-full"
                  onChange={(e) => handleImageSelect(e.target.files?.[0])}
                />
                {taskForm.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={taskForm.imageUrl}
                      alt="Preview"
                      className="h-32 w-full object-cover rounded-lg border border-slate-700"
                    />
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 text-slate-200 bg-slate-800 rounded-full hover:bg-slate-700 border border-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-sky-400 text-white rounded-full hover:shadow-lg hover:shadow-fuchsia-500/40 shadow-md"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {groupByStatus.map((column) => (
            <div
              key={column.key}
              className="rounded-2xl shadow-lg shadow-slate-900/40 border border-slate-700/60 p-4 bg-slate-900/70 backdrop-blur"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${
                    column.key === 'research' ? 'bg-purple-500' :
                    column.key === 'design' ? 'bg-blue-500' :
                    column.key === 'in_review' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                  <p className="font-semibold text-slate-100">{column.label}</p>
                  <span className="text-xs bg-slate-800 text-slate-200 px-2 py-1 rounded-full border border-slate-600">
                    {column.items.length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowAddTask(true);
                    setTaskForm({ ...taskForm, status: column.key });
                  }}
                  className="text-slate-400 hover:text-indigo-400 text-lg"
                  title="Add task to this column"
                >
                  ＋
                </button>
              </div>

              <div className="space-y-3">
                {column.items.length === 0 && (
                  <div className="text-sm text-slate-500 border border-dashed border-slate-700 rounded-lg p-4 text-center bg-slate-900/40">
                    No tasks here yet
                  </div>
                )}
                {column.items.map(task => (
                  <div key={task._id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow transition">
                    {task.imageUrl && (
                      <div className="h-32 w-full bg-slate-100">
                        <img
                          src={task.imageUrl}
                          alt={task.title}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-slate-400 hover:text-red-500"
                          title="Delete task"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`text-[11px] px-2 py-1 rounded-full ${priorityColors[task.priority] || 'bg-slate-100 text-slate-700'}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        <span className={`text-[11px] px-2 py-1 rounded-full ${statusColors[task.status] || 'bg-slate-100 text-slate-700'}`}>
                          {statusColumns.find(c => c.key === task.status)?.label || 'Status'}
                        </span>
                        {task.dueDate && (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <label className="text-xs text-slate-500">Move to</label>
                        <select
                          className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                          value={task.status}
                          onChange={(e) => handleUpdateTask(task._id, { status: e.target.value })}
                        >
                          {statusColumns.map(col => (
                            <option key={col.key} value={col.key}>{col.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
