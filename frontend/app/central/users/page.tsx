'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getSession, CivisSession } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface UserRecord {
  id: number;
  employee_id: string;
  name: string;
  role: 'CENTRAL_ADMIN' | 'MONITORING_OFFICER' | 'INSPECTOR';
  region: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  last_login: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  CENTRAL_ADMIN: 'Central Authority',
  MONITORING_OFFICER: 'Monitoring Officer',
  INSPECTOR: 'Field Inspector',
};

const ROLE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  CENTRAL_ADMIN: {
    bg: '#EAF4EF',
    color: '#31785B',
    border: '#B5DCC8',
  },
  MONITORING_OFFICER: {
    bg: '#E3F2F0',
    color: '#287D79',
    border: '#A8DCD8',
  },
  INSPECTOR: {
    bg: '#FDF3E3',
    color: '#B77928',
    border: '#E8D5A3',
  },
};

export default function CentralUsersPage() {
  const [session, setSession] = useState<CivisSession | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const s = getSession();
    setSession(s);

    if (s && s.role === 'CENTRAL_ADMIN') {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAllUsers();
      setUsers(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve user accounts.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(userId: number, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser || targetUser.status === newStatus) return;

    const previousStatus = targetUser.status;
    setUpdatingId(userId);
    setFeedback(null);

    // Optimistic local update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );

    try {
      await api.updateUserStatus(userId, newStatus);
      setFeedback({
        type: 'success',
        text: `Status for ${targetUser.name} (${targetUser.employee_id}) updated to ${newStatus}.`,
      });
    } catch (err: any) {
      // Revert upon failure
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: previousStatus } : u))
      );
      setFeedback({
        type: 'error',
        text: err?.message || `Failed to update status for ${targetUser.employee_id}.`,
      });
    } finally {
      setUpdatingId(null);
    }
  }

  // Guard: CENTRAL_ADMIN only
  if (!loading && (!session || session.role !== 'CENTRAL_ADMIN')) {
    return (
      <AppLayout>
        <div
          className="card"
          style={{
            maxWidth: 580,
            margin: '40px auto',
            padding: '32px 28px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#B54747',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}
          >
            403 Forbidden
          </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--c-navy)',
              marginBottom: 8,
            }}
          >
            Access Denied
          </h2>
          <p
            style={{
              fontSize: 13,
              color: 'var(--c-text2)',
              lineHeight: '20px',
              marginBottom: 24,
            }}
          >
            User account administration is strictly reserved for Central Authority administrators.
            Your current session ({session?.name || 'User'}, role:{' '}
            <strong className="mono" style={{ color: 'var(--c-text)' }}>
              {session?.role || 'None'}
            </strong>
            ) is not permitted to access this module.
          </p>
          <Link
            href="/"
            className="btn btn-primary"
            style={{ display: 'inline-flex', margin: '0 auto' }}
          >
            Return to Dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Role count stats
  const centralCount = users.filter((u) => u.role === 'CENTRAL_ADMIN').length;
  const moCount = users.filter((u) => u.role === 'MONITORING_OFFICER').length;
  const inspectorCount = users.filter((u) => u.role === 'INSPECTOR').length;

  // Filter users
  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter && u.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchEmp = u.employee_id.toLowerCase().includes(q);
    const matchName = u.name.toLowerCase().includes(q);
    const matchRegion = (u.region || '').toLowerCase().includes(q);
    return matchEmp || matchName || matchRegion;
  });

  return (
    <AppLayout>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">User Account Administration</h1>
        <p className="page-subtitle">
          Manage system access, employee roles, regional jurisdiction, and account activation states
        </p>
      </div>

      {/* Role Summary Badges */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <span className="section-label" style={{ marginRight: 2 }}>
          Roles:
        </span>
        {[
          { key: '', label: 'All Users', count: users.length },
          { key: 'CENTRAL_ADMIN', label: 'Central Authority', count: centralCount },
          { key: 'MONITORING_OFFICER', label: 'Monitoring Officers', count: moCount },
          { key: 'INSPECTOR', label: 'Field Inspectors', count: inspectorCount },
        ].map((item) => {
          const isActive = roleFilter === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setRoleFilter(item.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 4,
                background: isActive ? 'var(--c-surface2)' : 'var(--c-surface)',
                border: `1px solid ${isActive ? 'var(--c-teal)' : 'var(--c-border)'}`,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--c-teal)' : 'var(--c-text)',
                transition: 'background 0.12s, border-color 0.12s',
              }}
            >
              <span>{item.label}</span>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  padding: '1px 5px',
                  borderRadius: 3,
                  background: isActive ? 'rgba(40,125,121,0.15)' : 'var(--c-surface2)',
                  color: isActive ? 'var(--c-teal)' : 'var(--c-text2)',
                }}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="label">Search User</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, employee ID, region..."
            className="input"
            style={{ minWidth: 260 }}
          />
        </div>

        <div className="filter-group">
          <label className="label">Filter By Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input"
            style={{ minWidth: 180 }}
          >
            <option value="">All Roles</option>
            <option value="CENTRAL">Central Authority</option>
            <option value="MONITORING_OFFICER">Monitoring Officer</option>
            <option value="INSPECTOR">Field Inspector</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="label">Filter By Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
            style={{ minWidth: 150 }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {(search || roleFilter || statusFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setRoleFilter('');
              setStatusFilter('');
            }}
            className="btn btn-ghost btn-sm"
            style={{ height: 33, alignSelf: 'flex-end' }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 4,
            fontSize: 12,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: feedback.type === 'error' ? '#FDEAEA' : '#EAF4EF',
            color: feedback.type === 'error' ? '#B54747' : '#31785B',
            border: `1px solid ${feedback.type === 'error' ? '#DCE2E3' : '#B5DCC8'}`,
          }}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="btn btn-ghost btn-sm"
            style={{
              padding: '2px 6px',
              fontSize: 11,
              color: 'inherit',
              border: 'none',
              background: 'transparent',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 4,
            backgroundColor: '#FDEAEA',
            border: '1px solid #DCE2E3',
            color: '#B54747',
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* Main Users Table */}
      {loading ? (
        <LoadingSpinner rows={8} label="Loading system user accounts..." />
      ) : users.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontWeight: 500, color: 'var(--c-navy)', marginBottom: 4 }}>
              No users registered
            </p>
            <p style={{ fontSize: 12, color: 'var(--c-text2)' }}>
              No user accounts found in the database.
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontWeight: 500, color: 'var(--c-navy)', marginBottom: 4 }}>
              No matching user accounts
            </p>
            <p style={{ fontSize: 12, color: 'var(--c-text2)', marginBottom: 12 }}>
              No records match your selected filters.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setRoleFilter('');
                setStatusFilter('');
              }}
              className="btn btn-ghost btn-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Region</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right', minWidth: 160 }}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const roleBadge = ROLE_COLORS[user.role] || {
                  bg: 'var(--c-surface2)',
                  color: 'var(--c-text)',
                  border: 'var(--c-border)',
                };
                const isCurrentSessionUser = session?.employee_id === user.employee_id;
                const isUpdating = updatingId === user.id;

                return (
                  <tr key={user.id}>
                    {/* Employee ID */}
                    <td className="mono" style={{ fontWeight: 600, color: 'var(--c-navy)' }}>
                      {user.employee_id}
                      {isCurrentSessionUser && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 10,
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: 'var(--c-surface2)',
                            color: 'var(--c-text2)',
                            fontWeight: 400,
                          }}
                        >
                          You
                        </span>
                      )}
                    </td>

                    {/* Name */}
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--c-navy)', fontSize: 13 }}>
                        {user.name}
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <span
                        style={{
                          backgroundColor: roleBadge.bg,
                          color: roleBadge.color,
                          border: `1px solid ${roleBadge.border}`,
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 3,
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}
                      >
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>

                    {/* Region */}
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--c-text)' }}>
                        {user.region || 'National (All)'}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={user.status} />
                    </td>

                    {/* Last Login */}
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--c-text2)' }}>
                        {formatDateTime(user.last_login)}
                      </div>
                    </td>

                    {/* Status Toggle Control */}
                    <td style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <select
                          value={user.status}
                          disabled={isUpdating}
                          onChange={(e) =>
                            handleStatusChange(
                              user.id,
                              e.target.value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
                            )
                          }
                          className="input"
                          style={{
                            padding: '3px 8px',
                            fontSize: 11,
                            height: 28,
                            width: 120,
                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                        {isUpdating && (
                          <span
                            className="mono"
                            style={{ fontSize: 10, color: 'var(--c-text2)' }}
                          >
                            ...
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
