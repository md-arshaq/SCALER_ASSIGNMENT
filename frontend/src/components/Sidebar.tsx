'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarLink {
  label: string;
  href: string;
  icon: string;
}

const mainLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Hosted zones', href: '/hosted-zones', icon: '🌐' },
  { label: 'Health checks', href: '/health-checks', icon: '💚' },
  { label: 'Traffic policies', href: '/traffic-policies', icon: '🔀' },
];

const dnsFirewallLinks: SidebarLink[] = [
  { label: 'Resolver', href: '/resolver', icon: '🔎' },
  { label: 'Profiles', href: '/profiles', icon: '📋' },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/hosted-zones') {
      return pathname === href || pathname.startsWith('/hosted-zones/');
    }
    return pathname === href;
  };

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__title">Route 53</div>
      </div>

      <div className="sidebar__section">
        {mainLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`sidebar__link ${isActive(link.href) ? 'sidebar__link--active' : ''}`}
            id={`sidebar-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <span className="sidebar__link-icon">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="sidebar__divider" />

      <div className="sidebar__section">
        <div className="sidebar__section-label">DNS Firewall</div>
        {dnsFirewallLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`sidebar__link ${isActive(link.href) ? 'sidebar__link--active' : ''}`}
            id={`sidebar-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <span className="sidebar__link-icon">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
