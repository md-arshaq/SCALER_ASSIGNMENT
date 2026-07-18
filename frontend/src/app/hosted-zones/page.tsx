'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { hostedZonesAPI, HostedZoneListParams } from '@/lib/api';
import { HostedZone, PaginatedResponse } from '@/lib/types';
import { useToast } from '@/context/ToastContext';

export default function HostedZonesPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [data, setData] = useState<PaginatedResponse<HostedZone> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const params: HostedZoneListParams = {
        search: search || undefined,
        type: typeFilter || undefined,
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      const result = await hostedZonesAPI.list(params);
      setData(result);
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to load hosted zones', message: String(err) });
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, page, perPage, sortBy, sortOrder, addToast]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = () => {
    if (!data) return;
    if (selected.size === data.items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.items.map((z) => z.id)));
    }
  };

  const handleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const handleDelete = async () => {
    if (!deleteModalId) return;
    setDeleting(true);
    try {
      await hostedZonesAPI.delete(deleteModalId);
      addToast({ type: 'success', title: 'Hosted zone deleted successfully' });
      setDeleteModalId(null);
      setSelected(new Set());
      fetchZones();
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to delete hosted zone', message: String(err) });
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      for (const id of selected) {
        await hostedZonesAPI.delete(id);
      }
      addToast({ type: 'success', title: `Deleted ${selected.size} hosted zone(s)` });
      setSelected(new Set());
      fetchZones();
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to delete hosted zones', message: String(err) });
    } finally {
      setDeleting(false);
    }
  };

  const sortIndicator = (field: string) => {
    if (sortBy !== field) return <span className="sort-indicator">↕</span>;
    return (
      <span className="sort-indicator sort-indicator--active">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__breadcrumb">
          <a href="/dashboard">Route 53</a>
          <span className="page-header__breadcrumb-separator">/</span>
          <span>Hosted zones</span>
        </div>
        <div className="page-header__title-row">
          <div>
            <h1 className="page-header__title">Hosted zones</h1>
            <p className="page-header__subtitle">
              A hosted zone is a container for records, and records contain information about how you want to route traffic for a specific domain.
            </p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="card">
        {/* Table Controls */}
        <div className="table-controls">
          <div className="table-controls__left">
            <div className="search-input">
              <span className="search-input__icon">🔍</span>
              <input
                className="search-input__field"
                type="text"
                placeholder="Find hosted zones"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="search-hosted-zones"
              />
            </div>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '120px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              id="filter-zone-type"
            >
              <option value="">All types</option>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
            {typeFilter && (
              <span className="filter-tag">
                Type: {typeFilter}
                <button
                  className="filter-tag__remove"
                  onClick={() => setTypeFilter('')}
                  aria-label="Remove filter"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
          <div className="table-controls__right">
            <span className="table-controls__count">
              {data ? `${data.total} hosted zone${data.total !== 1 ? 's' : ''}` : ''}
            </span>
            {selected.size > 0 && (
              <button
                className="btn btn--danger btn--sm"
                onClick={handleBulkDelete}
                disabled={deleting}
                id="bulk-delete-btn"
              >
                Delete ({selected.size})
              </button>
            )}
            <button
              className="btn btn--primary"
              onClick={() => router.push('/hosted-zones/create')}
              id="create-hosted-zone-btn"
            >
              Create hosted zone
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" id="hosted-zones-table">
            <thead>
              <tr>
                <th className="data-table__checkbox">
                  <input
                    type="checkbox"
                    checked={data ? selected.size === data.items.length && data.items.length > 0 : false}
                    onChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th onClick={() => handleSort('name')}>
                  Domain name {sortIndicator('name')}
                </th>
                <th onClick={() => handleSort('type')}>
                  Type {sortIndicator('type')}
                </th>
                <th onClick={() => handleSort('record_count')}>
                  Record count {sortIndicator('record_count')}
                </th>
                <th>Comment</th>
                <th onClick={() => handleSort('created_at')}>
                  Created {sortIndicator('created_at')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="data-table__checkbox"><div className="skeleton" style={{ width: 16, height: 16 }} /></td>
                    <td><div className="skeleton skeleton--text" /></td>
                    <td><div className="skeleton" style={{ width: 60, height: 20 }} /></td>
                    <td><div className="skeleton skeleton--text-sm" /></td>
                    <td><div className="skeleton skeleton--text" /></td>
                    <td><div className="skeleton skeleton--text-sm" /></td>
                    <td></td>
                  </tr>
                ))
              ) : data && data.items.length > 0 ? (
                data.items.map((zone) => (
                  <tr
                    key={zone.id}
                    className={selected.has(zone.id) ? 'data-table__row--selected' : ''}
                  >
                    <td className="data-table__checkbox">
                      <input
                        type="checkbox"
                        checked={selected.has(zone.id)}
                        onChange={() => handleSelect(zone.id)}
                        aria-label={`Select ${zone.name}`}
                      />
                    </td>
                    <td>
                      <span
                        className="data-table__link"
                        onClick={() => router.push(`/hosted-zones/${zone.id}`)}
                      >
                        {zone.name}
                      </span>
                      <br />
                      <span className="mono" style={{ color: 'var(--color-text-tertiary)' }}>
                        {zone.zone_id}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${zone.type === 'Public' ? 'badge--blue' : 'badge--orange'}`}>
                        {zone.type}
                      </span>
                    </td>
                    <td>{zone.record_count}</td>
                    <td className="truncate" style={{ maxWidth: 200 }}>
                      {zone.comment || '—'}
                    </td>
                    <td>{formatDate(zone.created_at)}</td>
                    <td>
                      <button
                        className="btn btn--link btn--sm"
                        onClick={() => setDeleteModalId(zone.id)}
                        style={{ color: 'var(--color-error)' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state__icon">🌐</div>
                      <div className="empty-state__title">No hosted zones</div>
                      <div className="empty-state__description">
                        {search || typeFilter
                          ? 'No hosted zones match your search criteria.'
                          : 'Get started by creating your first hosted zone.'}
                      </div>
                      {!search && !typeFilter && (
                        <button
                          className="btn btn--primary"
                          onClick={() => router.push('/hosted-zones/create')}
                        >
                          Create hosted zone
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="pagination">
            <div className="pagination__info">
              <div className="pagination__page-size">
                <span>Rows per page:</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
              <span>
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, data.total)} of {data.total}
              </span>
            </div>
            <div className="pagination__controls">
              <button
                className="pagination__btn"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                aria-label="First page"
              >
                ««
              </button>
              <button
                className="pagination__btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                aria-label="Previous page"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(data.pages, 5) }, (_, i) => {
                const startPage = Math.max(1, Math.min(page - 2, data.pages - 4));
                const p = startPage + i;
                if (p > data.pages) return null;
                return (
                  <button
                    key={p}
                    className={`pagination__btn ${p === page ? 'pagination__btn--active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                className="pagination__btn"
                disabled={page >= data.pages}
                onClick={() => setPage(page + 1)}
                aria-label="Next page"
              >
                ›
              </button>
              <button
                className="pagination__btn"
                disabled={page >= data.pages}
                onClick={() => setPage(data.pages)}
                aria-label="Last page"
              >
                »»
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModalId && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteModalId(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Delete hosted zone</h2>
              <button
                className="modal__close"
                onClick={() => setDeleteModalId(null)}
                disabled={deleting}
              >
                ✕
              </button>
            </div>
            <div className="modal__body">
              <p>Are you sure you want to delete this hosted zone? This action cannot be undone.</p>
              <p style={{ marginTop: 'var(--space-s)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                All DNS records within this hosted zone will also be permanently deleted.
              </p>
            </div>
            <div className="modal__footer">
              <button
                className="btn btn--normal"
                onClick={() => setDeleteModalId(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn--danger"
                onClick={handleDelete}
                disabled={deleting}
                id="confirm-delete-btn"
              >
                {deleting ? <><span className="spinner spinner--sm" /> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
