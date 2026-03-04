'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { AccountDialog } from './account-dialog';

export function AccountButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accountInfo, setAccountInfo] = useState({
    fullName: 'Charles Foster, Admin',
    email: 'zz7676001@gmail.com',
    username: 'LarryZipBJZcnVn',
    title: 'finance controller | network engineer | manager',
    about: '.......... testing',
    language: 'English',
    mentorAI: true,
    skillsLeaderboard: true,
    facebook: '',
    linkedin: '',
    twitter: '',
  });

  const handleSaveAccount = (info: any) => {
    setAccountInfo(info);
    console.log('Saved account info:', info);
  };

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-2 text-gray-600 hover:text-amber-500 transition-colors"
      >
        <Settings className="h-5 w-5" />
        <span className="hidden md:inline">Account</span>
      </button>

      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveAccount}
        initialInfo={accountInfo}
      />
    </>
  );
}
