export { PersonalInfoSetupTab } from './PersonalInfoSetupTab';
export { EducationSetupTab, type EducationEntry } from './EducationSetupTab';
export { ExperienceSetupTab, type ExperienceEntry } from './ExperienceSetupTab';

// Glassmorphism setup tabs
export { LocationSetupTab } from './LocationSetupTab';
export { SkillsSetupTab } from './SkillsSetupTab';
export { HobbySetupTab } from './HobbySetupTab';

// Re-export existing profile tabs for use in onboarding (fallback)
export { SkillsTab } from '../../../candidate/profile/tabs/SkillsTab';
export { HobbyTab } from '../../../candidate/profile/tabs/HobbyTab';
export { default as LocationTab } from '../../../candidate/profile/tabs/LocationTab';
export { default as CertificatesTab } from '../../../candidate/profile/tabs/CertificatesTab';
export { default as ExtraCurricularTab } from '../../../candidate/profile/tabs/ExtraCurricularTab';
export { default as LeadershipSocialTab } from '../../../candidate/profile/tabs/LeadershipSocialTab';
export { ResumeTab } from '../../../candidate/profile/tabs/ResumeTab';
