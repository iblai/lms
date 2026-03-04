'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X, User, Briefcase, Globe, Shield, Search } from 'lucide-react';
import Image from 'next/image';

interface AccountInfo {
  fullName: string;
  email: string;
  username: string;
  title: string;
  about: string;
  language: string;
  mentorAI: boolean;
  skillsLeaderboard: boolean;
  publicProfile?: boolean;
  facebook: string;
  linkedin: string;
  twitter: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Student';
}

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (info: AccountInfo) => void;
  initialInfo?: AccountInfo;
}

export function AccountDialog({ open, onOpenChange, onSave, initialInfo }: AccountDialogProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    fullName: 'Bimsara Marapana',
    email: 'bimsara@ibleducation.com',
    username: 'bimsara',
    title: 'Graphic Designer | Marketing Specialist',
    about: 'undefined',
    language: 'English',
    mentorAI: false,
    skillsLeaderboard: false,
    facebook: '',
    linkedin: '',
    twitter: '',
  });

  // Sample user data for admin tab
  const [users, setUsers] = useState<UserData[]>([
    { id: '1', name: 'sonitwo', email: 'sonitwo@ibleducation.com', role: 'Admin' },
    { id: '2', name: 'Ibl', email: 'iblai@ibleducation.com', role: 'Admin' },
    { id: '3', name: 'Brian Ngabidong', email: 'brian@ibleducation.com', role: 'Student' },
    { id: '4', name: 'Ibl Ai', email: 'iblai2@ibleducation.com', role: 'Student' },
    { id: '5', name: 'Brian', email: 'brian+256@ibleducation.com', role: 'Student' },
    { id: '6', name: 'Mikel Amigot', email: 'amigotmikel@gmail.com', role: 'Admin' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Reset state when dialog opens with initialInfo
  useEffect(() => {
    if (open && initialInfo) {
      setAccountInfo(initialInfo);
    }
  }, [open, initialInfo]);

  const handleInputChange = (field: keyof AccountInfo, value: any) => {
    setAccountInfo({
      ...accountInfo,
      [field]: value,
    });
  };

  const handleSave = () => {
    onSave(accountInfo);
    onOpenChange(false);
  };

  const handlePasswordReset = () => {
    // This would typically send a password reset email
    alert('Password reset link sent to your email');
  };

  const handleRoleChange = (userId: string, newRole: 'Admin' | 'Student') => {
    setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));
  };

  // Determine dialog width based on active tab
  const dialogWidthClass = activeTab === 'admin' ? 'max-w-6xl' : 'max-w-4xl';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`p-0 overflow-hidden ${dialogWidthClass} h-[85vh] flex flex-row`}>
        {/* Left Sidebar */}
        <div className="w-64 bg-[var(--dialog-sidebar-bg)] text-[var(--dialog-sidebar-text)] p-0 flex flex-col relative overflow-hidden">
          {/* Decorative Circles - updated to be subtle on white background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-light)]/30 rounded-full -translate-x-20 -translate-y-20 z-0"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--primary-light)]/30 rounded-full translate-x-10 translate-y-20 z-0"></div>

          {/* Profile Section - update border color for white theme */}
          <div className="flex flex-col items-center justify-center py-8 px-4 border-b border-[var(--primary-light)] relative z-10">
            <div className="relative w-24 h-24 mb-4">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-25%20at%2001.33.30-L2N6YxtKLEIuHnSaRgZYo4cZk49uNn.png"
                alt="Profile"
                width={96}
                height={96}
                className="rounded-full object-cover border-4 border-white shadow-md"
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-1 shadow-md bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold text-[var(--dialog-sidebar-text)]">
              {accountInfo.fullName || 'Charles Foster, Admin'}
            </h2>

            <div className="flex mt-4 space-x-2">
              <div className="bg-[var(--badge-admin-bg)] px-3 py-1 rounded-md text-xs font-medium flex items-center text-[var(--badge-admin-text)]">
                <User className="h-3 w-3 mr-1" />
                ADMIN
              </div>
              <div className="bg-[var(--badge-default-bg)] px-3 py-1 rounded-md text-xs font-medium truncate max-w-[100px] text-[var(--badge-default-text)]">
                0010500000...
              </div>
            </div>
          </div>

          {/* Navigation - update active tab styling for white theme */}
          <nav className="flex-1 py-6 relative z-10">
            <ul className="space-y-1">
              {[
                { id: 'basic', label: 'Basic', icon: User },
                { id: 'social', label: 'Social', icon: Globe },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'admin', label: 'Admin', icon: Briefcase },
              ].map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-6 py-3 flex items-center ${
                      activeTab === tab.id
                        ? 'bg-[var(--dialog-sidebar-active-bg)] border-l-4 border-[var(--dialog-sidebar-active-border)] text-[var(--dialog-sidebar-active-text)] font-medium'
                        : 'hover:bg-[var(--sidebar-hover-bg)] text-[var(--dialog-sidebar-text)]'
                    }`}
                  >
                    <tab.icon className="h-5 w-5 mr-3" />
                    <span>{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-[var(--dialog-bg)] z-10 flex flex-row justify-between items-center">
            <DialogTitle className="text-xl font-medium text-[var(--dialog-text)]">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>

          <div className="p-6 space-y-6 bg-white overflow-y-auto flex-1 pb-16">
            {activeTab === 'basic' && (
              <>
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-500">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={accountInfo.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-500">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={accountInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-500">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={accountInfo.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full"
                    placeholder="Enter your username"
                  />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-500">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={accountInfo.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full"
                    placeholder="Enter your professional title"
                  />
                </div>

                {/* About */}
                <div className="space-y-2">
                  <Label htmlFor="about" className="text-sm font-medium text-gray-500">
                    About
                  </Label>
                  <Textarea
                    id="about"
                    value={accountInfo.about}
                    onChange={(e) => handleInputChange('about', e.target.value)}
                    rows={4}
                    className="resize-none w-full"
                    placeholder="Tell us about yourself"
                  />
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-medium text-gray-500">
                    Language
                  </Label>
                  <Select
                    value={accountInfo.language}
                    onValueChange={(value) => handleInputChange('language', value)}
                  >
                    <SelectTrigger id="language" className="w-full">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="Chinese">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Preferences */}
                <div className="space-y-6 pt-4">
                  {/* Public Profile */}
                  <div className="space-y-2">
                    <h3 className="text-base font-medium text-gray-600">Public Profile</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="publicProfile"
                        checked={accountInfo.publicProfile || false}
                        onChange={(e) => handleInputChange('publicProfile', e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                      />
                      <Label htmlFor="publicProfile" className="text-sm font-medium text-gray-700">
                        Make Profile Public
                      </Label>
                    </div>
                  </div>

                  {/* Mentor AI */}
                  <div className="space-y-2">
                    <h3 className="text-base font-medium text-gray-600">Mentor AI</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="mentorAI"
                        checked={accountInfo.mentorAI}
                        onChange={(e) => handleInputChange('mentorAI', e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                      />
                      <Label htmlFor="mentorAI" className="text-sm font-medium text-gray-700">
                        Display Mentor AI
                      </Label>
                    </div>
                  </div>

                  {/* Skills Leaderboard */}
                  <div className="space-y-2">
                    <h3 className="text-base font-medium text-gray-600">Skills Leaderboard</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="skillsLeaderboard"
                        checked={accountInfo.skillsLeaderboard}
                        onChange={(e) => handleInputChange('skillsLeaderboard', e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                      />
                      <Label
                        htmlFor="skillsLeaderboard"
                        className="text-sm font-medium text-gray-700"
                      >
                        Display Leaderboard
                      </Label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'social' && (
              <div className="space-y-6">
                {/* Facebook */}
                <div className="space-y-2">
                  <Label
                    htmlFor="facebook"
                    className="text-sm font-medium text-[var(--dialog-text)]"
                  >
                    Facebook
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <div className="bg-[#1877F2] text-white rounded w-6 h-6 flex items-center justify-center">
                        <span className="font-bold text-lg">f</span>
                      </div>
                    </div>
                    <Input
                      id="facebook"
                      className="pl-12"
                      placeholder="Facebook Username"
                      value={accountInfo.facebook}
                      onChange={(e) => handleInputChange('facebook', e.target.value)}
                    />
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="space-y-2">
                  <Label
                    htmlFor="linkedin"
                    className="text-sm font-medium text-[var(--dialog-text)]"
                  >
                    LinkedIn
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <div className="bg-[#0A66C2] text-white rounded w-6 h-6 flex items-center justify-center">
                        <span className="font-bold text-sm">in</span>
                      </div>
                    </div>
                    <Input
                      id="linkedin"
                      className="pl-12"
                      placeholder="LinkedIn Username"
                      value={accountInfo.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    />
                  </div>
                </div>

                {/* X (Twitter) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="twitter"
                    className="text-sm font-medium text-[var(--dialog-text)]"
                  >
                    X
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <div className="bg-black text-white rounded w-6 h-6 flex items-center justify-center">
                        <span className="font-bold">X</span>
                      </div>
                    </div>
                    <Input
                      id="twitter"
                      className="pl-12"
                      placeholder="X Username"
                      value={accountInfo.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="flex flex-col items-center justify-center max-w-md mx-auto pt-12">
                <div className="text-gray-400 mb-4">
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <p className="text-gray-500 text-center mb-8">Click to reset your password.</p>
                <Button
                  className="w-full bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] hover:opacity-[var(--button-primary-hover-opacity)]"
                  onClick={handlePasswordReset}
                >
                  Send Password Reset Link
                </Button>
              </div>
            )}

            {activeTab === 'admin' && (
              <div className="space-y-6">
                {/* Search Users */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search Users"
                    className="pl-10 max-w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Users Table */}
                <div className="border rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-3 bg-gray-50 p-4 text-sm font-medium text-gray-500">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Role</div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="grid grid-cols-3 p-4 items-center">
                        <div className="text-gray-700">{user.name}</div>
                        <div className="text-gray-700">{user.email}</div>
                        <div className="pr-0 flex justify-end">
                          <Select
                            value={user.role}
                            onValueChange={(value: 'Admin' | 'Student') =>
                              handleRoleChange(user.id, value)
                            }
                          >
                            <SelectTrigger className="w-32 border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="Student">Student</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}

                    {filteredUsers.length === 0 && (
                      <div className="p-4 text-center text-gray-500">No users found</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer with Save Button - hide on security tab */}
          {activeTab !== 'security' && (
            <div className="border-t p-4 sticky bottom-0 w-full bg-[var(--dialog-bg)] flex justify-end shadow-md z-10">
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-gray-700 to-amber-500 text-white hover:opacity-90"
              >
                Save
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
