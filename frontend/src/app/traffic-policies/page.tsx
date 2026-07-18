'use client';

export default function TrafficPoliciesPage() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header__breadcrumb">
          <a href="/dashboard">Route 53</a>
          <span className="page-header__breadcrumb-separator">/</span>
          <span>Traffic policies</span>
        </div>
        <h1 className="page-header__title">Traffic policies</h1>
      </div>
      <div className="card">
        <div className="card__body">
          <div className="coming-soon">
            <div className="coming-soon__icon">🔀</div>
            <h2 className="coming-soon__title">Coming Soon</h2>
            <p className="coming-soon__description">
              Traffic flow enables you to create complex routing configurations for your resources using a visual editor. This feature is not yet available in this clone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
