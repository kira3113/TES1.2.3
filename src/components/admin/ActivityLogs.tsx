import { useState } from 'react';
import { activityService } from '../../services/activityService';
import { Clock, Filter, Trash2, Download } from 'lucide-react';
import type { ActivityType } from '../../types/activity';
import { format } from 'date-fns';

export function ActivityLogs() {
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const logs = activityService.getLogs()
    .filter(log => {
      const matchesType = typeFilter === 'all' || log.type === typeFilter;
      const matchesSearch = 
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'login': return '🔑';
      case 'logout': return '👋';
      case 'create_user': return '➕';
      case 'update_user': return '✏️';
      case 'delete_user': return '🗑️';
      case 'bulk_update': return '📦';
      case 'export_users': return '📤';
      default: return '📝';
    }
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all activity logs?')) {
      activityService.clearLogs();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold">Activity Logs</h2>
          <p className="text-sm text-gray-500">Track user actions and system events</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={16} />
            Clear Logs
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
            <Download size={16} />
            Export Logs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
          <Filter className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ActivityType | 'all')}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">All Activities</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="create_user">User Creation</option>
          <option value="update_user">User Updates</option>
          <option value="delete_user">User Deletion</option>
          <option value="bulk_update">Bulk Updates</option>
          <option value="export_users">User Exports</option>
        </select>
      </div>

      {/* Logs List */}
      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="bg-white p-4 rounded-lg border hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{getActivityIcon(log.type)}</div>
              <div className="flex-1">
                <p className="font-medium">{log.description}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>{log.userEmail}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </span>
                </div>
                {log.metadata && (
                  <pre className="mt-2 p-2 bg-gray-50 rounded text-sm overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-lg font-medium text-gray-900">No activity logs found</h3>
            <p className="text-gray-500">Activity logs will appear here as users perform actions</p>
          </div>
        )}
      </div>
    </div>
  );
} 