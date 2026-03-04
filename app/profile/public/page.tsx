'use client';

import { useState, useContext, useCallback } from 'react';
import { Facebook, Linkedin, Twitter, Edit2, Edit } from 'lucide-react';
import { useUserMetadata } from '@/hooks/users/use-usermetadata';
import { EducationBox } from '@/components/profile/education-box';
import { ExperienceBox } from '@/components/profile/experience-box';
import { SkillsBox } from '@/components/profile/skills-box';
import { CredentialBox } from '@/components/profile/credential-box';
import { ResumeBox } from '@/components/profile/resume-box';
import { MediaBox } from '@/components/profile/media-box';
import { UserAvatar } from '@/components/header/profile/user-avatar';
import { AppContext } from '@/components/client-layout';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { getTenant } from '@/utils/helpers';
import { config } from '@/lib/config';
import { Tenant } from '@iblai/iblai-js/web-utils';
import { UserProfileModal } from '@iblai/iblai-js/web-containers/next';
import { useIsAdmin, useUserTenants } from '@/utils/localstorage';
import { useAppSelector } from '@/lib/hooks';
import { selectRbacPermissions } from '@/features/rbac';

export default function PublicProfilePage() {
  const { userMetaData } = useUserMetadata();
  const { metadataLoaded, isSkillsResumeFeatureHidden } = useTenantMetadata({
    org: getTenant(),
  });
  const { isUserProfileOpen, setIsUserProfileOpen, userProfileTargetTab, setUserProfileTargetTab } =
    useContext(AppContext);
  const [activeTab, setActiveTab] = useState('about'); // about, education, experience, skills, credentials, resume, media
  const { userTenants = [], saveUserTenants } = useUserTenants();

  const rbacPermissions = useAppSelector(selectRbacPermissions);
  const isAdmin = useIsAdmin();

  const openUserProfile = useCallback(
    (targetTab: string) => {
      setUserProfileTargetTab(targetTab);
      setIsUserProfileOpen(true);
    },
    [setIsUserProfileOpen, setUserProfileTargetTab],
  );

  const handleCloseUserProfile = useCallback(() => {
    setIsUserProfileOpen(false);
    setUserProfileTargetTab('basic');
  }, [setIsUserProfileOpen, setUserProfileTargetTab]);

  const handleTenantUpdate = (tenant: Tenant) => {
    const updatedTenants = userTenants.map((t) => {
      if (t.key === tenant.key) {
        return tenant;
      } else {
        return t;
      }
    });
    saveUserTenants(updatedTenants);
  };

  return (
    <>
      <div className="max-w-5xl mx-auto bg-white">
        {/* Profile Header */}
        <div className="relative">
          {/* Banner */}
          <div className="h-48 w-full bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 relative overflow-hidden mt-8">
            <div className="absolute inset-0">
              <svg viewBox="0 0 1000 200" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill="rgba(245, 158, 11, 0.1)"
                  d="M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100 L1000,0 L0,0 Z"
                ></path>
                <path
                  fill="rgba(245, 158, 11, 0.05)"
                  d="M0,100 C150,0 350,200 500,100 C650,0 850,200 1000,100 L1000,0 L0,0 Z"
                ></path>
              </svg>
            </div>
            <button
              onClick={() => openUserProfile('basic')}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              <Edit2 className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Profile Picture */}
          <div className="absolute left-6 bottom-0 transform translate-y-1/2">
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-white overflow-hidden shadow-lg">
              <UserAvatar size={120} containerClassName="h-full w-full" />
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-6 pt-16 md:pt-20">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-600">
              {userMetaData?.name}
            </h1>
            <button
              onClick={() => openUserProfile('basic')}
              className="p-1 text-gray-400 hover:text-amber-500 hover:bg-gray-100 rounded-full transition-all"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
          {userMetaData?.bio && <p className="text-gray-600 mt-1">{userMetaData?.bio}</p>}

          {/* Social Media Links */}
          <div className="flex space-x-3 mt-3">
            {userMetaData?.social_links?.map((link) => (
              <a
                key={link.platform}
                href={`https://${link.platform}.com/${link.social_link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500 hover:text-amber-600 transition-colors"
              >
                {link.platform === 'facebook' && <Facebook className="h-5 w-5" />}
                {link.platform === 'linkedin' && <Linkedin className="h-5 w-5" />}
                {link.platform === 'twitter' && <Twitter className="h-5 w-5" />}
              </a>
            ))}
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="border-b border-gray-200 px-6 mt-6">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              'About',
              'Education',
              'Experience',
              'Skills',
              'Credentials',
              ...(metadataLoaded && !isSkillsResumeFeatureHidden() ? ['Resume'] : []),
              'Media',
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`whitespace-nowrap py-2 px-1 text-sm font-medium border-b-2 ${
                  activeTab === tab.toLowerCase()
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 py-6 mb-10">
          {activeTab === 'about' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">About</h2>
              <p className="text-gray-600">{userMetaData?.about}</p>
            </div>
          )}

          {activeTab === 'education' && <EducationBox />}

          {activeTab === 'experience' && <ExperienceBox />}

          {activeTab === 'skills' && <SkillsBox />}

          {activeTab === 'credentials' && <CredentialBox />}

          {activeTab === 'resume' && metadataLoaded && !isSkillsResumeFeatureHidden() && (
            <ResumeBox />
          )}

          {activeTab === 'media' && <MediaBox />}
        </div>
      </div>
      {isUserProfileOpen && (
        <UserProfileModal
          isOpen={isUserProfileOpen}
          params={{
            tenantKey: getTenant(),
            isAdmin,
          }}
          showMentorAIDisplayCheckbox={true}
          showLeaderboardDisplayCheckbox={true}
          showUsernameField={false}
          showPlatformName={false}
          useGravatarPicFallback={config.settings.enableGravatarOnProfilePic() !== 'false'}
          targetTab={userProfileTargetTab}
          onClose={handleCloseUserProfile}
          billingEnabled={false}
          billingURL={''}
          topUpEnabled={false}
          topUpURL={''}
          currentPlan={''}
          currentSPA={config.settings.appName() || 'skills'}
          authURL={config.urls.auth()}
          tenants={userTenants}
          onTenantUpdate={handleTenantUpdate}
          currentPlatformBaseDomain={config.settings.platformBaseDomain()}
          rbacPermissions={rbacPermissions}
        />
      )}
    </>
  );
}
