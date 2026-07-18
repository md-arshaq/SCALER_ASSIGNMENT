'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { hostedZonesAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function CreateHostedZonePage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState<'Public' | 'Private'>('Public');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Domain name is required';
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\.?$/.test(name.trim())) {
      errs.name = 'Enter a valid domain name (e.g., example.com)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const zone = await hostedZonesAPI.create({
        name: name.trim(),
        type,
        comment: comment.trim(),
      });
      addToast({
        type: 'success',
        title: 'Hosted zone created',
        message: `${zone.name} has been created with ${zone.record_count} default records.`,
      });
      router.push(`/hosted-zones/${zone.id}`);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to create hosted zone',
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header__breadcrumb">
          <a href="/dashboard">Route 53</a>
          <span className="page-header__breadcrumb-separator">/</span>
          <a href="/hosted-zones">Hosted zones</a>
          <span className="page-header__breadcrumb-separator">/</span>
          <span>Create</span>
        </div>
        <h1 className="page-header__title">Create hosted zone</h1>
        <p className="page-header__subtitle">
          A hosted zone tells Route 53 how to respond to DNS queries for a domain such as example.com.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Hosted zone configuration</h2>
          </div>
          <div className="card__body">
            <div className="form-group">
              <label className="form-group__label form-group__label--required" htmlFor="domain-name">
                Domain name
              </label>
              <p className="form-group__description">
                The name of the domain or subdomain that you want to route traffic for. Type the fully qualified domain name.
              </p>
              <input
                className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                type="text"
                id="domain-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder="example.com"
              />
              {errors.name && <p className="form-group__error">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label className="form-group__label" htmlFor="zone-comment">
                Description — <em>optional</em>
              </label>
              <p className="form-group__description">
                A comment to help you identify the purpose of this hosted zone.
              </p>
              <textarea
                className="form-textarea"
                id="zone-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter a description for this hosted zone"
                rows={3}
                maxLength={256}
              />
            </div>

            <div className="form-group">
              <label className="form-group__label">Type</label>
              <p className="form-group__description">
                Choose whether this is a public or private hosted zone.
              </p>
              <div className="radio-group">
                <label className={`radio-option ${type === 'Public' ? 'radio-option--selected' : ''}`}>
                  <input
                    type="radio"
                    name="zone-type"
                    value="Public"
                    checked={type === 'Public'}
                    onChange={() => setType('Public')}
                  />
                  <div className="radio-option__content">
                    <div className="radio-option__label">Public hosted zone</div>
                    <div className="radio-option__description">
                      Routes internet traffic to your resources. The records in a public hosted zone define how you want to route traffic on the internet.
                    </div>
                  </div>
                </label>
                <label className={`radio-option ${type === 'Private' ? 'radio-option--selected' : ''}`}>
                  <input
                    type="radio"
                    name="zone-type"
                    value="Private"
                    checked={type === 'Private'}
                    onChange={() => setType('Private')}
                  />
                  <div className="radio-option__content">
                    <div className="radio-option__label">Private hosted zone</div>
                    <div className="radio-option__description">
                      Routes traffic within an Amazon VPC. The records in a private hosted zone define how you want to route traffic within one or more VPCs.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="card__footer">
            <button
              type="button"
              className="btn btn--normal"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting}
              id="submit-create-zone"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner spinner--sm" /> Creating...
                </>
              ) : (
                'Create hosted zone'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
