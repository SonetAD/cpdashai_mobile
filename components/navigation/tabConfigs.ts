import { NavTabItem } from './types';

// Candidate tab icons
import HomeIcon from '../../assets/images/navbar/home.svg';
import JobsIcon from '../../assets/images/navbar/jobs.svg';
import AICoachIcon from '../../assets/images/navbar/aiCoach.svg';
import ProfileIcon from '../../assets/images/navbar/profile.svg';

// Candidate selected state icons
import SelectedHomeIcon from '../../assets/images/navbar/selectedHome.svg';
import SelectedJobsIcon from '../../assets/images/navbar/selectedJobs.svg';
import SelectedAICoachIcon from '../../assets/images/navbar/selectedAICoach.svg';
import SelectedProfileIcon from '../../assets/images/navbar/selectedProfile.svg';

// Recruiter-specific icons
import TalentIcon from '../../assets/images/navbar/talent.svg';
import ReportsIcon from '../../assets/images/navbar/reports.svg';

/**
 * Tab configuration for Candidate users
 */
export const CANDIDATE_TABS: NavTabItem[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon, SelectedIcon: SelectedHomeIcon },
  { id: 'jobs', label: 'Jobs', Icon: JobsIcon, SelectedIcon: SelectedJobsIcon },
  { id: 'aiCoach', label: 'AI Coach', Icon: AICoachIcon, SelectedIcon: SelectedAICoachIcon, indicatorWidthAdjustment: -4 },
  { id: 'profile', label: 'Profile', Icon: ProfileIcon, SelectedIcon: SelectedProfileIcon },
];

/**
 * Tab configuration for Recruiter/Talent Partner users
 */
export const RECRUITER_TABS: NavTabItem[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon, SelectedIcon: SelectedHomeIcon },
  { id: 'talent', label: 'Talent', Icon: TalentIcon },
  { id: 'reports', label: 'Reports', Icon: ReportsIcon },
  { id: 'profile', label: 'Profile', Icon: ProfileIcon, SelectedIcon: SelectedProfileIcon },
];
