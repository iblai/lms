'use client';
import { Plus } from 'lucide-react';
import { Assertion } from '@iblai/iblai-api';
import { CredentialMiniBox } from './credential-mini-box';
import Link from 'next/link';
import { useTenantParam } from '@/hooks/use-tenant-param';
type CredentialsListBoxProps = {
  credentials: Assertion[];
  onClose?: () => void;
};

export function CredentialsListBox({ credentials }: CredentialsListBoxProps) {
  const tenant = useTenantParam();
  return (
    <div className="mb-4 rounded-md border border-[var(--sidebar-border)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--sidebar-text)] md:text-base">Credentials</h3>
        <Link
          href={`/platform/${tenant}/discover`}
          className="group relative rounded-sm p-1 text-[var(--text-light)] hover:bg-[var(--sidebar-hover-bg)]"
          aria-label="Add Credential"
        >
          <Plus className="h-5 w-5" />
          <span className="pointer-events-none absolute -top-8 right-0 w-28 rounded-sm bg-[var(--text-dark)] px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Add Credential
          </span>
        </Link>
      </div>
      <div className="space-y-2">
        {credentials.map((credential, index) => (
          <CredentialMiniBox
            key={`credential-mini-box-${index}`}
            credential={credential}
            minified={true}
            iconSize={12}
          />
        ))}
      </div>
    </div>
  );
}
