'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { hostedZonesAPI, recordsAPI, RecordListParams } from '@/lib/api';
import { HostedZone, DNSRecord, PaginatedResponse, RecordType, RoutingPolicy } from '@/lib/types';
import { useToast } from '@/context/ToastContext';

const RECORD_TYPES: RecordType[] = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA', 'SOA'];

export default function HostedZoneDetailPage() {
  const router = useRouter();
  const params = useParams();
  const zoneId = params.id as string;
  const { addToast } = useToast();

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<PaginatedResponse<DNSRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editRecord, setEditRecord] = useState<DNSRecord | null>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [showEditZoneModal, setShowEditZoneModal] = useState(false);

  // Fetch zone
  useEffect(() => {
    hostedZonesAPI.get(zoneId)
      .then(setZone)
      .catch((err) => {
        addToast({ type: 'error', title: 'Failed to load hosted zone', message: String(err) });
        router.push('/hosted-zones');
      })
      .finally(() => setLoading(false));
  }, [zoneId, addToast, router]);

  // Fetch records
  const fetchRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const params: RecordListParams = {
        search: search || undefined,
        type: typeFilter || undefined,
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      const result = await recordsAPI.list(zoneId, params);
      setRecords(result);
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to load records', message: String(err) });
    } finally {
      setRecordsLoading(false);
    }
  }, [zoneId, search, typeFilter, page, perPage, sortBy, sortOrder, addToast]);

  useEffect(() => {
    if (!loading) fetchRecords();
  }, [loading, fetchRecords]);

  useEffect(() => { setPage(1); }, [search, typeFilter]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = () => {
    if (!records) return;
    if (selected.size === records.items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(records.items.map((r) => r.id)));
    }
  };

  const handleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleDeleteRecord = async () => {
    if (!deleteRecordId) return;
    try {
      await recordsAPI.delete(deleteRecordId);
      addToast({ type: 'success', title: 'Record deleted' });
      setDeleteRecordId(null);
      setSelected(new Set());
      fetchRecords();
      // Refresh zone to update record count
      const updatedZone = await hostedZonesAPI.get(zoneId);
      setZone(updatedZone);
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to delete record', message: String(err) });
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selected) {
        await recordsAPI.delete(id);
      }
      addToast({ type: 'success', title: `Deleted ${selected.size} record(s)` });
      setSelected(new Set());
      fetchRecords();
      const updatedZone = await hostedZonesAPI.get(zoneId);
      setZone(updatedZone);
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to delete records', message: String(err) });
    }
  };

  const sortIndicator = (field: string) => {
    if (sortBy !== field) return <span className="sort-indicator">↕</span>;
    return <span className="sort-indicator sort-indicator--active">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div className="spinner spinner--lg" />
      </div>
    );
  }

  if (!zone) return null;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__breadcrumb">
          <a href="/dashboard">Route 53</a>
          <span className="page-header__breadcrumb-separator">/</span>
          <a href="/hosted-zones">Hosted zones</a>
          <span className="page-header__breadcrumb-separator">/</span>
          <span>{zone.name}</span>
        </div>
        <div className="page-header__title-row">
          <h1 className="page-header__title">{zone.name}</h1>
          <div className="page-header__actions">
            <button className="btn btn--normal" onClick={() => setShowEditZoneModal(true)} id="edit-zone-btn">
              Edit hosted zone
            </button>
          </div>
        </div>
      </div>

      {/* Zone Info Card */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card__header">
          <h2 className="card__title">Hosted zone details</h2>
        </div>
        <div className="zone-header">
          <div className="zone-header__item">
            <span className="zone-header__label">Domain name</span>
            <span className="zone-header__value">{zone.name}</span>
          </div>
          <div className="zone-header__item">
            <span className="zone-header__label">Type</span>
            <span className="zone-header__value">
              <span className={`badge ${zone.type === 'Public' ? 'badge--blue' : 'badge--orange'}`}>{zone.type}</span>
            </span>
          </div>
          <div className="zone-header__item">
            <span className="zone-header__label">Hosted zone ID</span>
            <span className="zone-header__value mono">{zone.zone_id}</span>
          </div>
          <div className="zone-header__item">
            <span className="zone-header__label">Record count</span>
            <span className="zone-header__value">{zone.record_count}</span>
          </div>
          <div className="zone-header__item">
            <span className="zone-header__label">Comment</span>
            <span className="zone-header__value">{zone.comment || '—'}</span>
          </div>
        </div>
      </div>

      {/* Records Table Card */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Records</h2>
        </div>

        {/* Table Controls */}
        <div className="table-controls">
          <div className="table-controls__left">
            <div className="search-input">
              <span className="search-input__icon">🔍</span>
              <input
                className="search-input__field"
                type="text"
                placeholder="Filter records"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="search-records"
              />
            </div>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '110px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              id="filter-record-type"
            >
              <option value="">All types</option>
              {RECORD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {typeFilter && (
              <span className="filter-tag">
                Type: {typeFilter}
                <button className="filter-tag__remove" onClick={() => setTypeFilter('')}>✕</button>
              </span>
            )}
          </div>
          <div className="table-controls__right">
            <span className="table-controls__count">
              {records ? `${records.total} record${records.total !== 1 ? 's' : ''}` : ''}
            </span>
            {selected.size > 0 && (
              <button className="btn btn--danger btn--sm" onClick={handleBulkDelete} id="bulk-delete-records">
                Delete ({selected.size})
              </button>
            )}
            <button
              className="btn btn--primary"
              onClick={() => setShowCreateModal(true)}
              id="create-record-btn"
            >
              Create record
            </button>
          </div>
        </div>

        {/* Records Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" id="records-table">
            <thead>
              <tr>
                <th className="data-table__checkbox">
                  <input
                    type="checkbox"
                    checked={records ? selected.size === records.items.length && records.items.length > 0 : false}
                    onChange={handleSelectAll}
                  />
                </th>
                <th onClick={() => handleSort('name')}>Record name {sortIndicator('name')}</th>
                <th onClick={() => handleSort('type')}>Type {sortIndicator('type')}</th>
                <th>Routing policy</th>
                <th>Value / Route traffic to</th>
                <th onClick={() => handleSort('ttl')}>TTL {sortIndicator('ttl')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recordsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="data-table__checkbox"><div className="skeleton" style={{ width: 16, height: 16 }} /></td>
                    <td><div className="skeleton skeleton--text" /></td>
                    <td><div className="skeleton" style={{ width: 50, height: 20 }} /></td>
                    <td><div className="skeleton skeleton--text-sm" /></td>
                    <td><div className="skeleton skeleton--text" /></td>
                    <td><div className="skeleton skeleton--text-sm" /></td>
                    <td></td>
                  </tr>
                ))
              ) : records && records.items.length > 0 ? (
                records.items.map((record) => (
                  <tr key={record.id} className={selected.has(record.id) ? 'data-table__row--selected' : ''}>
                    <td className="data-table__checkbox">
                      <input
                        type="checkbox"
                        checked={selected.has(record.id)}
                        onChange={() => handleSelect(record.id)}
                      />
                    </td>
                    <td>
                      <span className="mono" style={{ fontWeight: 500 }}>{record.name}</span>
                    </td>
                    <td>
                      <span className="badge badge--grey">{record.type}</span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{record.routing_policy}</td>
                    <td>
                      <div className="mono" style={{ maxWidth: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {record.value}
                      </div>
                    </td>
                    <td className="mono">{record.ttl}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-xxs)' }}>
                        <button
                          className="btn btn--link btn--sm"
                          onClick={() => setEditRecord(record)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn--link btn--sm"
                          style={{ color: 'var(--color-error)' }}
                          onClick={() => setDeleteRecordId(record.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state__icon">📋</div>
                      <div className="empty-state__title">No records found</div>
                      <div className="empty-state__description">
                        {search || typeFilter
                          ? 'No records match your filter criteria.'
                          : 'Create your first DNS record in this hosted zone.'}
                      </div>
                      {!search && !typeFilter && (
                        <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
                          Create record
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
        {records && records.pages > 1 && (
          <div className="pagination">
            <div className="pagination__info">
              <div className="pagination__page-size">
                <span>Rows per page:</span>
                <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
              <span>{(page - 1) * perPage + 1}–{Math.min(page * perPage, records.total)} of {records.total}</span>
            </div>
            <div className="pagination__controls">
              <button className="pagination__btn" disabled={page <= 1} onClick={() => setPage(1)}>««</button>
              <button className="pagination__btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
              {Array.from({ length: Math.min(records.pages, 5) }, (_, i) => {
                const startPage = Math.max(1, Math.min(page - 2, records.pages - 4));
                const p = startPage + i;
                if (p > records.pages) return null;
                return (
                  <button key={p} className={`pagination__btn ${p === page ? 'pagination__btn--active' : ''}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                );
              })}
              <button className="pagination__btn" disabled={page >= records.pages} onClick={() => setPage(page + 1)}>›</button>
              <button className="pagination__btn" disabled={page >= records.pages} onClick={() => setPage(records.pages)}>»»</button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Record Modal */}
      {(showCreateModal || editRecord) && (
        <RecordModal
          zoneId={zoneId}
          zoneName={zone.name}
          record={editRecord}
          onClose={() => { setShowCreateModal(false); setEditRecord(null); }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditRecord(null);
            fetchRecords();
            hostedZonesAPI.get(zoneId).then(setZone);
          }}
        />
      )}

      {/* Delete Record Modal */}
      {deleteRecordId && (
        <div className="modal-overlay" onClick={() => setDeleteRecordId(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Delete record</h2>
              <button className="modal__close" onClick={() => setDeleteRecordId(null)}>✕</button>
            </div>
            <div className="modal__body">
              <p>Are you sure you want to delete this DNS record? This action cannot be undone.</p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--normal" onClick={() => setDeleteRecordId(null)}>Cancel</button>
              <button className="btn btn--danger" onClick={handleDeleteRecord} id="confirm-delete-record">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Zone Modal */}
      {showEditZoneModal && (
        <EditZoneModal
          zone={zone}
          onClose={() => setShowEditZoneModal(false)}
          onSuccess={(updatedZone) => {
            setZone(updatedZone);
            setShowEditZoneModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Record Create/Edit Modal Component ──────────────────

function RecordModal({
  zoneId,
  zoneName,
  record,
  onClose,
  onSuccess,
}: {
  zoneId: string;
  zoneName: string;
  record: DNSRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { addToast } = useToast();
  const isEdit = !!record;

  const [name, setName] = useState(record?.name || '');
  const [type, setType] = useState<RecordType>(record?.type || 'A');
  const [value, setValue] = useState(record?.value || '');
  const [ttl, setTtl] = useState(record?.ttl?.toString() || '300');
  const [routingPolicy, setRoutingPolicy] = useState<RoutingPolicy>(record?.routing_policy || 'Simple');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Record name is required';
    if (!value.trim()) errs.value = 'Value is required';
    if (!ttl || isNaN(Number(ttl)) || Number(ttl) < 0) errs.ttl = 'TTL must be a non-negative number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await recordsAPI.update(record!.id, {
          name: name.trim(),
          type,
          value: value.trim(),
          ttl: Number(ttl),
          routing_policy: routingPolicy,
        });
        addToast({ type: 'success', title: 'Record updated successfully' });
      } else {
        await recordsAPI.create(zoneId, {
          name: name.trim(),
          type,
          value: value.trim(),
          ttl: Number(ttl),
          routing_policy: routingPolicy,
        });
        addToast({ type: 'success', title: 'Record created successfully' });
      }
      onSuccess();
    } catch (err) {
      addToast({
        type: 'error',
        title: `Failed to ${isEdit ? 'update' : 'create'} record`,
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeHints: Record<string, string> = {
    A: 'IPv4 address (e.g., 192.0.2.1)',
    AAAA: 'IPv6 address (e.g., 2001:db8::1)',
    CNAME: 'Canonical name (e.g., example.com.)',
    TXT: 'Text value (e.g., "v=spf1 include:_spf.google.com ~all")',
    MX: 'Priority and mail server (e.g., 10 mail.example.com.)',
    NS: 'Name server (e.g., ns-001.awsdns-01.com.)',
    PTR: 'Pointer record (e.g., host.example.com.)',
    SRV: 'Priority weight port target (e.g., 10 60 5060 sip.example.com.)',
    CAA: 'Flags tag value (e.g., 0 issue "letsencrypt.org")',
    SOA: 'SOA record value',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{isEdit ? 'Edit record' : 'Create record'}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div className="form-group">
              <label className="form-group__label form-group__label--required" htmlFor="record-name">
                Record name
              </label>
              <p className="form-group__description">
                For the hosted zone {zoneName}, enter the name of the record.
              </p>
              <input
                className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                type="text"
                id="record-name"
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                placeholder={zoneName}
              />
              {errors.name && <p className="form-group__error">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label className="form-group__label form-group__label--required" htmlFor="record-type">
                Record type
              </label>
              <select
                className="form-select"
                id="record-type"
                value={type}
                onChange={(e) => setType(e.target.value as RecordType)}
                disabled={isEdit}
              >
                {RECORD_TYPES.filter(t => t !== 'SOA').map((t) => (
                  <option key={t} value={t}>{t} — {typeHints[t]?.split('(')[0] || t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-group__label form-group__label--required" htmlFor="record-value">
                Value
              </label>
              <p className="form-group__description">
                {typeHints[type] || 'Enter the record value'}
              </p>
              <textarea
                className={`form-textarea ${errors.value ? 'form-input--error' : ''}`}
                id="record-value"
                value={value}
                onChange={(e) => { setValue(e.target.value); if (errors.value) setErrors({ ...errors, value: '' }); }}
                placeholder={typeHints[type]?.match(/\(e\.g\., (.+)\)/)?.[1] || 'Enter value'}
                rows={3}
              />
              {errors.value && <p className="form-group__error">{errors.value}</p>}
              <p className="form-group__description" style={{ marginTop: 'var(--space-xxs)' }}>
                Enter one value per line for multi-value records.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-m)' }}>
              <div className="form-group">
                <label className="form-group__label" htmlFor="record-ttl">
                  TTL (seconds)
                </label>
                <input
                  className={`form-input ${errors.ttl ? 'form-input--error' : ''}`}
                  type="number"
                  id="record-ttl"
                  value={ttl}
                  onChange={(e) => setTtl(e.target.value)}
                  min="0"
                />
                {errors.ttl && <p className="form-group__error">{errors.ttl}</p>}
              </div>

              <div className="form-group">
                <label className="form-group__label" htmlFor="routing-policy">
                  Routing policy
                </label>
                <select
                  className="form-select"
                  id="routing-policy"
                  value={routingPolicy}
                  onChange={(e) => setRoutingPolicy(e.target.value as RoutingPolicy)}
                >
                  <option value="Simple">Simple routing</option>
                  <option value="Weighted">Weighted</option>
                  <option value="Latency">Latency-based</option>
                  <option value="Failover">Failover</option>
                  <option value="Geolocation">Geolocation</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn--normal" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={isSubmitting} id="submit-record">
              {isSubmitting ? (
                <><span className="spinner spinner--sm" /> {isEdit ? 'Saving...' : 'Creating...'}</>
              ) : (
                isEdit ? 'Save changes' : 'Create record'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Zone Modal ─────────────────────────────────────

function EditZoneModal({
  zone,
  onClose,
  onSuccess,
}: {
  zone: HostedZone;
  onClose: () => void;
  onSuccess: (zone: HostedZone) => void;
}) {
  const { addToast } = useToast();
  const [comment, setComment] = useState(zone.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updated = await hostedZonesAPI.update(zone.id, { comment: comment.trim() });
      addToast({ type: 'success', title: 'Hosted zone updated' });
      onSuccess(updated);
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to update', message: String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Edit hosted zone</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div className="form-group">
              <label className="form-group__label">Domain name</label>
              <input className="form-input" type="text" value={zone.name} disabled />
            </div>
            <div className="form-group">
              <label className="form-group__label" htmlFor="edit-zone-comment">Comment</label>
              <textarea
                className="form-textarea"
                id="edit-zone-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={256}
              />
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn--normal" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={isSubmitting} id="submit-edit-zone">
              {isSubmitting ? <><span className="spinner spinner--sm" /> Saving...</> : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
