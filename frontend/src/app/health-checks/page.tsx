'use client';

export default function HealthChecksPage() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header__breadcrumb">
          <a href="/dashboard">Route 53</a>
          <span className="page-header__breadcrumb-separator">/</span>
          <span>Health checks</span>
        </div>
        <h1 className="page-header__title">Health checks</h1>
      </div>
      <div className="card">
        <div className="card__body">
          <div className="coming-soon">
            <div className="coming-soon__icon">💚</div>
            <h2 className="coming-soon__title">Coming Soon</h2>
            <p className="coming-soon__description">
              Health checks monitor the health and performance of your web applications, web servers, and other resources. This feature is not yet available in this clone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
