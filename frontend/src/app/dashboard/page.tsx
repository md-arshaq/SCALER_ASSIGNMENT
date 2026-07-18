'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hostedZonesAPI } from '@/lib/api';
import { HostedZone } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [totalZones, setTotalZones] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hostedZonesAPI.list({ per_page: 100 })
      .then((data) => {
        setZones(data.items);
        setTotalZones(data.total);
        setTotalRecords(data.items.reduce((sum, z) => sum + z.record_count, 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header__breadcrumb">
          <span>Route 53</span>
          <span className="page-header__breadcrumb-separator">/</span>
          <span>Dashboard</span>
        </div>
        <h1 className="page-header__title">Route 53 Dashboard</h1>
        <p className="page-header__subtitle">
          Welcome to Amazon Route 53. Manage your DNS resources from this dashboard.
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__icon">🌐</div>
          <div className="stat-card__label">Hosted zones</div>
          <div className="stat-card__value">{loading ? '—' : totalZones}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">📋</div>
          <div className="stat-card__label">DNS records</div>
          <div className="stat-card__value">{loading ? '—' : totalRecords}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">💚</div>
          <div className="stat-card__label">Health checks</div>
          <div className="stat-card__value">0</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">🔀</div>
          <div className="stat-card__label">Traffic policies</div>
          <div className="stat-card__value">0</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card__header">
          <h2 className="card__title">Quick actions</h2>
        </div>
        <div className="card__body" style={{ display: 'flex', gap: 'var(--space-m)', flexWrap: 'wrap' }}>
          <button className="btn btn--primary" onClick={() => router.push('/hosted-zones/create')}>
            Create hosted zone
          </button>
          <button className="btn btn--normal" onClick={() => router.push('/hosted-zones')}>
            View hosted zones
          </button>
        </div>
      </div>

      {/* Recent Hosted Zones */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Recent hosted zones</h2>
          <button className="btn btn--link" onClick={() => router.push('/hosted-zones')}>
            View all
          </button>
        </div>
        {loading ? (
          <div className="card__body">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ marginBottom: 'var(--space-s)' }}>
                <div className="skeleton skeleton--text" style={{ marginBottom: 'var(--space-xxs)' }} />
                <div className="skeleton skeleton--text-sm" />
              </div>
            ))}
          </div>
        ) : zones.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Domain name</th>
                  <th>Type</th>
                  <th>Record count</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody>
                {zones.slice(0, 5).map((zone) => (
                  <tr key={zone.id}>
                    <td>
                      <span className="data-table__link" onClick={() => router.push(`/hosted-zones/${zone.id}`)}>
                        {zone.name}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${zone.type === 'Public' ? 'badge--blue' : 'badge--orange'}`}>{zone.type}</span>
                    </td>
                    <td>{zone.record_count}</td>
                    <td className="truncate" style={{ maxWidth: 200 }}>{zone.comment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card__body">
            <div className="empty-state">
              <div className="empty-state__title">No hosted zones yet</div>
              <div className="empty-state__description">Create your first hosted zone to get started.</div>
              <button className="btn btn--primary" onClick={() => router.push('/hosted-zones/create')}>
                Create hosted zone
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
