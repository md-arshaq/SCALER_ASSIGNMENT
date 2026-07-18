'use client';

export default function ResolverPage() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header__breadcrumb">
          <a href="/dashboard">Route 53</a>
          <span className="page-header__breadcrumb-separator">/</span>
          <span>Resolver</span>
        </div>
        <h1 className="page-header__title">Resolver</h1>
      </div>
      <div className="card">
        <div className="card__body">
          <div className="coming-soon">
            <div className="coming-soon__icon">🔎</div>
            <h2 className="coming-soon__title">Coming Soon</h2>
            <p className="coming-soon__description">
              Route 53 Resolver provides recursive DNS for your VPC and on-premises networks. This feature is not yet available in this clone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
