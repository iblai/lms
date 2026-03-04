import { Plus } from 'lucide-react';
import { Assertion } from '@iblai/iblai-api';
import { CredentialMiniBox } from './credential-mini-box';
import { DefaultEmptyBox } from './default-empty-box';
import Link from 'next/link';
type CredentialsListBoxProps = {
  credentials: Assertion[];
  onClose?: () => void;
};

export function CredentialsListBox({ credentials }: CredentialsListBoxProps) {
  return (
    <div className="mb-4 rounded-md border border-[var(--sidebar-border)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm md:text-base font-medium text-[var(--sidebar-text)]">Credentials</h3>
        <Link
          href="/discover"
          className="rounded-sm p-1 text-[var(--text-light)] hover:bg-[var(--sidebar-hover-bg)] group relative"
          aria-label="Add Credential"
        >
          <Plus className="h-5 w-5" />
          <span className="absolute -top-8 right-0 w-28 bg-[var(--text-dark)] text-white text-xs rounded-sm py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Add Credential
          </span>
        </Link>
      </div>
      {credentials.length === 0 && (
        <DefaultEmptyBox className="w-full" message="No credentials yet." />
      )}
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
