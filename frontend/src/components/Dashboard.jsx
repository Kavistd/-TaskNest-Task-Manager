import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });
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
    research: theme === 'dark' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700',
    design: theme === 'dark' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-100 text-blue-700',
    in_review: theme === 'dark' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-yellow-100 text-yellow-700',
    development: theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700',
  };

  const priorityColors = {
    high: theme === 'dark' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-100 text-red-700',
    medium: theme === 'dark' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-700',
    low: theme === 'dark' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-green-100 text-green-700',
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'dark' ? 'border-indigo-400' : 'border-indigo-600'} mx-auto`}></div>
          <p className={`mt-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      <header className={`border-b backdrop-blur transition-colors duration-300 ${
        theme === 'dark' 
          ? 'border-slate-800 bg-slate-900/80' 
          : 'border-slate-200 bg-white/80 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-fuchsia-500 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-fuchsia-500/40">
              <span className="text-white font-black text-lg">TN</span>
            </div>
            <div>
              <p className={`font-semibold flex items-center gap-2 ${
                theme === 'dark' ? 'text-slate-50' : 'text-slate-900'
              }`}>
                TaskNest Board
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                  theme === 'dark' 
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                    : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                }`}>
                  Live
                </span>
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Beautiful Kanban board for your team
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <div className="hidden sm:flex items-center -space-x-2 mr-2">
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 bg-gradient-to-tr from-sky-400 to-indigo-500 text-[11px] font-semibold text-white ${
                theme === 'dark' ? 'border-slate-900' : 'border-white'
              }`}>
                {user.name.charAt(0)}
              </span>
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 bg-gradient-to-tr from-emerald-400 to-teal-500 text-[11px] font-semibold text-white ${
                theme === 'dark' ? 'border-slate-900' : 'border-white'
              }`}>
                TN
              </span>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-50' : 'text-slate-900'}`}>
                {user.name}
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className={`px-4 py-2 text-sm font-medium rounded-full transition shadow-sm ${
                theme === 'dark' 
                  ? 'text-slate-900 bg-slate-50 hover:bg-white shadow-slate-900/40' 
                  : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
              }`}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 border mb-2 ${
              theme === 'dark' 
                ? 'bg-slate-800/80 border-slate-700/60' 
                : 'bg-white/80 border-slate-200 shadow-sm'
            }`}>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className={`text-[11px] font-medium ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
              }`}>
                Now working on this board
              </span>
            </div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-slate-50' : 'text-slate-900'}`}>
              Tasks Board
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Track work across colorful stages
            </p>
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
          <div className={`rounded-2xl shadow-lg border p-5 mb-6 backdrop-blur transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-900/60 shadow-slate-900/60 border-slate-700/60' 
              : 'bg-white/90 shadow-slate-200/50 border-slate-200'
          }`}>
            <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                  Title *
                </label>
                <input
                  className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 ${
                    theme === 'dark' 
                      ? 'border-slate-600 bg-slate-900/70 text-slate-50 placeholder:text-slate-500' 
                      : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                  }`}
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Design Analysis for Marketplace by NFT"
                />
              </div>
              <div className="md:col-span-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                  Description
                </label>
                <textarea
                  className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 ${
                    theme === 'dark' 
                      ? 'border-slate-600 bg-slate-900/70 text-slate-50 placeholder:text-slate-500' 
                      : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                  }`}
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Add a short description"
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                  Priority
                </label>
                <select
                  className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 ${
                    theme === 'dark' 
                      ? 'border-slate-600 bg-slate-900/70 text-slate-50' 
                      : 'border-slate-300 bg-white text-slate-900'
                  }`}
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                  Status
                </label>
                <select
                  className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 ${
                    theme === 'dark' 
                      ? 'border-slate-600 bg-slate-900/70 text-slate-50' 
                      : 'border-slate-300 bg-white text-slate-900'
                  }`}
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                >
                  {statusColumns.map(col => (
                    <option key={col.key} value={col.key}>{col.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                  Due Date
                </label>
                <input
                  type="date"
                  className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 ${
                    theme === 'dark' 
                      ? 'border-slate-600 bg-slate-900/70 text-slate-50' 
                      : 'border-slate-300 bg-white text-slate-900'
                  }`}
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                  Cover Image (optional)
                </label>
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
                      className={`h-32 w-full object-cover rounded-lg border ${
                        theme === 'dark' ? 'border-slate-700' : 'border-slate-300'
                      }`}
                    />
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className={`px-4 py-2 rounded-full border transition ${
                    theme === 'dark' 
                      ? 'text-slate-200 bg-slate-800 hover:bg-slate-700 border-slate-600' 
                      : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300'
                  }`}
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
              className={`rounded-2xl shadow-lg border p-4 backdrop-blur transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'shadow-slate-900/40 border-slate-700/60 bg-slate-900/70' 
                  : 'shadow-slate-200/50 border-slate-200 bg-white/90'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${
                    column.key === 'research' ? 'bg-purple-500' :
                    column.key === 'design' ? 'bg-blue-500' :
                    column.key === 'in_review' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                  <p className={`font-semibold ${
                    theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    {column.label}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    theme === 'dark' 
                      ? 'bg-slate-800 text-slate-200 border-slate-600' 
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {column.items.length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowAddTask(true);
                    setTaskForm({ ...taskForm, status: column.key });
                  }}
                  className={`text-lg transition ${
                    theme === 'dark' 
                      ? 'text-slate-400 hover:text-indigo-400' 
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                  title="Add task to this column"
                >
                  ＋
                </button>
              </div>

              <div className="space-y-3">
                {column.items.length === 0 && (
                  <div className={`text-sm border border-dashed rounded-lg p-4 text-center transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'text-slate-500 border-slate-700 bg-slate-900/40' 
                      : 'text-slate-400 border-slate-300 bg-slate-50'
                  }`}>
                    No tasks here yet
                  </div>
                )}
                {column.items.map(task => (
                  <div 
                    key={task._id} 
                    className={`border rounded-lg overflow-hidden shadow-sm hover:shadow transition ${
                      theme === 'dark' 
                        ? 'border-slate-700 bg-slate-800/50' 
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {task.imageUrl && (
                      <div className={`h-32 w-full ${
                        theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
                      }`}>
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
                          <p className={`text-sm font-semibold ${
                            theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                          }`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className={`text-xs mt-1 line-clamp-2 ${
                              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              {task.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className={`transition ${
                            theme === 'dark' 
                              ? 'text-slate-400 hover:text-red-400' 
                              : 'text-slate-500 hover:text-red-600'
                          }`}
                          title="Delete task"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`text-[11px] px-2 py-1 rounded-full ${
                          priorityColors[task.priority] || (
                            theme === 'dark' 
                              ? 'bg-slate-700 text-slate-300 border border-slate-600' 
                              : 'bg-slate-100 text-slate-700'
                          )
                        }`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        <span className={`text-[11px] px-2 py-1 rounded-full ${
                          statusColors[task.status] || (
                            theme === 'dark' 
                              ? 'bg-slate-700 text-slate-300 border border-slate-600' 
                              : 'bg-slate-100 text-slate-700'
                          )
                        }`}>
                          {statusColumns.find(c => c.key === task.status)?.label || 'Status'}
                        </span>
                        {task.dueDate && (
                          <span className={`text-[11px] px-2 py-1 rounded-full ${
                            theme === 'dark' 
                              ? 'bg-slate-700 text-slate-300 border border-slate-600' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <label className={`text-xs ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          Move to
                        </label>
                        <select
                          className={`text-xs border rounded px-2 py-1 ${
                            theme === 'dark' 
                              ? 'border-slate-600 bg-slate-800 text-slate-200' 
                              : 'border-slate-300 bg-white text-slate-900'
                          }`}
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
