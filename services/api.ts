import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAccessToken, getRefreshToken } from '../utils/authUtils';

// Remove trailing slash from API URL to prevent double-slash issues in URL construction
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
export const API_URL = rawApiUrl.replace(/\/+$/, '');

console.log('API_URL:', API_URL);
console.log('Environment:', process.env.EXPO_PUBLIC_API_URL);

// Define types for the API
export interface RegisterCandidateInput {
  email?: string;
  password: string;
  passwordConfirm: string;
  phoneNumber?: string;
  firstName?: string;
}

export interface SuccessType {
  __typename: 'SuccessType';
  message: string;
  success: boolean;
}

export interface ErrorType {
  __typename: 'ErrorType';
  message: string;
  success: boolean;
}

export interface RegisterCandidateResponse {
  createCandidate: LoginSuccessType | ErrorType;
}

export interface RegisterRecruiterInput {
  email?: string;
  password: string;
  passwordConfirm: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  organizationName: string;
  organizationType: 'employer' | 'university' | 'agency';
  subRole: string;
  position?: string;
  linkedinUrl?: string;
}

export interface RegisterRecruiterResponse {
  createRecruiter: LoginSuccessType | ErrorType;
}

// Complete Recruiter Profile (for Google OAuth users)
export interface CompleteRecruiterProfileInput {
  organizationName: string;
  organizationType: 'employer' | 'university' | 'agency';
  subRole: string;
  position?: string;
  linkedinUrl?: string;
}

export interface CompleteRecruiterProfileSuccessType {
  __typename: 'CompleteRecruiterProfileSuccessType';
  success: boolean;
  message: string;
  recruiter: {
    id: string;
    organizationName: string;
    organizationType: string;
    subRole: string;
    position?: string;
    linkedinUrl?: string;
    profileSetupComplete: boolean;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
}

export interface CompleteRecruiterProfileResponse {
  completeRecruiterProfile: CompleteRecruiterProfileSuccessType | ErrorType;
}

export interface LoginInput {
  email?: string;
  phoneNumber?: string;
  password: string;
}

export interface User {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: string;
  isVerified?: boolean;
}

export interface LoginSuccessType {
  __typename: 'LoginSuccessType';
  accessToken: string;
  refreshToken: string;
  message: string;
  role: string;
  success: boolean;
  user: User;
  profileSetupRequired?: boolean;
}

export interface LoginResponse {
  login: LoginSuccessType | ErrorType;
}

export interface TokenVerificationSuccessType {
  __typename: 'TokenVerificationSuccessType';
  valid: boolean;
  role: string;
  user: User;
}

export interface VerifyTokenResponse {
  verifyToken: TokenVerificationSuccessType | ErrorType;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenSuccessType {
  __typename: 'RefreshTokenSuccessType';
  accessToken: string;
  refreshToken: string;
  message: string;
  success: boolean;
}

export interface RefreshTokenResponse {
  refreshToken: RefreshTokenSuccessType | ErrorType;
}

export interface LogoutResponse {
  logout: SuccessType | ErrorType;
}

// Education types
export interface EducationInput {
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade?: string;
  description?: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade: string;
}

export interface AddEducationResponse {
  addEducation: SuccessType | ErrorType;
}

export interface UpdateEducationInput {
  index: number;
  degree?: string;
  institution?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  description?: string;
}

export interface UpdateEducationResponse {
  updateEducation: SuccessType | ErrorType;
}

export interface DeleteEducationInput {
  index: number;
}

export interface DeleteEducationResponse {
  deleteEducation: SuccessType | ErrorType;
}

// Experience types
export interface AddExperienceInput {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  location?: string;
  description?: string;
  employmentType?: string;
}

export interface AddExperienceResponse {
  addExperience: SuccessType | ErrorType;
}

export interface UpdateExperienceInput {
  index: number;
  company?: string;
  startDate?: string;
  position?: string;
  location?: string;
  endDate?: string;
  description?: string;
  current?: boolean;
  employmentType?: string;
}

export interface UpdateExperienceResponse {
  updateExperience: SuccessType | ErrorType;
}

export interface DeleteExperienceInput {
  index: number;
}

export interface DeleteExperienceResponse {
  deleteExperience: SuccessType | ErrorType;
}

// GDPR Consent types
export interface ConsentStatus {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  thirdParty: boolean;
  dataProcessing: boolean;
  privacyPolicy: boolean;
  termsOfService: boolean;
}

export interface ConsentSuccessType {
  __typename: 'ConsentSuccessType';
  success: boolean;
  message: string;
}

export interface HasGivenConsentResponse {
  hasGivenConsent: boolean;
}

export interface RequiresConsentUpdateResponse {
  requiresConsentUpdate: boolean;
}

export interface AcceptAllConsentsInput {
  policyVersion: string;
}

export interface UpdateAllConsentsInput {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  thirdParty: boolean;
  dataProcessing: boolean;
  privacyPolicy: boolean;
  termsOfService: boolean;
  policyVersion: string;
}

export interface AcceptAllConsentsResponse {
  acceptAllConsents: ConsentSuccessType | ErrorType;
}

export interface RejectOptionalConsentsResponse {
  rejectOptionalConsents: ConsentSuccessType | ErrorType;
}

export interface UpdateAllConsentsResponse {
  updateAllConsents: ConsentSuccessType | ErrorType;
}

// GDPR Data Export types
export interface DataExportSuccessType {
  __typename: 'DataExportSuccessType';
  success: boolean;
  message: string;
  exportData: string; // JSON string containing all user data
}

export interface ExportMyDataResponse {
  exportMyData: DataExportSuccessType | ErrorType;
}

// GDPR Data Deletion types
export interface DeleteAccountSuccessType {
  __typename: 'SuccessType';
  success: boolean;
  message: string;
  data?: string;
}

export interface DeleteAccountResponse {
  deleteAccount: DeleteAccountSuccessType | ErrorType;
}

// Candidate profile types
export interface CandidateExperience {
  company: string;
  position?: string;  // Frontend field name
  title?: string;     // Backend sends 'title' instead of 'position'
  location: string;
  start_date: string;
  end_date: string;
  description: string;
  current: boolean;
  employment_type?: string;
  responsibilities?: string[];  // Backend also sends responsibilities array
}

export interface CandidateEducation {
  degree: string;
  institution: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  grade: string;
  education_id?: string;
  description?: string;
}

export interface CandidateProfile {
  id: string;
  user: User & {
    fullName?: string;
    bio?: string;
    profilePictureUrl?: string;
    dateJoined?: string;
    updatedAt?: string;
  };
  title?: string;
  experienceLevel?: string;
  expectedSalary?: string;
  skills?: string[];
  hobbies?: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  preferredLocations?: PreferredLocation[];
  lookingForJob?: boolean;
  yearsOfExperience?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  education?: CandidateEducation[];
  experience?: CandidateExperience[];
  certifications?: Certification[];
  profilePicture?: string;
}

export interface GetCandidateProfileSuccessType {
  __typename: 'CandidateType';
  id: string;
  user: User & {
    fullName?: string;
    bio?: string;
    profilePictureUrl?: string;
    dateJoined?: string;
    updatedAt?: string;
  };
  title?: string;
  workplace?: string;
  experienceLevel?: string;
  expectedSalary?: string;
  skills?: string[];
  hobbies?: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  preferredLocations?: PreferredLocation[];
  lookingForJob?: boolean;
  yearsOfExperience?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  education?: CandidateEducation[];
  experience?: CandidateExperience[];
}

export interface GetCandidateProfileResponse {
  myProfile: GetCandidateProfileSuccessType | ErrorType;
}

// Recruiter Profile types
export interface RecruiterType {
  __typename: 'RecruiterType';
  id: string;
  user: User & {
    fullName?: string;
    bio?: string;
    profilePictureUrl?: string;
    dateJoined?: string;
    updatedAt?: string;
  };
  organizationName?: string;
  organizationType?: string;
  subRole?: string;
  position?: string;
  companyName?: string;
  companyWebsite?: string;
  linkedinUrl?: string;
  industries?: string[];
  specializations?: string[];
  isVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetRecruiterProfileResponse {
  recruiter: RecruiterType | ErrorType;
}

// Skills management types
export interface AddSkillInput {
  skill: string;
}

export interface AddSkillResponse {
  addSkill: SuccessType | ErrorType;
}

export interface RemoveSkillInput {
  skill: string;
}

export interface RemoveSkillResponse {
  removeSkill: SuccessType | ErrorType;
}

export interface UpdateSkillsInput {
  skills: string[];
}

export interface UpdateSkillsResponse {
  updateSkills: SuccessType | ErrorType;
}

// Hobbies management types
export interface AddHobbyInput {
  hobby: string;
}

export interface AddHobbyResponse {
  addHobby: SuccessType | ErrorType;
}

export interface RemoveHobbyInput {
  hobby: string;
}

export interface RemoveHobbyResponse {
  removeHobby: SuccessType | ErrorType;
}

export interface UpdateHobbiesInput {
  hobbies: string[];
}

export interface UpdateHobbiesResponse {
  updateHobbies: SuccessType | ErrorType;
}

// Update Candidate Profile types (for URLs, salary, etc.)
export interface UpdateCandidateProfileInput {
  experienceLevel?: string;
  yearsOfExperience?: number;
  expectedSalary?: number;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  lookingForJob?: boolean;
  isActive?: boolean;
}

export interface UpdateCandidateProfileResponse {
  updateCandidateProfile: SuccessType | ErrorType;
}

// Preferred Locations management types
export type WorkType = 'REMOTE' | 'HYBRID' | 'ONSITE';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';

// Response type for preferred locations from GraphQL
export interface PreferredLocation {
  city: string;
  country: string;
  workTypes: WorkType[];
  employmentType: EmploymentType;
}

// Input type for adding/updating preferred locations
export interface PreferredLocationInput {
  city: string;
  country: string;
  workTypes: WorkType[];
  employmentType: EmploymentType;
}

export interface AddPreferredLocationsInput {
  locations: PreferredLocationInput[];
}

export interface AddPreferredLocationsResponse {
  addPreferredLocations: SuccessType | ErrorType;
}

export interface UpdatePreferredLocationsInput {
  locations: PreferredLocationInput[];
}

export interface UpdatePreferredLocationsResponse {
  updatePreferredLocations: SuccessType | ErrorType;
}

export interface DeletePreferredLocationsInput {
  locationIds: string[];
}

export interface DeletePreferredLocationsResponse {
  deletePreferredLocations: SuccessType | ErrorType;
}

// Profile Picture types
export interface MyProfileResponse {
  myProfile: CandidateProfileData | RecruiterProfileData;
}

export interface CandidateProfileData {
  __typename: 'CandidateType';
  id: string;
  profilePicture?: string;
  profileBanner?: string;
  certifications?: string | Certification[];
}

export interface RecruiterProfileData {
  __typename: 'RecruiterType';
  id: string;
  profilePicture?: string;
  profileBanner?: string;
}

export interface ProfilePictureInput {
  profilePictureBase64: string;
}

export interface ProfilePictureSuccessType {
  __typename: 'SuccessType';
  success: boolean;
  data?: string;
  message: string;
}

export interface ProfilePictureErrorType {
  __typename: 'ErrorType';
  success: boolean;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface UploadCandidateProfilePictureResponse {
  uploadCandidateProfilePicture: ProfilePictureSuccessType | ProfilePictureErrorType;
}

export interface UploadRecruiterProfilePictureResponse {
  uploadRecruiterProfilePicture: ProfilePictureSuccessType | ProfilePictureErrorType;
}

// Profile Banner types
export interface ProfileBannerInput {
  profileBannerBase64: string;
  filename: string;
}

export interface UploadCandidateProfileBannerResponse {
  uploadCandidateProfileBanner: ProfilePictureSuccessType | ProfilePictureErrorType;
}

export interface UploadRecruiterProfileBannerResponse {
  uploadRecruiterProfileBanner: ProfilePictureSuccessType | ProfilePictureErrorType;
}

// Certification types
export interface CertificationInput {
  name: string;
  issuingOrganization: string;
  certificatePdfBase64?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  expiryDate?: string;
  issueDate?: string;
}

export interface AddCertificationInput {
  certification: CertificationInput;
}

export interface AddCertificationResponse {
  addCertification: SuccessType | ErrorType;
}

export interface Certification {
  id?: string;
  name: string;
  issuingOrganization: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  issueDate?: string;
  expiryDate?: string;
  certificatePdfUrl?: string;
}

// Delete Certification types
export interface DeleteCertificationInput {
  index: number;
}

export interface DeleteCertificationResponse {
  deleteCertification: SuccessType | ErrorType;
}

export interface DeleteCertificatePdfResponse {
  deleteCertificatePdf: SuccessType | ErrorType;
}

// Update Certification types
export interface UpdateCertificationInput {
  index: number;
  certification: Partial<CertificationInput>;
}

export interface UpdateCertificationResponse {
  updateCertification: SuccessType | ErrorType;
}

// Extra-curricular types
export interface ExtraCurricularInput {
  activity: string;
  organization: string;
  role?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface AddExtraCurricularInput {
  extraCurricular: ExtraCurricularInput;
}

export interface AddExtraCurricularResponse {
  addExtraCurricular: SuccessType | ErrorType;
}

export interface ExtraCurricular {
  id?: string;
  activity: string;
  organization: string;
  role?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

// Delete Extra-curricular types
export interface DeleteExtraCurricularInput {
  index: number;
}

export interface DeleteExtraCurricularResponse {
  deleteExtraCurricular: SuccessType | ErrorType;
}

// Update Extra-curricular types
export interface UpdateExtraCurricularInput {
  index: number;
  extraCurricular: Partial<ExtraCurricularInput>;
}

export interface UpdateExtraCurricularResponse {
  updateExtraCurricular: SuccessType | ErrorType;
}

// Leadership & Social Impact types
export interface LeadershipSocialInput {
  title: string;
  organization: string;
  role?: string;
  description?: string;
  impact?: string;
  startDate?: string;
  endDate?: string;
}

export interface AddLeadershipSocialInput {
  leadershipSocial: LeadershipSocialInput;
}

export interface AddLeadershipSocialResponse {
  addLeadershipSocial: SuccessType | ErrorType;
}

export interface LeadershipSocial {
  id?: string;
  title: string;
  organization: string;
  role?: string;
  description?: string;
  impact?: string;
  startDate?: string;
  endDate?: string;
}

// Delete Leadership & Social types
export interface DeleteLeadershipSocialInput {
  index: number;
}

export interface DeleteLeadershipSocialResponse {
  deleteLeadershipSocial: SuccessType | ErrorType;
}

// Update Leadership & Social types
export interface UpdateLeadershipSocialInput {
  index: number;
  leadershipSocial: Partial<LeadershipSocialInput>;
}

export interface UpdateLeadershipSocialResponse {
  updateLeadershipSocial: SuccessType | ErrorType;
}

// Resume upload types
export interface ResumeUploadInput {
  fileName: string;
  fileData: string;
  fileType?: string;
}

export interface ResumeUploadResponse {
  uploadAndParseResume: SuccessType | ErrorType;
}

// CV Builder types
export interface ResumeEducation {
  degree: string;
  institution: string;
  location?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  description?: string;
}

export interface ResumeExperience {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  responsibilities: string[];
}

export interface ResumeProject {
  name: string;
  description: string;
  technologies: string[];
  startDate?: string;
  endDate?: string;
  url?: string;
  highlights: string[];
}

export interface ResumeSkill {
  category: string;
  items: string[];
}

export interface ResumeCertificate {
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
  url?: string;
}

export interface ResumeAchievement {
  title: string;
  description: string;
  date?: string;
}

export interface OtherLink {
  name: string;
  url: string;
}

export interface Resume {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  otherLinks?: OtherLink[];
  professionalSummary?: string;
  atsScore?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  generatedResumeUrl?: string;
  createdAt: string;
  updatedAt: string;
  education?: ResumeEducation[];
  experience?: ResumeExperience[];
  projects?: ResumeProject[];
  skills?: ResumeSkill[];
  certificates?: ResumeCertificate[];
  achievements?: ResumeAchievement[];
  hobbiesList?: string[];
}

export interface CreateResumeInput {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  otherLinks?: OtherLink[];
  professionalSummary?: string;
  education?: ResumeEducation[];
  experience?: ResumeExperience[];
  projects?: ResumeProject[];
  skills?: ResumeSkill[];
  certificates?: ResumeCertificate[];
  achievements?: ResumeAchievement[];
  hobbies?: string[];
}

export interface UpdateResumeInput {
  resumeId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  otherLinks?: OtherLink[];
  professionalSummary?: string;
  education?: ResumeEducation[];
  experience?: ResumeExperience[];
  projects?: ResumeProject[];
  skills?: ResumeSkill[];
  certificates?: ResumeCertificate[];
  achievements?: ResumeAchievement[];
  hobbies?: string[];
}

export interface ResumeBuilderSuccessType {
  __typename: 'ResumeBuilderSuccessType';
  success: boolean;
  message: string;
  resume: Resume;
}

export interface CreateResumeResponse {
  createResume: ResumeBuilderSuccessType | ErrorType;
}

export interface UpdateResumeResponse {
  updateResume: ResumeBuilderSuccessType | ErrorType;
}

export interface DeleteResumeResponse {
  deleteResume: SuccessType | ErrorType;
}

export interface ParseAndCreateResumeInput {
  fileName: string;
  fileData: string;
}

export interface ParseAndCreateResumeResponse {
  parseAndCreateResume: ResumeBuilderSuccessType | ErrorType;
}

// Async Resume Parsing Types
export interface ParseResumeAsyncInput {
  fileName: string;
  fileData: string;
}

export interface ResumeParsingTaskType {
  taskId: string;
  status: string;
  message: string;
}

export interface ResumeParsingTaskSuccessType {
  __typename: 'ResumeParsingTaskSuccessType';
  success: boolean;
  message: string;
  task: ResumeParsingTaskType;
}

export interface ParseResumeAsyncResponse {
  parseResumeAsync: ResumeParsingTaskSuccessType | ErrorType;
}

export interface ResumeParsingProgressType {
  taskId: string;
  stage: string;
  stageLabel: string;
  progress: number;
  message?: string;
  status: string;
  resumeId?: string;
}

export interface GenerateProfessionalSummaryInput {
  resumeId: string;
  jobTitle?: string;
  experienceYears?: number;
}

export interface GenerateProfessionalSummaryResponse {
  generateProfessionalSummary: ResumeBuilderSuccessType | ErrorType;
}

export interface ImproveContentInput {
  resumeId: string;
  contentType: string;
  content: string;
  context?: string;
}

export interface ImproveContentSuccessResponse {
  success: boolean;
  improved_content: string;
}

export interface ImproveContentResponse {
  improveContent: ImproveContentSuccessResponse | ErrorType;
}

export interface AddKeywordsInput {
  resumeId: string;
  targetJobTitle: string;
  industry?: string;
}

export interface AddKeywordsResponse {
  addKeywords: ResumeBuilderSuccessType | ErrorType;
}

export interface ExportResumePdfResponse {
  exportResumePdf: SuccessType | ErrorType;
}

export interface MyResumesInput {
  limit?: number;
  offset?: number;
}

export interface MyResumesResponse {
  myResumes: Resume[];
}

export interface ResumeByIdResponse {
  resumeById: Resume;
}

export interface ResumeStats {
  total_resumes: number;
  completed: number;
  pending: number;
  processing: number;
  failed: number;
  average_ats_score: number;
}

export interface ResumeStatsResponse {
  resumeStats: ResumeStats;
}

export interface SearchResumesInput {
  query: string;
  limit?: number;
}

export interface SearchResumesResponse {
  searchResumes: Resume[];
}

// Resume Analysis REST API types
export interface AnalyzeResumeInput {
  resume: File | Blob;
  job_description?: string;
}

export interface AnalyzeResumeResponse {
  success: boolean;
  overall_score: number;
  job_match_score?: number;
  strong_points: string[];
  weak_points: string[];
  matching_skills?: string[];
  missing_skills?: string[];
  detailed_feedback: string;
}

// Subscription types
export interface SubscriptionPlan {
  name: string;
  planKey: string;
  price: number;
  stripePriceId?: string; // Optional - backend might not return this
  aiResumeParses: number;
  aiContentImprovements: number;
  features: string[];
}

export interface AvailablePlansResponse {
  availablePlans: {
    plans: SubscriptionPlan[];
  };
}

export interface SubscriptionStatus {
  hasSubscription: boolean;
  isActive: boolean;
  plan: string;
  status: string;
  canUseAiFeatures: boolean;
  aiResumeParsesRemaining: number | null;
  aiContentImprovementsRemaining: number | null;
  currentPeriodEnd: string | null;
  message: string;
}

export interface SubscriptionStatusResponse {
  subscriptionStatus: SubscriptionStatus;
}

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  isActive: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  aiResumeParsesUsed: number;
  aiResumeParsesLimit: number;
  aiContentImprovementsUsed: number;
  aiContentImprovementsLimit: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  nextPaymentDate: string | null;
}

export interface MySubscriptionResponse {
  mySubscription: Subscription | null;
}

export interface CreateCheckoutSessionInput {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
}

export interface CreateCheckoutSessionResponse {
  createCheckoutSession: {
    success: boolean;
    message: string;
    checkoutUrl: string | null;
    sessionId: string | null;
  };
}

export interface CancelSubscriptionInput {
  cancelAtPeriodEnd: boolean;
  reason?: string;
}

export interface CancelSubscriptionResponse {
  cancelSubscription: {
    success: boolean;
    message: string;
    canceledAt: string | null;
    accessEndsAt: string | null;
  };
}

export interface ReactivateSubscriptionResponse {
  reactivateSubscription: {
    success: boolean;
    message: string;
  };
}

export interface CreatePortalSessionResponse {
  createPortalSession: {
    success: boolean;
    message: string;
    portalUrl: string | null;
  };
}

// Billing History Types
export interface BillingHistoryInput {
  limit?: number;
  startingAfter?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  currency: string;
}

export interface InvoicePaymentMethod {
  brand: string;       // "visa", "mastercard", etc.
  last4: string;       // "4242"
  expMonth: number;    // 12
  expYear: number;     // 2025
}

export interface Invoice {
  id: string;
  number: string | null;
  status: string;
  currency: string;
  created: string;

  // Amounts (all in cents)
  subtotal: number;
  tax: number | null;
  total: number;
  amountPaid: number;
  amountDue: number;
  discount: number | null;

  // Period
  periodStart: string;
  periodEnd: string;

  // Customer
  customerName: string | null;
  customerEmail: string | null;

  // Line items
  lineItems: InvoiceLineItem[];

  // Payment method used
  paymentMethod: InvoicePaymentMethod | null;

  // External URLs (fallback)
  invoiceUrl: string | null;
  invoicePdf: string | null;
}

export interface BillingHistoryResponse {
  billingHistory: {
    success: boolean;
    invoices: Invoice[];
    hasMore: boolean;
    totalCount: number;
  };
}

// Sync Subscription Status Types
export interface SyncSubscriptionStatusResponse {
  syncSubscriptionStatus: {
    status: string;
    planId: string | null;
    planName: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    message: string;
  };
}

// Change Plan Types
export interface ChangePlanInput {
  newPriceId: string;
}

export interface ChangePlanResponse {
  changePlan: {
    success: boolean;
    message: string;
    subscription: {
      id: string;
      status: string;
      plan: string;
      currentPeriodEnd: string;
    } | null;
    prorationAmount: number | null;
  };
}

// Stripe PaymentSheet Types (for in-app payments)
export interface CreatePaymentIntentInput {
  priceId: string;
}

export interface PaymentIntentResponse {
  createPaymentIntent: {
    success: boolean;
    message?: string;
    paymentIntentClientSecret?: string;
    ephemeralKey?: string;
    customerId?: string;
    publishableKey?: string;
  };
}

export interface CreateSubscriptionSetupInput {
  priceId: string;
}

export interface SetupIntentResponse {
  createSubscriptionSetup: {
    success: boolean;
    message?: string;
    setupIntentClientSecret?: string;
    ephemeralKey?: string;
    customerId?: string;
    publishableKey?: string;
    priceId?: string;
  };
}

// Paypal Payment Types
export interface CreatePaypalSubscriptionInput {
  planKey: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreatePaypalSubscriptionResponse {
  createPaypalSubscription: {
    success: boolean;
    message?: string;
    subscriptionId?: string;
    approvalUrl?: string;
  };
}

export interface CapturePaypalSubscriptionInput {
  subscriptionId: string;
  token?: string;
}

export interface CapturePaypalSubscriptionResponse {
  capturePaypalSubscription: {
    success: boolean;
    message: string;
    subscription?: {
      id: string;
      status: string;
      plan: string;
      currentPeriodEnd: string;
    };
  };
}

export interface CancelPaypalSubscriptionInput {
  reason?: string;
}

export interface CancelPaypalSubscriptionResponse {
  cancelPaypalSubscription: {
    success: boolean;
    message: string;
    canceledAt?: string;
    accessEndsAt?: string;
  };
}

// Google OAuth Types
export interface GetGoogleOAuthUrlResponse {
  getGoogleOauthUrl: SuccessType & {
    data?: string; // JSON string containing auth_url and state
  } | ErrorType & {
    errors?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface GoogleOAuthLoginInput {
  code: string;
  redirectUri: string;
}

export interface GoogleOAuthLoginResponse {
  googleOauthLogin: LoginSuccessType & {
    user: User & {
      authProvider?: string;
      googleId?: string;
    };
  } | ErrorType & {
    errors?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface LinkGoogleAccountInput {
  code: string;
  redirectUri: string;
}

export interface LinkGoogleAccountResponse {
  linkGoogleAccount: {
    success: boolean;
    message: string;
    errors?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface UnlinkGoogleAccountResponse {
  unlinkGoogleAccount: {
    success: boolean;
    message: string;
    errors?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// LinkedIn OAuth Types
export interface LinkedInOAuthLoginInput {
  code: string;
  redirectUri: string;
  role?: 'candidate' | 'recruiter';
}

export interface LinkedInOAuthLoginResponse {
  linkedinOauthLogin: LoginSuccessType & {
    user: User & {
      authProvider?: string;
      linkedinId?: string;
    };
    profileSetupRequired?: boolean;
  } | ErrorType & {
    errors?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// Google Calendar Types
export interface GoogleCalendarAuthType {
  authorizationUrl?: string;
  isConnected?: boolean;
  message: string;
  success: boolean;
}

export interface GetGoogleCalendarAuthUrlResponse {
  getGoogleCalendarAuthUrl: GoogleCalendarAuthType | ErrorType;
}

export interface ConnectGoogleCalendarInput {
  code: string;
  redirectUri: string;
}

export interface ConnectGoogleCalendarResponse {
  connectGoogleCalendar: GoogleCalendarAuthType | ErrorType;
}

export interface DisconnectGoogleCalendarResponse {
  disconnectGoogleCalendar: {
    success: boolean;
    message: string;
  };
}

// Interview Scheduling Types
export interface InterviewSlot {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'available' | 'selected' | 'expired';
  createdAt: string;
}

export interface Interview {
  id: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  interviewType?: 'in_person' | 'phone' | 'video_call';
  location?: string;
  videoCallLink?: string;
  additionalNotes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  confirmedAt?: string;
  recruiterCalendarEventId?: string;
  candidateCalendarEventId?: string;
  createdAt?: string;
  updatedAt?: string;
  application?: {
    id: string;
    status: string;
  };
  selectedSlot?: {
    id: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    status: string;
  };
}

export interface CreateInterviewSlotsInput {
  applicationId: string;
  interviewType: 'in_person' | 'phone' | 'video_call';
  location?: string;
  videoCallLink?: string;
  additionalNotes?: string;
  durationMinutes: number;
  timezone?: string; // IANA timezone string (e.g., "Asia/Karachi", "America/New_York")
  slots: Array<{
    startTime: string;
    endTime: string;
  }>;
}

export interface CreateInterviewSlotsResponse {
  createInterviewSlots: {
    success: boolean;
    message: string;
    slots?: InterviewSlot[];
  };
}

export interface SelectInterviewSlotInput {
  slotId: string;
}

export interface SelectInterviewSlotResponse {
  selectInterviewSlot: {
    __typename: 'InterviewSuccessType' | 'ErrorType';
    success: boolean;
    message: string;
    interview?: {
      id: string;
      status: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      videoCallLink?: string;
    };
  };
}

export interface CancelInterviewInput {
  interviewId: string;
  reason?: string;
}

export interface CancelInterviewResponse {
  cancelInterview: {
    success: boolean;
    message: string;
  };
}

export interface RescheduleInterviewInput {
  interviewId: string;
  newSlots: {
    startTime: string;
    endTime: string;
  };
  reason?: string;
  timezone?: string; // IANA timezone string (e.g., "Asia/Karachi", "America/New_York")
}

export interface RescheduleInterviewResponse {
  rescheduleInterview: {
    success: boolean;
    message: string;
  };
}

export interface SyncInterviewToCalendarResponse {
  syncInterviewToCalendar: {
    success: boolean;
    message: string;
  };
}

export interface InterviewSlotsResponse {
  interviewSlots: InterviewSlot[];
}

export interface AllInterviewSlotsResponse {
  allInterviewSlots: InterviewSlot[];
}

export interface MyInterviewsResponse {
  myInterviews: Interview[];
}

export interface UpcomingInterviewsResponse {
  upcomingInterviews: Interview[];
}

export interface ApplicationInterviewResponse {
  applicationInterview: Interview | null;
}

export interface InterviewResponse {
  interview: Interview;
}

export interface StripePublicKeyResponse {
  stripePublicKey: string;
}

// ===== JOB MATCH ENGINE TYPES =====

// Job Posting Types
export interface JobPosting {
  id: string;
  title: string;
  companyName: string;
  department?: string;
  description: string;
  responsibilities: string[];
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
  experienceLevel: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  yearsOfExperienceMin: number;
  yearsOfExperienceMax?: number;
  location: string;
  workMode: 'remote' | 'onsite' | 'hybrid';
  requiredSkills: string[];
  preferredSkills?: string[];
  requiredQualifications: string[];
  certifications?: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  benefits?: string[];
  industry?: string;
  applicationDeadline?: string;
  applicationEmail?: string;
  applicationInstructions?: string;
  applicationUrl?: string;
  status: 'draft' | 'active' | 'paused' | 'closed' | 'filled';
  applicationStatus?: string; // User's application status: pending, reviewed, shortlisted, interview, offered, rejected, withdrawn, accepted
  applicationId?: string; // The ID of the user's application if they have applied
  rejectionReason?: string; // Rejection reason if application was rejected
  viewsCount: number;
  applicationsCount: number;
  numberOfOpenings?: number;
  isFeatured?: boolean;
  publishedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  candidateMatch?: JobMatch; // Match data for the candidate viewing the job
  recruiter?: {
    id?: string;
    organizationName: string;
    organizationType?: string;
    companyName?: string;
    companyWebsite?: string;
    position?: string;
    industries?: string[];
    specializations?: string[];
    linkedinUrl?: string;
    profilePicture?: string;
    isVerified?: boolean;
    isActive?: boolean;
    subRole?: string;
    createdAt?: string;
    updatedAt?: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  };
}

// Job Match Types
export interface JobMatch {
  id: string;
  matchPercentage: number;
  skillsMatchScore: number;
  experienceMatchScore: number;
  qualificationsMatchScore: number;
  locationMatchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  extraSkills: string[];
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  isSaved: boolean;
  isApplied: boolean;
  applicationId?: string;
  viewedAt?: string;
  appliedAt?: string;
  jobPosting: JobPosting;
}

// Job Application Types
export interface JobApplication {
  id: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'interview_scheduled' | 'offered' | 'rejected' | 'withdrawn' | 'accepted';
  coverLetter?: string;
  resumeFile?: string;
  additionalDocuments?: string[];
  appliedAt: string;
  reviewedAt?: string;
  recruiterNotes?: string;
  rejectionReason?: string;
  jobPosting: JobPosting;
  jobMatch?: JobMatch;
  candidate?: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    title?: string;
    yearsOfExperience?: number;
  };
}

// Saved Job Types
export interface SavedJob {
  id: string;
  notes?: string;
  savedAt: string;
  jobPosting: JobPosting;
}

// Job Inputs
export interface CreateJobPostingInput {
  title: string;
  companyName: string;
  department?: string;
  description: string;
  responsibilities: string[];
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
  experienceLevel: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  yearsOfExperienceMin: number;
  yearsOfExperienceMax?: number;
  location: string;
  workMode: 'remote' | 'onsite' | 'hybrid';
  requiredSkills: string[];
  preferredSkills?: string[];
  requiredQualifications: string[];
  certifications?: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  benefits?: string[];
  industry?: string;
  applicationDeadline?: string;
  status?: 'draft' | 'active';
}

export interface UpdateJobPostingInput {
  jobId: string;
  title?: string;
  companyName?: string;
  department?: string;
  description?: string;
  responsibilities?: string[];
  jobType?: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
  experienceLevel?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  yearsOfExperienceMin?: number;
  yearsOfExperienceMax?: number;
  location?: string;
  workMode?: 'remote' | 'onsite' | 'hybrid';
  requiredSkills?: string[];
  preferredSkills?: string[];
  requiredQualifications?: string[];
  certifications?: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  benefits?: string[];
  industry?: string;
  applicationDeadline?: string;
  status?: 'draft' | 'active' | 'paused' | 'closed' | 'filled';
}

export interface ApplyToJobInput {
  jobId: string;
  coverLetter?: string;
  resumeBuilderId?: string;
  additionalDocuments?: string[];
}

export interface SaveJobInput {
  jobId: string;
  notes?: string;
}

// Job Response Types
export interface JobPostingSuccessType {
  __typename: 'JobPostingSuccessType';
  success: boolean;
  message: string;
  jobPosting: JobPosting;
}

export interface JobApplicationSuccessType {
  __typename: 'JobApplicationSuccessType';
  success: boolean;
  message: string;
  application: JobApplication;
}

export interface SavedJobSuccessType {
  __typename: 'SavedJobSuccessType';
  success: boolean;
  message: string;
  savedJob: SavedJob;
}

export interface CreateJobPostingResponse {
  createJobPosting: JobPostingSuccessType | ErrorType;
}

export interface UpdateJobPostingResponse {
  updateJobPosting: JobPostingSuccessType | ErrorType;
}

export interface DeleteJobPostingResponse {
  deleteJobPosting: SuccessType | ErrorType;
}

export interface ApplyToJobResponse {
  applyToJob: JobApplicationSuccessType | ErrorType;
}

export interface WithdrawApplicationResponse {
  withdrawApplication: SuccessType | ErrorType;
}

export interface ShortlistApplicationResponse {
  shortlistApplication: JobApplicationSuccessType | ErrorType;
}

export interface RejectApplicationResponse {
  rejectApplication: JobApplicationSuccessType | ErrorType;
}

export interface ShortlistApplicationInput {
  applicationId: string;
  recruiterNotes?: string;
}

export interface RejectApplicationInput {
  applicationId: string;
  rejectionReason?: string;
  recruiterNotes?: string;
}

export interface SaveJobResponse {
  saveJob: SavedJobSuccessType | ErrorType;
}

export interface UnsaveJobResponse {
  unsaveJob: SuccessType | ErrorType;
}

export interface JobPostingsResponse {
  jobPostings: JobPosting[];
}

export interface JobPostingResponse {
  jobPosting: JobPosting;
}

export interface MyJobPostingsResponse {
  myJobPostings: JobPosting[];
}

export interface MyJobMatchesResponse {
  myJobMatches: {
    matches: JobMatch[];
    totalCount: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface JobMatchResponse {
  jobMatch: JobMatch;
}

export interface MyApplicationsResponse {
  myApplications: JobApplication[];
}

export interface JobApplicationsResponse {
  jobApplications: JobApplication[];
}

export interface ShortlistedApplicationsResponse {
  shortlistedApplications: JobApplication[];
}

export interface RejectedApplicationsResponse {
  rejectedApplications: JobApplication[];
}

export interface MySavedJobsResponse {
  mySavedJobs: SavedJob[];
}

// ==================== Interview Coach Types ====================

export interface InterviewCoachQuestion {
  id: string;
  questionText: string;
  questionType: string;
  questionCategory: string;
  difficulty: string;
  orderIndex: number;
  expectedKeywords?: string[];
  idealResponsePoints?: string[];
  evaluationCriteria?: {
    strongAnswerIndicators?: string[];
    weakAnswerIndicators?: string[];
  };
  response?: InterviewCoachResponse;
}

export interface InterviewCoachVoiceMetrics {
  fillerAssessment: string;
  fillerWordCount: number;
  fillerWordsDetected: string[];
  paceAssessment: string;
  speakingPaceWpm: number;
  voiceConfidenceScore: number;
}

export interface InterviewCoachAnalysis {
  contentScore: number;
  relevanceScore: number;
  clarityScore: number;
  specificityScore: number;
  starMethodScore?: number;
  keywordsUsed?: string[];
  keywordsMissed?: string[];
  // Legacy nested fields for backward compatibility with UI
  keywordAnalysis?: {
    keywordsUsed?: string[];
    keywordsMissed?: string[];
  };
  feedback?: {
    strengths?: string[];
    improvements?: string[];
    suggestions?: string[];
  };
}

export interface InterviewCoachResponse {
  id: string;
  responseText: string;
  audioFileUrl?: string;
  durationSeconds?: number;
  isVoiceResponse: boolean;
  voiceMetrics?: InterviewCoachVoiceMetrics;
  submittedAt: string;
  analysis?: InterviewCoachAnalysis;
}

export interface InterviewCoachSession {
  id: string;
  interviewType: string;
  jobRole: string;
  industry: string;
  difficulty: string;
  mode: string;
  status: string;
  totalQuestions: number;
  overallScore?: number;
  createdAt: string;
  completedAt?: string;
  questions?: InterviewCoachQuestion[];
  report?: InterviewCoachSessionReport;
}

export interface InterviewCoachSessionReport {
  id: string;
  overallScore: number;
  contentAverage: number;
  communicationAverage: number;
  voiceAverage?: number | null;
  strongAreas: string[];
  weakAreas: string[];
  questionTypeScores: Record<string, number>;
  topImprovements: string[];
  practiceSuggestions: string[];
  resources?: string[];
  executiveSummary: string;
  detailedAnalysis: string;
  industryBenchmark?: number;
  percentileRank?: number;
  generatedAt?: string;
  createdAt?: string;
}

export interface InterviewCoachStats {
  totalSessions: number;
  completedSessions: number;
  averageScore: number | null;
  bestScore: number | null;
  totalQuestionsAnswered: number;
}

export interface InterviewTypeOption {
  value: string;
  label: string;
  description: string;
}

export interface DifficultyLevelOption {
  value: string;
  label: string;
  description: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

// Interview Coach Input Types
export interface StartInterviewSessionInput {
  interviewType?: string;  // behavioral, technical, situational, hr_cultural, mixed
  jobRole?: string;        // e.g., "Software Engineer"
  industry?: string;       // e.g., "Technology"
  mode?: string;           // text, voice, mixed
  numQuestions?: number;   // 3-20
  difficulty?: string;     // easy, medium, hard
  resumeId?: string;       // Optional - for personalized questions
  voiceId?: string;        // Optional - ElevenLabs voice ID
}

export interface SubmitTextResponseInput {
  sessionId: string;
  questionId: string;
  responseText: string;
}

export interface SubmitVoiceResponseInput {
  sessionId: string;
  questionId: string;
  audioBase64: string;
}

export interface SpeechToSpeechInput {
  audioBase64: string;
  targetVoiceId?: string;
  removeBackgroundNoise?: boolean;
  stability?: number;
  similarityBoost?: number;
  style?: number;
}

export interface SpeechToSpeechWithAnalysisInput {
  audioBase64: string;
  targetVoiceId?: string;
  removeBackgroundNoise?: boolean;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  sessionId?: string;
  questionId?: string;
}

export interface ConvertVoiceWithAnalysisResponse {
  convertVoiceWithAnalysis: {
    __typename: 'SpeechToSpeechWithAnalysisType' | 'ErrorType';
    success?: boolean;
    message?: string;
    originalAudioSize?: number;
    convertedAudioSize?: number;
    convertedAudioBase64?: string;
    targetVoiceId?: string;
    targetVoiceName?: string;
    transcribedText?: string;
    voiceMetrics?: InterviewCoachVoiceMetrics;
  };
}

// Interview Coach Response Types
export interface ResponseAnalysisType {
  id: string;
  overallScore: number;
  contentScore: number;
  communicationScore: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  suggestedResponse?: string;
}

export interface StartInterviewSessionResponse {
  startInterviewSession: {
    __typename: 'InterviewCoachSessionSuccessType' | 'ErrorType';
    success: boolean;
    message: string;
    questions?: Array<{
      id: string;
      questionText: string;
      questionType: string;
      questionCategory?: string;
      difficulty?: string;
      orderIndex: number;
      idealResponsePoints?: string[];
      audioUrl?: string;  // For voice mode
    }>;
    session?: {
      id: string;
      interviewType: string;
      jobRole: string;
      industry: string;
      difficulty: string;
      mode: string;
      status: string;
      totalQuestions: number;
      completedQuestions?: number;
      overallScore?: number | null;
      startedAt?: string;
      completedAt?: string | null;
      createdAt?: string;
      updatedAt?: string;
    };
  } | null;
}

export interface SubmitTextResponseResponse {
  submitTextResponse: {
    __typename: 'SubmitResponseSuccessType' | 'ErrorType';
    success: boolean;
    message: string;
    responseId?: string;
    analysisPending?: boolean;
    analysisStatus?: string;  // "pending", "processing", "completed", "failed"
    analysis?: ResponseAnalysisType;
  };
}

export interface SubmitVoiceResponseResponse {
  submitVoiceResponse: {
    __typename: 'SubmitResponseSuccessType' | 'ErrorType';
    success?: boolean;
    message?: string;
    responseId?: string;
    analysisPending?: boolean;
    analysisStatus?: string;  // "pending", "processing", "completed", "failed"
    analysis?: ResponseAnalysisType;
    voiceMetrics?: InterviewCoachVoiceMetrics;
  };
}

export interface SessionReport {
  id: string;
  overallScore: number;
  contentAverage: number;
  communicationAverage: number;
  voiceAverage: number | null;
  strongAreas: string[];
  weakAreas: string[];
  questionTypeScores: Record<string, number>;
  topImprovements: string[];
  practiceSuggestions: string[];
  resources: string[];
  executiveSummary: string;
  detailedAnalysis: string;
  industryBenchmark: number;
  percentileRank: number;
  generatedAt: string;
  createdAt: string;
}

export interface CompleteSessionResponse {
  completeSessionAndGenerateReport: {
    __typename: string;
    success: boolean;
    message: string;
    report?: SessionReport;
  };
}

export interface AbandonSessionResponse {
  abandonSession: {
    __typename: string;
    success?: boolean;
    message?: string;
  };
}

export interface ConvertVoiceResponse {
  convertVoice: {
    __typename: string;
    success?: boolean;
    message?: string;
    originalAudioSize?: number;
    convertedAudioSize?: number;
    convertedAudioBase64?: string;
    targetVoiceId?: string;
    targetVoiceName?: string;
  };
}

export interface InterviewCoachSessionsResponse {
  interviewCoachSessions: InterviewCoachSession[];
}

export interface InterviewCoachSessionResponse {
  interviewCoachSession: InterviewCoachSession;
}

export interface GetNextQuestionResponse {
  getNextQuestion: InterviewCoachQuestion | null;
}

export interface InterviewCoachStatsResponse {
  interviewCoachStats: InterviewCoachStats;
}

export interface AvailableInterviewTypesResponse {
  availableInterviewTypes: string[];
}

export interface AvailableDifficultyLevelsResponse {
  availableDifficultyLevels: string[];
}

export interface AvailableVoicesResponse {
  availableVoices: VoiceOption[];
}

// Onboarding Status Types
export interface OnboardingStatus {
  subscriptionComplete: boolean;
  profileSetupComplete: boolean;
  cvUploadComplete: boolean;
  currentStep: 'subscription' | 'profile' | 'cv' | 'complete';
}

export interface OnboardingStatusResponse {
  onboardingStatus: OnboardingStatus;
}

export interface UpdateOnboardingStepInput {
  step: 'subscription' | 'profile' | 'cv';
  completed: boolean;
}

export interface UpdateOnboardingStepResponse {
  updateOnboardingStep: {
    success: boolean;
    message: string;
    currentStep: string;
  };
}

// Profile Progress Types
export interface ProfileSection {
  name: string;
  displayName: string;
  points: number;
  completed: boolean;
  required: boolean;
}

export interface ProfileProgress {
  totalPoints: number;
  maxPoints: number;
  completionPercentage: number;
  sections: ProfileSection[];
}

export interface ProfileProgressResponse {
  profileProgress: ProfileProgress;
}

export interface AwardProfilePointsInput {
  section: string;
}

export interface AwardProfilePointsResponse {
  awardProfilePoints: {
    success: boolean;
    message: string;
    pointsAwarded: number;
    totalPoints: number;
    badge: string | null;
  };
}

export interface UpdatePersonalInfoInput {
  fullName?: string;
  phoneNumber?: string;
  jobTitle?: string;
  workplace?: string;
}

export interface UpdatePersonalInfoResponse {
  updatePersonalInfo: SuccessType | ErrorType;
}

// CRS (Career Readiness Score) types
export interface Badge {
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
}

export interface CRSData {
  id: string;
  totalScore: number;
  level: string;
  levelDisplay: string;
  cvQualityScore: number;
  skillsEvidenceScore: number;
  interviewReadinessScore: number;
  marketAlignmentScore: number;
  engagementConsistencyScore: number;
  wellbeingStabilityScore: number;
  pointsToNextLevel: number;
  nextLevel: string | null;
  statusMessage: string;
  lastCalculatedAt: string;
}

export interface MyCRSResponse {
  myCrs: CRSData | null;
}

export interface CRSDashboard {
  crs: {
    totalScore: number;
    level: string;
    levelDisplay: string;
  } | null;
  trend: string;
  trendDescription: string;
  primaryRecommendation: string;
  secondaryRecommendations: string[];
  daysOnPlatform: number;
  totalImprovements: number;
}

export interface CRSDashboardResponse {
  crsDashboard: CRSDashboard;
}

// Career Dashboard Full types
export interface CareerDashboardWellbeing {
  consistencyDescription: string;
  consistencyDisplay: string;
  consistencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  moodDescription: string;
  moodDisplay: string;
  moodLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  overallScore: number;
  productivityDescription: string;
  productivityDisplay: string;
  productivityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CareerDashboardMonthlyData {
  activities: number;
  cvStrength: number;
  month: string;
  monthFull: string;
  skillsMatch: number;
  year: number;
}

export interface CareerDashboardScoreProgress {
  currentActivities: number;
  currentCvStrength: number;
  currentSkillsMatch: number;
  dataPointsCount: number;
  timeframe: 'WEEKLY' | 'MONTHLY';
  monthlyData: CareerDashboardMonthlyData[];
}

export interface CareerDashboardQuickStat {
  change: string | null;
  changeIsPositive: boolean | null;
  label: string;
  value: string;
}

export interface CareerDashboardFull {
  currentLevel: string;
  currentLevelDisplay: string;
  daysOnPlatform: number;
  nextMilestone: string;
  pointsToNextLevel: number;
  primaryRecommendation: string;
  totalCrsScore: number;
  userName: string;
  wellbeing: CareerDashboardWellbeing;
  scoreProgress: CareerDashboardScoreProgress;
  quickStats: CareerDashboardQuickStat[];
}

export interface CareerDashboardFullResponse {
  careerDashboardFull: CareerDashboardFull | null;
}

export interface CareerDashboardFullInput {
  months?: number;
  timeframe?: 'WEEKLY' | 'MONTHLY';
}

// Recent Activity types
export interface RecentActivityItem {
  id: string;
  activityType: 'CV_UPLOAD' | 'PRACTICE_SESSION' | 'JOB_MATCH' | 'MISSION_COMPLETED' | 'APPLICATION_SUBMITTED';
  title: string;
  description: string;
  timestamp: string;
  relativeTime: string;
  actionUrl?: string;
  actionLabel: string;
  metadata?: Record<string, any>;
}

export interface RecentActivityData {
  activities: RecentActivityItem[];
  totalCount: number;
  hasMore: boolean;
}

export interface RecentActivityResponse {
  recentActivity: RecentActivityData;
}

export interface RecentActivityInput {
  limit?: number;
  offset?: number;
}

// Feature Gating types
export interface FeatureInfo {
  featureId: string;
  featureName: string;
  featureDescription: string;
}

export interface LockedFeature {
  featureId: string;
  featureName: string;
  requiredLevel: string;
  requiredLevelDisplay: string;
}

export interface NextFeature {
  featureId: string;
  featureName: string;
  requiredLevel: string;
}

export interface FeatureGates {
  availableFeatures: FeatureInfo[];
  lockedFeatures: LockedFeature[];
  nextFeatures: NextFeature[];
  totalAvailable: number;
  totalLocked: number;
  currentLevel: string;
  currentLevelDisplay: string;
}

export interface FeatureGatesResponse {
  featureGates: FeatureGates;
}

export interface HasFeatureAccessResponse {
  hasFeatureAccess: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  missionType: string;
  missionTypeDisplay: string;
  difficulty: string;
  difficultyDisplay: string;
  status: string;
  statusDisplay: string;
  progressPercentage: number;
  crsPointsReward: number;
  badgeReward: string | null;
  aiReasoning: string | null;
  targetComponent: string | null;
  estimatedTimeMinutes: number | null;
  successCriteria: string | null;
  assignedAt: string;
  dueDate: string;
  completedAt: string | null;
  daysRemaining: number | null;
  isOverdue: boolean;
}

export interface MyMissionsResponse {
  myMissions: {
    missions: Mission[];
    totalCount: number;
    activeCount: number;
    completedCount: number;
    hasMore: boolean;
  };
}

export interface ActiveMissionsResponse {
  activeMissions: Mission[];
}

// Notification types
export interface NotificationType {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  category: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  relatedJobId?: string;
  relatedApplicationId?: string;
  relatedMissionId?: string;
  relatedSubscriptionId?: string;
  relatedCrsId?: string;
  createdAt: string;
}

export interface MyNotificationsInput {
  page?: number;
  pageSize?: number;
  category?: string;
  isRead?: boolean;
}

export interface MyNotificationsResponse {
  myNotifications: {
    notifications: NotificationType[];
    totalCount: number;
    unreadCount: number;
  };
}

export interface UnreadNotificationCountResponse {
  unreadNotificationCount: number;
}

// =============================================
// AI Features Types - Missions, Chatbot, Cover Letter
// =============================================

// Mission Mutation Types
export interface GenerateWeeklyMissionsResponse {
  generateWeeklyMissions: {
    __typename: 'MissionSuccessType' | 'ErrorType';
    success: boolean;
    message: string;
    mission?: Mission;
  };
}

export interface CompleteMissionInput {
  missionId: string;
  evidenceDescription?: string;
  rating?: number;
  feedback?: string;
}

export interface CompleteMissionResponse {
  completeMission: {
    __typename: 'MissionCompletionSuccessType' | 'ErrorType';
    success: boolean;
    message: string;
    mission?: {
      id: string;
      status: string;
      completedAt?: string;
    };
    crsPointsAwarded?: number;
    newCrsScore?: number;
  };
}

export interface SkipMissionInput {
  missionId: string;
  reason?: string;
}

export interface SkipMissionResponse {
  skipMission: {
    __typename: 'MissionSuccessType' | 'ErrorType';
    success: boolean;
    message: string;
    mission?: Mission;
  };
}

export interface UpdateMissionProgressInput {
  missionId: string;
  progressPercentage: number;
}

export interface UpdateMissionProgressResponse {
  updateMissionProgress: {
    __typename: 'MissionSuccessType' | 'ErrorType';
    success: boolean;
    message: string;
    mission?: Mission;
  };
}

export interface RateMissionInput {
  missionId: string;
  rating: number;
  feedback?: string;
}

export interface RateMissionResponse {
  rateMission: {
    __typename: 'SuccessType' | 'ErrorType';
    success: boolean;
    message: string;
  };
}

export interface WeeklyMissionsInput {
  weekNumber?: number;
  year?: number;
}

export interface MissionCompletion {
  id: string;
  completionMethod?: string;
  crsPointsAwarded?: number;
  badgeAwarded?: string;
  aiFeedback?: string;
  userRating?: number;
  userFeedback?: string;
  completedAt?: string;
}

export interface WeeklyMission extends Mission {
  aiReasoning?: string;
  targetComponent?: string;
  estimatedTimeMinutes?: number;
  successCriteria?: string;
  completedAt?: string;
  completion?: MissionCompletion;
}

export interface WeeklyMissionsData {
  weekNumber: number;
  year: number;
  missions: WeeklyMission[];
  totalPointsAvailable: number;
  pointsEarned: number;
  completionRate: number;
}

export interface WeeklyMissionsResponse {
  weeklyMissions: WeeklyMissionsData;
}

export interface MissionStatsResponse {
  missionStats: {
    totalCompleted: number;
    totalPointsEarned: number;
    currentStreak: number;
    bestStreak: number;
  };
}

export interface MissionDetailsResponse {
  missionDetails: WeeklyMission;
}

export interface MyMissionsInput {
  status?: string;
  limit?: number;
  offset?: number;
}

// RAY AI Chatbot Types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  conversationId: string;
  metadata?: {
    tokens?: number;
    processingTime?: number;
  };
}

export interface Conversation {
  id: string;
  title: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  lastMessageAt?: string | null;
  messageCount?: number;
}

export interface SendTextMessageInput {
  conversationId?: string;
  content: string;
}

export interface ChatMessageData {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
  audioUrl?: string;      // For voice messages - user's audio
  ttsAudioUrl?: string;   // For voice messages - AI's TTS response
}

export interface SendTextMessageResponse {
  sendTextMessage: {
    __typename: 'SendMessageSuccessType' | 'ErrorType';
    success?: boolean;
    message?: string;
    conversationId?: string;
    userMessage?: ChatMessageData;
    assistantMessage?: ChatMessageData;
  };
}

export interface SendVoiceMessageInput {
  conversationId?: string;
  audioBase64: string;
}

export interface SendVoiceMessageResponse {
  sendVoiceMessage: {
    __typename: 'SendMessageSuccessType' | 'ErrorType';
    success?: boolean;
    message?: string;
    conversationId?: string;
    userMessage?: ChatMessageData;
    assistantMessage?: ChatMessageData;
  };
}

export interface CreateConversationInput {
  title?: string;
}

export interface CreateConversationResponse {
  createConversation: {
    __typename: 'ConversationSuccessType' | 'ErrorType';
    success?: boolean;
    message?: string;
    conversation?: Conversation;
  };
}

export interface UpdateConversationInput {
  conversationId: string;
  title: string;
}

export interface UpdateConversationResponse {
  updateConversation: {
    __typename: 'ConversationSuccessType' | 'ErrorType';
    success?: boolean;
    message?: string;
    conversation?: Conversation;
  };
}

export interface ArchiveConversationInput {
  conversationId: string;
}

export interface ArchiveConversationResponse {
  archiveConversation: {
    __typename: 'ConversationSuccessType' | 'ErrorType';
    success?: boolean;
    message?: string;
    conversation?: Conversation;
  };
}

export interface DeleteConversationInput {
  conversationId: string;
}

export interface DeleteConversationResponse {
  deleteConversation: {
    __typename: 'ConversationSuccessType' | 'ErrorType';
    success?: boolean;
    message?: string;
  };
}

// Updated conversation queries to match new backend schema
export interface GetConversationsInput {
  status?: 'active' | 'archived' | null;
  limit?: number;
  offset?: number;
}

export interface GetConversationsResponse {
  myConversations: {
    __typename: 'ConversationListType' | 'ErrorType';
    conversations?: Conversation[];
    totalCount?: number;
    hasNext?: boolean;
    message?: string;
  };
}

export interface GetConversationInput {
  conversationId: string;
}

export interface GetConversationResponse {
  conversation: {
    __typename: 'ConversationSuccessType' | 'ErrorType';
    success?: boolean;
    conversation?: Conversation;
    message?: string;
  };
}

export interface GetConversationMessagesInput {
  conversationId: string;
  limit?: number;
  beforeId?: string | null;
}

export interface GetConversationMessagesResponse {
  conversationMessages: {
    __typename: 'MessageListType' | 'ErrorType';
    messages?: ChatMessageData[];
    hasMore?: boolean;
    message?: string;
  };
}

// Chat document types
export interface ChatDocument {
  id: string;
  fileName: string;
  documentType: string;
  status: string;
  createdAt: string;
}

export interface GetChatDocumentsInput {
  conversationId: string;
  limit?: number;
}

export interface GetChatDocumentsResponse {
  chatDocuments: ChatDocument[];
}

export interface DocumentUploadInput {
  conversationId: string;
  documentBase64: string;
  fileName: string;
  fileType: string;
}

export interface DocumentUploadResponse {
  uploadDocument: {
    __typename: 'DocumentType' | 'ErrorType';
    success?: boolean;
    message?: string;
    id?: string;
    fileName?: string;
    processedAt?: string;
  };
}

// Cover Letter Generator Types
export interface GenerateCoverLetterInput {
  // Resume (optional - backend auto-fetches from user profile if not provided)
  resumeFileName?: string;
  resumeFileData?: string; // Base64 encoded file

  // Job description (at least one required)
  jobDescriptionFileName?: string;
  jobDescriptionFileData?: string; // Base64 encoded file
  jobDescriptionText?: string; // Plain text - use this for job description
}

export interface CoverLetterGeneration {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generatedCoverLetter?: string;
  coverLetterPdfUrl?: string;
  errorMessage?: string;
}

export interface GenerateCoverLetterResponse {
  generateCoverLetter: {
    __typename: 'CoverLetterGenerationSuccessType' | 'ErrorType';
    success?: boolean;
    message?: string;
    generation?: CoverLetterGeneration;
  };
}

export interface GetCoverLetterGenerationResponse {
  coverLetterGeneration: CoverLetterGeneration | null;
}

export interface NotificationResponse {
  notification: NotificationType;
}

export interface MarkNotificationAsReadResponse {
  markNotificationAsRead: {
    success: boolean;
    message: string;
    notification?: {
      id: string;
      isRead: boolean;
      readAt?: string;
    };
  };
}

export interface MarkAllNotificationsAsReadResponse {
  markAllNotificationsAsRead: {
    success: boolean;
    message: string;
  };
}

export interface DeleteNotificationResponse {
  deleteNotification: {
    success: boolean;
    message: string;
  };
}

// Default timeout for API requests (30 seconds)
const DEFAULT_TIMEOUT = 30000;

// Extended timeout for long-running operations like AI generation (3 minutes)
const EXTENDED_TIMEOUT = 180000;

// Endpoints that require extended timeout
const EXTENDED_TIMEOUT_ENDPOINTS = [
  'startInterviewSession',
  'generateCoverLetter',
  'generateWeeklyMissions',
  'analyzeResume',
];

// Custom fetch with timeout for large payloads (like voice messages)
const fetchWithTimeout = async (input: RequestInfo, init?: RequestInit) => {
  const timeout = 60000; // 60 seconds timeout for large payloads
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Base fetch query with headers
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  fetchFn: fetchWithTimeout,
  prepareHeaders: async (headers, { getState, endpoint }) => {
    headers.set('Content-Type', 'application/json');

    // Get tokens from Redux state first
    const state = (getState() as any).auth;
    let token = state.token;
    let refreshToken = state.refreshToken;

    console.log('PrepareHeaders - Endpoint:', endpoint);
    console.log('PrepareHeaders - Redux token exists:', !!token);

    // Fallback to SecureStore if Redux token is not available
    // This handles the case where tokens are stored during profile setup but Redux isn't set yet
    if (!token) {
      console.log('PrepareHeaders - Checking SecureStore for token...');
      token = await getAccessToken();
      refreshToken = await getRefreshToken();
      console.log('PrepareHeaders - SecureStore token exists:', !!token);
    }

    if (token) {
      // Check token format
      const tokenPreview = token.substring(0, 20) + '...';
      console.log('PrepareHeaders - Token preview:', tokenPreview);
      console.log('PrepareHeaders - Token length:', token.length);

      headers.set('Authorization', `Bearer ${token}`);
      console.log('PrepareHeaders - Authorization header set with Bearer token');
    } else {
      console.warn('PrepareHeaders - No token found in Redux state or SecureStore!');
    }

    // For logout, also send refresh token in custom header
    if (endpoint === 'logout' && refreshToken) {
      headers.set('X-Refresh-Token', refreshToken);
    }

    return headers;
  },
});

// Custom baseQuery with automatic token refresh and timeout support
const baseQueryWithReauth: typeof baseQuery = async (args, api, extraOptions) => {
  // Check if this endpoint needs extended timeout
  const endpoint = api.endpoint;
  const needsExtendedTimeout = EXTENDED_TIMEOUT_ENDPOINTS.includes(endpoint);
  const timeout = needsExtendedTimeout ? EXTENDED_TIMEOUT : DEFAULT_TIMEOUT;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  // Merge signal with existing args
  const argsWithSignal = typeof args === 'string'
    ? { url: args, signal: controller.signal }
    : { ...args, signal: controller.signal };

  try {
    let result = await baseQuery(argsWithSignal, api, extraOptions);

    // Check for authentication errors in GraphQL response
    const data = result.data as any;

    // Only check for explicit auth-related error messages, not just null data
    const hasAuthError = data?.errors?.some((e: any) => {
      const msg = e.message?.toLowerCase() || '';
      const isAuthError = msg.includes('authentication') ||
        msg.includes('not authenticated') ||
        msg.includes('invalid token') ||
        msg.includes('token expired') ||
        msg.includes('please log in');
      if (isAuthError) {
        console.log('🔐 [baseQueryWithReauth] Auth error detected:', e.message);
      }
      return isAuthError;
    });

    // Log all GraphQL errors for debugging
    if (data?.errors) {
      console.log('⚠️ [baseQueryWithReauth] GraphQL errors:', JSON.stringify(data.errors, null, 2));
    }

    if (hasAuthError || result.error?.status === 401) {
      console.log('Auth error detected, attempting token refresh...');

      // Try to refresh the token
      const state = api.getState() as any;
      const refreshTokenValue = state.auth?.refreshToken;

      if (refreshTokenValue) {
        console.log('Attempting token refresh with refresh token');

        const refreshResult = await baseQuery(
          {
            url: '/graphql/',
            method: 'POST',
            body: {
              query: `
                mutation RefreshToken($input: RefreshTokenInput!) {
                  refreshToken(input: $input) {
                    ... on RefreshTokenSuccessType {
                      __typename
                      success
                      message
                      accessToken
                      refreshToken
                    }
                    ... on ErrorType {
                      __typename
                      success
                      message
                    }
                  }
                }
              `,
              variables: { input: { refreshToken: refreshTokenValue } },
            },
          },
          api,
          extraOptions
        );

        const refreshData = (refreshResult.data as any)?.data?.refreshToken;

        if (refreshData?.__typename === 'RefreshTokenSuccessType') {
          console.log('Token refresh successful, updating tokens');

          // Update tokens in Redux store
          const { updateTokens } = await import('../store/slices/authSlice');
          api.dispatch(updateTokens({
            token: refreshData.accessToken,
            refreshToken: refreshData.refreshToken,
          }));

          // Retry the original request with new token
          console.log('Retrying original request with new token');
          result = await baseQuery(argsWithSignal, api, extraOptions);
        } else {
          console.log('Token refresh failed, logging out');
          // Refresh failed, logout user
          const { logout } = await import('../store/slices/authSlice');
          api.dispatch(logout());
        }
      } else {
        console.log('No refresh token available, logging out');
        const { logout } = await import('../store/slices/authSlice');
        api.dispatch(logout());
      }
    }

    return result;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Create the API
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Profile', 'Resume', 'Subscription', 'GoogleCalendar', 'Interviews', 'Jobs', 'JobMatches', 'Applications', 'SavedJobs', 'InterviewCoach', 'Onboarding', 'User', 'CRS', 'Missions', 'Notifications'],
  endpoints: (builder) => ({
    registerCandidate: builder.mutation<RegisterCandidateResponse, RegisterCandidateInput>({
      query: (input) => {
        const body = {
          query: `
            mutation CreateCandidate($input: RegisterAsCandidateInput!) {
              createCandidate(input: $input) {
                ... on LoginSuccessType {
                  __typename
                  message
                  success
                  accessToken
                  refreshToken
                  role
                  user {
                    id
                    email
                    phoneNumber
                    firstName
                    lastName
                    role
                    isVerified
                  }
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making candidate registration request to:', `${API_URL}/graphql/`);
        console.log('Request body:', JSON.stringify(body, null, 2));
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('Candidate registration response received:', response);
        return response.data;
      },
      transformErrorResponse: (response: any, meta, arg) => {
        console.log('Error response:', response);
        console.log('Error status:', response?.status);
        console.log('Error data:', JSON.stringify(response?.data));
        console.log('Error meta:', meta);
        return response;
      },
      invalidatesTags: ['Auth'],
    }),
    registerRecruiter: builder.mutation<RegisterRecruiterResponse, RegisterRecruiterInput>({
      query: (input) => {
        const body = {
          query: `
            mutation CreateRecruiter($input: RegisterAsRecruiterInput!) {
              createRecruiter(input: $input) {
                ... on LoginSuccessType {
                  __typename
                  message
                  success
                  accessToken
                  refreshToken
                  role
                  user {
                    id
                    email
                    phoneNumber
                    firstName
                    lastName
                    role
                    isVerified
                  }
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making recruiter registration request to:', `${API_URL}/graphql/`);
        console.log('Request body:', JSON.stringify(body, null, 2));
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('Recruiter registration response received:', response);
        return response.data;
      },
      invalidatesTags: ['Auth'],
    }),
    login: builder.mutation<LoginResponse, LoginInput>({
      query: (input) => {
        const body = {
          query: `
            mutation Login($input: LoginInput!) {
              login(input: $input) {
                ... on LoginSuccessType {
                  __typename
                  success
                  message
                  accessToken
                  refreshToken
                  role
                  user {
                    id
                    email
                    firstName
                    lastName
                    phoneNumber
                    role
                    isVerified
                  }
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making login request to:', `${API_URL}/graphql/`);
        console.log('Login request body:', JSON.stringify(body, null, 2));
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('Login response received:', response);
        return response.data;
      },
      invalidatesTags: ['Auth'],
    }),
    verifyToken: builder.query<VerifyTokenResponse, void>({
      query: () => {
        const body = {
          query: `
            query VerifyToken {
              verifyToken {
                ... on TokenVerificationSuccessType {
                  __typename
                  valid
                  role
                  user {
                    id
                    email
                    firstName
                    lastName
                    phoneNumber
                    role
                    isVerified
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
        };
        console.log('Making token verification request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('Token verification response received:', response);
        return response.data;
      },
      providesTags: ['Auth'],
    }),
    refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenInput>({
      query: (input) => {
        const body = {
          query: `
            mutation RefreshToken($input: RefreshTokenInput!) {
              refreshToken(input: $input) {
                ... on RefreshTokenSuccessType {
                  __typename
                  success
                  message
                  accessToken
                  refreshToken
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making refresh token request to:', `${API_URL}/graphql/`);
        console.log('Refresh token request body:', JSON.stringify(body, null, 2));
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('Refresh token response received:', response);
        return response.data;
      },
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<LogoutResponse, void>({
      query: () => {
        const body = {
          query: `
            mutation Logout {
              logout {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
        };
        console.log('Making logout request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('Logout response received:', response);
        return response.data;
      },
      invalidatesTags: ['Auth'],
    }),
    // Education mutations
    addEducation: builder.mutation<AddEducationResponse, EducationInput>({
      query: (input) => {
        const body = {
          query: `
            mutation AddEducation($input: EducationInput!) {
              addEducation(input: $input) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making addEducation request to:', `${API_URL}/graphql/`);
        console.log('Request body:', JSON.stringify(body, null, 2));
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('AddEducation response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    updateEducation: builder.mutation<UpdateEducationResponse, UpdateEducationInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UpdateEducation($input: UpdateEducationInput!) {
              updateEducation(input: $input) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making updateEducation request to:', `${API_URL}/graphql/`);
        console.log('Request body:', JSON.stringify(body, null, 2));
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UpdateEducation response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    deleteEducation: builder.mutation<DeleteEducationResponse, DeleteEducationInput>({
      query: ({ index }) => {
        const body = {
          query: `
            mutation DeleteEducation($index: Int!) {
              deleteEducation(index: $index) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { index },
        };
        console.log('Making deleteEducation request to:', `${API_URL}/graphql/`);
        console.log('Request body:', JSON.stringify(body, null, 2));
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('DeleteEducation response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Experience mutations
    addExperience: builder.mutation<AddExperienceResponse, AddExperienceInput>({
      query: (input) => {
        const body = {
          query: `
            mutation AddExperience($input: ExperienceInput!) {
              addExperience(input: $input) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making addExperience request to:', `${API_URL}/graphql/`);
        console.log('Request body:', JSON.stringify(body, null, 2));
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('AddExperience response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    updateExperience: builder.mutation<UpdateExperienceResponse, UpdateExperienceInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UpdateExperience($input: UpdateExperienceInput!) {
              updateExperience(input: $input) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making updateExperience request to:', `${API_URL}/graphql/`);
        console.log('Request body:', JSON.stringify(body, null, 2));
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UpdateExperience response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    deleteExperience: builder.mutation<DeleteExperienceResponse, DeleteExperienceInput>({
      query: (input) => {
        const body = {
          query: `
            mutation DeleteExperience($index: Int!) {
              deleteExperience(index: $index) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: input,
        };
        console.log('Making deleteExperience request to:', `${API_URL}/graphql/`);
        console.log('Request body:', JSON.stringify(body, null, 2));
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('DeleteExperience response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Get candidate profile
    getCandidateProfile: builder.query<GetCandidateProfileResponse, void>({
      query: () => {
        const body = {
          query: `
            query GetMyProfile {
              myProfile {
                ... on CandidateType {
                  __typename
                  id
                  createdAt
                  education
                  expectedSalary
                  experience
                  experienceLevel
                  githubUrl
                  hobbies
                  isActive
                  linkedinUrl
                  lookingForJob
                  portfolioUrl
                  preferredLocations {
                    city
                    country
                    workTypes
                    employmentType
                  }
                  resumeUrl
                  skills
                  title
                  workplace
                  updatedAt
                  profilePicture
                  certifications
                  extraCurricular
                  leadershipSocial
                  user {
                    bio
                    dateJoined
                    email
                    firstName
                    fullName
                    id
                    isVerified
                    lastName
                    phoneNumber
                    profilePictureUrl
                    role
                    updatedAt
                  }
                  yearsOfExperience
                }
              }
            }
          `,
        };
        console.log('Making getCandidateProfile request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('GetCandidateProfile response received:', response);
        if (response.data?.myProfile) {
          // Parse JSON fields if they're strings
          const profile = response.data.myProfile;
          if (typeof profile.education === 'string') {
            profile.education = profile.education.trim() ? JSON.parse(profile.education) : [];
            console.log('Parsed education data:', profile.education);
          }
          if (typeof profile.experience === 'string') {
            profile.experience = profile.experience.trim() ? JSON.parse(profile.experience) : [];
            console.log('Parsed experience data:', profile.experience);
          }
          if (typeof profile.skills === 'string') {
            profile.skills = profile.skills.trim() ? JSON.parse(profile.skills) : [];
          }
          if (typeof profile.hobbies === 'string') {
            profile.hobbies = profile.hobbies.trim() ? JSON.parse(profile.hobbies) : [];
          }
          // preferredLocations now comes as nested objects from GraphQL, no parsing needed
          if (!Array.isArray(profile.preferredLocations)) {
            profile.preferredLocations = [];
          }
          if (typeof profile.certifications === 'string') {
            profile.certifications = profile.certifications.trim() ? JSON.parse(profile.certifications) : [];
            console.log('Parsed certifications data:', profile.certifications);
          }
          if (typeof profile.extraCurricular === 'string') {
            profile.extraCurricular = profile.extraCurricular.trim() ? JSON.parse(profile.extraCurricular) : [];
            console.log('Parsed extraCurricular data:', profile.extraCurricular);
          }
          if (typeof profile.leadershipSocial === 'string') {
            profile.leadershipSocial = profile.leadershipSocial.trim() ? JSON.parse(profile.leadershipSocial) : [];
            console.log('Parsed leadershipSocial data:', profile.leadershipSocial);
          }
          console.log('Transformed profile data:', {
            educationCount: profile.education?.length || 0,
            experienceCount: profile.experience?.length || 0,
            skillsCount: profile.skills?.length || 0,
            hobbiesCount: profile.hobbies?.length || 0,
            certificationsCount: profile.certifications?.length || 0,
            extraCurricularCount: profile.extraCurricular?.length || 0,
            leadershipSocialCount: profile.leadershipSocial?.length || 0,
            preferredLocationsCount: profile.preferredLocations?.length || 0,
          });
          console.log('Parsed preferredLocations:', profile.preferredLocations);
          return { myProfile: { __typename: 'CandidateType', ...profile } };
        }
        return response.data;
      },
      providesTags: ['Profile'],
    }),
    // Get recruiter profile
    getRecruiterProfile: builder.query<GetRecruiterProfileResponse, void>({
      query: () => {
        const body = {
          query: `
            query GetMyProfile {
              myProfile {
                ... on RecruiterType {
                  id
                  organizationName
                  organizationType
                  subRole
                  position
                  companyName
                  companyWebsite
                  linkedinUrl
                  industries
                  specializations
                  isVerified
                  isActive
                  createdAt
                  updatedAt
                  profilePicture
                  user {
                    id
                    email
                    firstName
                    lastName
                    phoneNumber
                    bio
                    role
                    isVerified
                    fullName
                    profilePictureUrl
                  }
                }
              }
            }
          `,
        };
        console.log('Making getRecruiterProfile request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('GetRecruiterProfile response received:', response);
        if (response.data?.myProfile) {
          const profile = response.data.myProfile;
          // Parse JSON fields if they're strings
          if (typeof profile.industries === 'string') {
            profile.industries = profile.industries.trim() ? JSON.parse(profile.industries) : [];
          }
          if (typeof profile.specializations === 'string') {
            profile.specializations = profile.specializations.trim() ? JSON.parse(profile.specializations) : [];
          }
          return { recruiter: { __typename: 'RecruiterType', ...profile } };
        }
        return response.data;
      },
      providesTags: ['Profile'],
    }),
    // Update candidate profile (for URLs, title, salary, etc.)
    updateCandidateProfile: builder.mutation<UpdateCandidateProfileResponse, UpdateCandidateProfileInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UpdateCandidateProfile($input: UpdateCandidateInput!) {
              updateCandidateProfile(input: $input) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making updateCandidateProfile request');
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UpdateCandidateProfile response:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Skills mutations
    addSkill: builder.mutation<AddSkillResponse, AddSkillInput>({
      query: (input) => {
        const body = {
          query: `
            mutation AddSkill($skill: String!) {
              addSkill(skill: $skill) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: input,
        };
        console.log('Making addSkill request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('AddSkill response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    removeSkill: builder.mutation<RemoveSkillResponse, RemoveSkillInput>({
      query: (input) => {
        const body = {
          query: `
            mutation RemoveSkill($skill: String!) {
              removeSkill(skill: $skill) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: input,
        };
        console.log('Making removeSkill request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('RemoveSkill response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    updateSkills: builder.mutation<UpdateSkillsResponse, UpdateSkillsInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UpdateSkills($skills: [String!]!) {
              updateSkills(skills: $skills) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: input,
        };
        console.log('Making updateSkills request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UpdateSkills response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Hobbies mutations
    addHobby: builder.mutation<AddHobbyResponse, AddHobbyInput>({
      query: (input) => {
        const body = {
          query: `
            mutation AddHobby($hobby: String!) {
              addHobby(hobby: $hobby) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: input,
        };
        console.log('Making addHobby request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('AddHobby response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    removeHobby: builder.mutation<RemoveHobbyResponse, RemoveHobbyInput>({
      query: (input) => {
        const body = {
          query: `
            mutation RemoveHobby($hobby: String!) {
              removeHobby(hobby: $hobby) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: input,
        };
        console.log('Making removeHobby request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('RemoveHobby response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    updateHobbies: builder.mutation<UpdateHobbiesResponse, UpdateHobbiesInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UpdateHobbies($hobbies: [String!]!) {
              updateHobbies(hobbies: $hobbies) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: input,
        };
        console.log('Making updateHobbies request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UpdateHobbies response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Preferred Locations mutations
    addPreferredLocations: builder.mutation<AddPreferredLocationsResponse, AddPreferredLocationsInput>({
      query: (input) => {
        const body = {
          query: `
            mutation AddPreferredLocations($input: AddPreferredLocationsInput!) {
              addPreferredLocations(input: $input) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making addPreferredLocations request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('AddPreferredLocations response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    updatePreferredLocations: builder.mutation<UpdatePreferredLocationsResponse, UpdatePreferredLocationsInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UpdatePreferredLocations($input: UpdatePreferredLocationsInput!) {
              updatePreferredLocations(input: $input) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making updatePreferredLocations request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UpdatePreferredLocations response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    deletePreferredLocations: builder.mutation<DeletePreferredLocationsResponse, DeletePreferredLocationsInput>({
      query: (input) => {
        const body = {
          query: `
            mutation DeletePreferredLocations($input: DeletePreferredLocationsInput!) {
              deletePreferredLocations(input: $input) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making deletePreferredLocations request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('DeletePreferredLocations response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Profile Picture mutations
    getMyProfile: builder.query<MyProfileResponse, void>({
      query: () => {
        const body = {
          query: `
            query MyProfile {
              myProfile {
                ... on CandidateType {
                  __typename
                  id
                  profilePicture
                  profileBanner
                  certifications
                }
                ... on RecruiterType {
                  __typename
                  id
                  profilePicture
                  profileBanner
                }
              }
            }
          `,
        };
        console.log('Making myProfile request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('MyProfile response received:', response);
        return response.data;
      },
      providesTags: ['Profile'],
    }),
    uploadCandidateProfilePicture: builder.mutation<UploadCandidateProfilePictureResponse, ProfilePictureInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UploadCandidateProfilePicture($input: UploadProfilePictureInput!) {
              uploadCandidateProfilePicture(input: $input) {
                ... on SuccessType {
                  __typename
                  success
                  message
                  data
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making uploadCandidateProfilePicture request to:', `${API_URL}/graphql/`);
        console.log('Upload request body:', { inputLength: input.profilePictureBase64.length });
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UploadCandidateProfilePicture response received:', response);
        if (response.data?.uploadCandidateProfilePicture?.data) {
          console.log('Profile picture data:', response.data.uploadCandidateProfilePicture.data);
        }
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    uploadRecruiterProfilePicture: builder.mutation<UploadRecruiterProfilePictureResponse, ProfilePictureInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UploadRecruiterProfilePicture($input: UploadProfilePictureInput!) {
              uploadRecruiterProfilePicture(input: $input) {
                ... on SuccessType {
                  __typename
                  success
                  message
                  data
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making uploadRecruiterProfilePicture request to:', `${API_URL}/graphql/`);
        console.log('Upload request body:', { inputLength: input.profilePictureBase64.length });
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UploadRecruiterProfilePicture response received:', response);
        if (response.data?.uploadRecruiterProfilePicture?.data) {
          console.log('Profile picture data:', response.data.uploadRecruiterProfilePicture.data);
        }
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Profile Banner mutations
    uploadCandidateProfileBanner: builder.mutation<UploadCandidateProfileBannerResponse, ProfileBannerInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UploadCandidateProfileBanner($input: UploadProfileBannerInput!) {
              uploadCandidateProfileBanner(input: $input) {
                ... on SuccessType {
                  __typename
                  success
                  message
                  data
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making uploadCandidateProfileBanner request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UploadCandidateProfileBanner response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    uploadRecruiterProfileBanner: builder.mutation<UploadRecruiterProfileBannerResponse, ProfileBannerInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UploadRecruiterProfileBanner($input: UploadProfileBannerInput!) {
              uploadRecruiterProfileBanner(input: $input) {
                ... on SuccessType {
                  __typename
                  success
                  message
                  data
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making uploadRecruiterProfileBanner request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UploadRecruiterProfileBanner response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Delete Profile Picture mutations
    deleteCandidateProfilePicture: builder.mutation<{ deleteCandidateProfilePicture: SuccessType | ErrorType }, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation DeleteCandidateProfilePicture {
              deleteCandidateProfilePicture {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        console.log('DeleteCandidateProfilePicture response:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    deleteRecruiterProfilePicture: builder.mutation<{ deleteRecruiterProfilePicture: SuccessType | ErrorType }, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation DeleteRecruiterProfilePicture {
              deleteRecruiterProfilePicture {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        console.log('DeleteRecruiterProfilePicture response:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Resume upload mutation
    uploadAndParseResume: builder.mutation<ResumeUploadResponse, ResumeUploadInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UploadAndParseResume($input: ResumeUploadInput!) {
              uploadAndParseResume(input: $input) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making uploadAndParseResume request to:', `${API_URL}/graphql/`);
        console.log('Upload input:', { fileName: input.fileName, fileType: input.fileType, fileDataLength: input.fileData.length });
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UploadAndParseResume response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Certification mutations
    addCertification: builder.mutation<AddCertificationResponse, AddCertificationInput>({
      query: (input) => {
        const body = {
          query: `
            mutation AddCertification($input: AddCertificationInput!) {
              addCertification(input: $input) {
                ... on SuccessType {
                  __typename
                  data
                  message
                  success
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making addCertification request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('AddCertification response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Delete Certification mutation
    deleteCertification: builder.mutation<DeleteCertificationResponse, DeleteCertificationInput>({
      query: (input) => {
        const body = {
          query: `
            mutation DeleteCertification($input: DeleteCertificationInput!) {
              deleteCertification(input: $input) {
                ... on SuccessType {
                  __typename
                  data
                  message
                  success
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('DeleteCertification response:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Delete Certificate PDF mutation
    deleteCertificatePdf: builder.mutation<DeleteCertificatePdfResponse, number>({
      query: (index) => {
        const body = {
          query: `
            mutation DeleteCertificatePdf($index: Int!) {
              deleteCertificatePdf(index: $index) {
                ... on SuccessType {
                  __typename
                  data
                  message
                  success
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { index },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('DeleteCertificatePdf response:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Update Certification mutation
    updateCertification: builder.mutation<UpdateCertificationResponse, UpdateCertificationInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UpdateCertification($input: UpdateCertificationInput!) {
              updateCertification(input: $input) {
                ... on SuccessType {
                  __typename
                  data
                  message
                  success
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UpdateCertification response:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Extra-curricular mutations
    addExtraCurricular: builder.mutation<AddExtraCurricularResponse, AddExtraCurricularInput>({
      query: (input) => {
        const body = {
          query: `
            mutation AddExtraCurricular($input: AddExtraCurricularInput!) {
              addExtraCurricular(input: $input) {
                ... on SuccessType {
                  __typename
                  data
                  message
                  success
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making addExtraCurricular request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('AddExtraCurricular response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Delete Extra-curricular mutation
    deleteExtraCurricular: builder.mutation<DeleteExtraCurricularResponse, DeleteExtraCurricularInput>({
      query: (input) => {
        const body = {
          query: `
            mutation DeleteExtraCurricular($input: DeleteExtraCurricularInput!) {
              deleteExtraCurricular(input: $input) {
                ... on SuccessType {
                  __typename
                  data
                  message
                  success
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('DeleteExtraCurricular response:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Update Extra-curricular mutation
    updateExtraCurricular: builder.mutation<UpdateExtraCurricularResponse, UpdateExtraCurricularInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UpdateExtraCurricular($input: UpdateExtraCurricularInput!) {
              updateExtraCurricular(input: $input) {
                ... on SuccessType {
                  __typename
                  data
                  message
                  success
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UpdateExtraCurricular response:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Leadership & Social mutations
    addLeadershipSocial: builder.mutation<AddLeadershipSocialResponse, AddLeadershipSocialInput>({
      query: (input) => {
        const body = {
          query: `
            mutation AddLeadershipSocial($input: AddLeadershipSocialInput!) {
              addLeadershipSocial(input: $input) {
                ... on SuccessType {
                  __typename
                  data
                  message
                  success
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making addLeadershipSocial request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('AddLeadershipSocial response received:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Delete Leadership & Social mutation
    deleteLeadershipSocial: builder.mutation<DeleteLeadershipSocialResponse, DeleteLeadershipSocialInput>({
      query: (input) => {
        const body = {
          query: `
            mutation DeleteLeadershipSocial($input: DeleteLeadershipSocialInput!) {
              deleteLeadershipSocial(input: $input) {
                ... on SuccessType {
                  __typename
                  data
                  message
                  success
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('DeleteLeadershipSocial response:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // Update Leadership & Social mutation
    updateLeadershipSocial: builder.mutation<UpdateLeadershipSocialResponse, UpdateLeadershipSocialInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UpdateLeadershipSocial($input: UpdateLeadershipSocialInput!) {
              updateLeadershipSocial(input: $input) {
                ... on SuccessType {
                  __typename
                  data
                  message
                  success
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UpdateLeadershipSocial response:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),
    // CV Builder mutations
    createResume: builder.mutation<CreateResumeResponse, CreateResumeInput>({
      query: (input) => {
        const body = {
          query: `
            mutation CreateResume($input: CreateResumeInput!) {
              createResume(input: $input) {
                ... on ResumeBuilderSuccessType {
                  __typename
                  success
                  message
                  resume {
                    id
                    fullName
                    email
                    phone
                    location
                    linkedinUrl
                    githubUrl
                    portfolioUrl
                    professionalSummary
                    atsScore
                    status
                    createdAt
                    updatedAt
                    education {
                      degree
                      institution
                      location
                      startDate
                      endDate
                      gpa
                      description
                    }
                    experience {
                      title
                      company
                      location
                      startDate
                      endDate
                      current
                      responsibilities
                    }
                    projects {
                      name
                      description
                      technologies
                      startDate
                      endDate
                      url
                      highlights
                    }
                    skills {
                      category
                      items
                    }
                    certificates {
                      name
                      issuer
                      date
                      credentialId
                      url
                    }
                    achievements {
                      title
                      description
                      date
                    }
                    hobbiesList
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making createResume request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('CreateResume response received:', response);
        if (response.data?.createResume?.__typename === 'ResumeBuilderSuccessType') {
          console.log('✅ Resume created with details:', {
            id: response.data.createResume.resume.id,
            fullName: response.data.createResume.resume.fullName,
            email: response.data.createResume.resume.email,
            // Check if resume has owner/user field
            owner: response.data.createResume.resume.owner || 'NOT RETURNED',
            user: response.data.createResume.resume.user || 'NOT RETURNED',
          });
        }
        return response.data;
      },
      invalidatesTags: [{ type: 'Resume', id: 'LIST' }],
    }),
    updateResume: builder.mutation<UpdateResumeResponse, UpdateResumeInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UpdateResume($input: UpdateResumeInput!) {
              updateResume(input: $input) {
                ... on ResumeBuilderSuccessType {
                  __typename
                  success
                  message
                  resume {
                    id
                    fullName
                    email
                    phone
                    atsScore
                    updatedAt
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making updateResume request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('UpdateResume response received:', response);
        return response.data;
      },
      invalidatesTags: (result, error, { resumeId }) => [
        { type: 'Resume', id: resumeId },
        { type: 'Resume', id: 'LIST' },
      ],
    }),
    deleteResume: builder.mutation<DeleteResumeResponse, string>({
      query: (resumeId) => {
        const body = {
          query: `
            mutation DeleteResume($resumeId: String!) {
              deleteResume(resumeId: $resumeId) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { resumeId },
        };
        console.log('Making deleteResume request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('DeleteResume response received:', response);
        return response.data;
      },
      invalidatesTags: (result, error, resumeId) => [
        { type: 'Resume', id: resumeId },
        { type: 'Resume', id: 'LIST' },
      ],
    }),
    parseAndCreateResume: builder.mutation<ParseAndCreateResumeResponse, ParseAndCreateResumeInput>({
      query: (input) => {
        const body = {
          query: `
            mutation ParseAndCreateResume($fileName: String!, $fileData: String!) {
              parseAndCreateResume(fileName: $fileName, fileData: $fileData) {
                ... on ResumeBuilderSuccessType {
                  __typename
                  success
                  message
                  resume {
                    id
                    fullName
                    email
                    phone
                    location
                    linkedinUrl
                    githubUrl
                    portfolioUrl
                    professionalSummary
                    atsScore
                    education {
                      degree
                      institution
                      location
                      startDate
                      endDate
                      gpa
                    }
                    experience {
                      title
                      company
                      location
                      startDate
                      endDate
                      current
                      responsibilities
                    }
                    projects {
                      name
                      description
                      technologies
                      highlights
                    }
                    skills {
                      category
                      items
                    }
                    certificates {
                      name
                      issuer
                      date
                    }
                    achievements {
                      title
                      description
                    }
                    hobbiesList
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: input,
        };
        console.log('Making parseAndCreateResume request to:', `${API_URL}/graphql/`);
        console.log('Parse input:', { fileName: input.fileName, fileDataLength: input.fileData.length });
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('ParseAndCreateResume response received:', response);
        return response.data;
      },
      invalidatesTags: [{ type: 'Resume', id: 'LIST' }, 'Profile'],
    }),
    parseResumeAsync: builder.mutation<ParseResumeAsyncResponse, ParseResumeAsyncInput>({
      query: (input) => {
        const body = {
          query: `
            mutation ParseResumeAsync($fileName: String!, $fileData: String!) {
              parseResumeAsync(fileName: $fileName, fileData: $fileData) {
                ... on ResumeParsingTaskSuccessType {
                  __typename
                  success
                  message
                  task {
                    taskId
                    status
                    message
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: input,
        };
        console.log('Making parseResumeAsync request to:', `${API_URL}/graphql/`);
        console.log('Parse async input:', { fileName: input.fileName, fileDataLength: input.fileData.length });
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('ParseResumeAsync response received:', response);
        return response.data;
      },
      invalidatesTags: [{ type: 'Resume', id: 'LIST' }, 'Profile'],
    }),
    generateProfessionalSummary: builder.mutation<GenerateProfessionalSummaryResponse, GenerateProfessionalSummaryInput>({
      query: (input) => {
        const body = {
          query: `
            mutation GenerateSummary($input: GenerateProfessionalSummaryInput!) {
              generateProfessionalSummary(input: $input) {
                ... on ResumeBuilderSuccessType {
                  __typename
                  success
                  message
                  resume {
                    id
                    professionalSummary
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making generateProfessionalSummary request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('GenerateProfessionalSummary response received:', response);
        return response.data;
      },
      invalidatesTags: (result, error, { resumeId }) => [
        { type: 'Resume', id: resumeId },
        { type: 'Resume', id: 'LIST' },
      ],
    }),
    improveContent: builder.mutation<ImproveContentResponse, ImproveContentInput>({
      query: (input) => {
        const body = {
          query: `
            mutation ImproveContent($input: ImproveContentInput!) {
              improveContent(input: $input)
            }
          `,
          variables: { input },
        };
        console.log('Making improveContent request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('ImproveContent response received:', response);
        return response.data;
      },
    }),
    addKeywords: builder.mutation<AddKeywordsResponse, AddKeywordsInput>({
      query: (input) => {
        const body = {
          query: `
            mutation AddKeywords($input: AddKeywordsInput!) {
              addKeywords(input: $input) {
                ... on ResumeBuilderSuccessType {
                  __typename
                  success
                  message
                  resume {
                    id
                    skills {
                      category
                      items
                    }
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Making addKeywords request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('AddKeywords response received:', response);
        return response.data;
      },
      invalidatesTags: (result, error, { resumeId }) => [
        { type: 'Resume', id: resumeId },
        { type: 'Resume', id: 'LIST' },
      ],
    }),
    exportResumePdf: builder.mutation<ExportResumePdfResponse, string>({
      query: (resumeId) => {
        const body = {
          query: `
            mutation ExportPDF($resumeId: String!) {
              exportResumePdf(resumeId: $resumeId) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { resumeId },
        };
        console.log('Making exportResumePdf request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('ExportResumePdf response received:', response);
        return response.data;
      },
      invalidatesTags: (result, error, resumeId) => [
        { type: 'Resume', id: resumeId },
        { type: 'Resume', id: 'LIST' },
      ],
    }),
    // CV Builder queries
    getMyResumes: builder.query<MyResumesResponse, MyResumesInput | void>({
      query: (input) => {
        const { limit, offset } = input || {};
        const hasParams = limit !== undefined || offset !== undefined;
        const paramsStr = hasParams
          ? `(${limit !== undefined ? `limit: ${limit}` : ''}${limit !== undefined && offset !== undefined ? ', ' : ''}${offset !== undefined ? `offset: ${offset}` : ''})`
          : '';

        const body = {
          query: `
            query MyResumes {
              myResumes${paramsStr} {
                id
                fullName
                email
                phone
                location
                professionalSummary
                atsScore
                status
                createdAt
                updatedAt
                generatedResumeUrl
                education {
                  degree
                  institution
                  startDate
                  endDate
                }
                experience {
                  title
                  company
                  startDate
                  endDate
                  current
                }
                skills {
                  category
                  items
                }
              }
            }
          `,
        };
        console.log('Making getMyResumes request to:', `${API_URL}/graphql/`);
        console.log('📤 Full GraphQL query:', body.query);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('GetMyResumes response received:', response);
        console.log('📊 GetMyResumes detailed:', {
          hasData: !!response.data,
          hasMyResumes: !!response.data?.myResumes,
          resumeCount: response.data?.myResumes?.length || 0,
          resumeIds: response.data?.myResumes?.map((r: any) => r.id) || [],
          statuses: response.data?.myResumes?.map((r: any) => ({
            id: r.id,
            name: r.fullName,
            status: r.status,
            hasUrl: !!r.generatedResumeUrl,
            url: r.generatedResumeUrl || 'none'
          })) || [],
        });
        return response.data;
      },
      providesTags: (result) =>
        result?.myResumes
          ? [
              ...result.myResumes.map(({ id }) => ({ type: 'Resume' as const, id })),
              { type: 'Resume', id: 'LIST' },
            ]
          : [{ type: 'Resume', id: 'LIST' }],
      keepUnusedDataFor: 0, // Don't cache, always fetch fresh data
    }),
    getResumeById: builder.query<ResumeByIdResponse, string>({
      query: (resumeId) => {
        const body = {
          query: `
            query GetResume($resumeId: String!) {
              resumeById(resumeId: $resumeId) {
                id
                fullName
                email
                phone
                location
                linkedinUrl
                githubUrl
                portfolioUrl
                professionalSummary
                atsScore
                status
                errorMessage
                generatedResumeUrl
                createdAt
                updatedAt
                otherLinks {
                  name
                  url
                }
                education {
                  degree
                  institution
                  location
                  startDate
                  endDate
                  gpa
                  description
                }
                experience {
                  title
                  company
                  location
                  startDate
                  endDate
                  current
                  responsibilities
                }
                projects {
                  name
                  description
                  technologies
                  startDate
                  endDate
                  url
                  highlights
                }
                skills {
                  category
                  items
                }
                certificates {
                  name
                  issuer
                  date
                  credentialId
                  url
                }
                achievements {
                  title
                  description
                  date
                }
                hobbiesList
              }
            }
          `,
          variables: { resumeId },
        };
        console.log('Making getResumeById request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('GetResumeById response received:', response);
        return response.data;
      },
      providesTags: ['Resume'],
    }),
    getResumeStats: builder.query<ResumeStatsResponse, void>({
      query: () => {
        const body = {
          query: `
            query ResumeStats {
              resumeStats
            }
          `,
        };
        console.log('Making getResumeStats request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('GetResumeStats response received:', response);
        return response.data;
      },
      providesTags: ['Resume'],
    }),
    searchResumes: builder.query<SearchResumesResponse, SearchResumesInput>({
      query: (input) => {
        const body = {
          query: `
            query SearchResumes($query: String!, $limit: Int) {
              searchResumes(query: $query, limit: $limit) {
                id
                fullName
                email
                professionalSummary
                atsScore
                createdAt
              }
            }
          `,
          variables: input,
        };
        console.log('Making searchResumes request to:', `${API_URL}/graphql/`);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('SearchResumes response received:', response);
        return response.data;
      },
      providesTags: ['Resume'],
    }),
    // Subscription endpoints
    getStripePublicKey: builder.query<StripePublicKeyResponse, void>({
      query: () => {
        const body = {
          query: `
            query GetStripePublicKey {
              stripePublicKey
            }
          `,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
    }),
    getAvailablePlans: builder.query<AvailablePlansResponse, void>({
      query: () => {
        const body = {
          query: `
            query GetAvailablePlans {
              availablePlans {
                plans {
                  name
                  planKey
                  price
                  stripePriceId
                  aiResumeParses
                  aiContentImprovements
                  features
                }
              }
            }
          `,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Subscription'],
    }),
    checkSubscriptionStatus: builder.query<SubscriptionStatusResponse, void>({
      query: () => {
        const body = {
          query: `
            query CheckSubscriptionStatus {
              subscriptionStatus {
                hasSubscription
                isActive
                plan
                status
                canUseAiFeatures
                aiResumeParsesRemaining
                aiContentImprovementsRemaining
                currentPeriodEnd
                message
              }
            }
          `,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Subscription'],
    }),
    getMySubscription: builder.query<MySubscriptionResponse, void>({
      query: () => {
        const body = {
          query: `
            query GetMySubscription {
              mySubscription {
                id
                plan
                status
                isActive
                cancelAtPeriodEnd
                currentPeriodStart
                currentPeriodEnd
                aiResumeParsesUsed
                aiResumeParsesLimit
                aiContentImprovementsUsed
                aiContentImprovementsLimit
                lastPaymentDate
                lastPaymentAmount
                nextPaymentDate
              }
            }
          `,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Subscription'],
    }),
    createCheckoutSession: builder.mutation<CreateCheckoutSessionResponse, CreateCheckoutSessionInput>({
      query: (input) => {
        const body = {
          query: `
            mutation CreateCheckoutSession($input: CreateCheckoutSessionInput!) {
              createCheckoutSession(input: $input) {
                success
                message
                checkoutUrl
                sessionId
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Subscription'],
    }),
    // Stripe PaymentSheet mutations (for in-app payments)
    createPaymentIntent: builder.mutation<PaymentIntentResponse, CreatePaymentIntentInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation CreatePaymentIntent($input: CreatePaymentIntentInput!) {
              createPaymentIntent(input: $input) {
                success
                message
                paymentIntentClientSecret
                ephemeralKey
                customerId
                publishableKey
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => response.data,
    }),
    createSubscriptionSetup: builder.mutation<SetupIntentResponse, CreateSubscriptionSetupInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation CreateSubscriptionSetup($input: CreateSubscriptionSetupInput!) {
              createSubscriptionSetup(input: $input) {
                success
                message
                setupIntentClientSecret
                ephemeralKey
                customerId
                publishableKey
                priceId
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Subscription'],
    }),
    cancelSubscription: builder.mutation<CancelSubscriptionResponse, CancelSubscriptionInput>({
      query: (input) => {
        const body = {
          query: `
            mutation CancelSubscription($input: CancelSubscriptionInput!) {
              cancelSubscription(input: $input) {
                success
                message
                canceledAt
                accessEndsAt
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Subscription'],
    }),
    reactivateSubscription: builder.mutation<ReactivateSubscriptionResponse, void>({
      query: () => {
        const body = {
          query: `
            mutation ReactivateSubscription {
              reactivateSubscription {
                success
                message
              }
            }
          `,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Subscription'],
    }),
    createPortalSession: builder.mutation<CreatePortalSessionResponse, string>({
      query: (returnUrl) => {
        const body = {
          query: `
            mutation CreatePortalSession($returnUrl: String!) {
              createPortalSession(returnUrl: $returnUrl) {
                success
                message
                portalUrl
              }
            }
          `,
          variables: { returnUrl },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
    }),
    // Billing History Query
    getBillingHistory: builder.query<BillingHistoryResponse, BillingHistoryInput | void>({
      query: (input) => {
        const body = {
          query: `
            query BillingHistory($limit: Int, $startingAfter: String) {
              billingHistory(limit: $limit, startingAfter: $startingAfter) {
                success
                hasMore
                totalCount
                invoices {
                  id
                  number
                  status
                  currency
                  created
                  subtotal
                  tax
                  total
                  amountPaid
                  amountDue
                  discount
                  periodStart
                  periodEnd
                  customerName
                  customerEmail
                  lineItems {
                    id
                    description
                    quantity
                    unitAmount
                    amount
                    currency
                  }
                  paymentMethod {
                    brand
                    last4
                    expMonth
                    expYear
                  }
                  invoiceUrl
                  invoicePdf
                }
              }
            }
          `,
          variables: input || {},
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Subscription'],
    }),
    // Sync Subscription Status Query
    syncSubscriptionStatus: builder.query<SyncSubscriptionStatusResponse, void>({
      query: () => {
        const body = {
          query: `
            query SyncSubscriptionStatus {
              syncSubscriptionStatus {
                status
                planId
                planName
                currentPeriodEnd
                cancelAtPeriodEnd
                message
              }
            }
          `,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Subscription'],
    }),
    // Change Plan Mutation
    changePlan: builder.mutation<ChangePlanResponse, ChangePlanInput>({
      query: (input) => {
        const body = {
          query: `
            mutation ChangePlan($input: ChangePlanInput!) {
              changePlan(input: $input) {
                success
                message
                subscription {
                  id
                  status
                  plan
                  currentPeriodEnd
                }
                prorationAmount
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Subscription'],
    }),

    // ===== PAYPAL PAYMENT MUTATIONS =====

    // Create Paypal Subscription
    createPaypalSubscription: builder.mutation<CreatePaypalSubscriptionResponse, CreatePaypalSubscriptionInput>({
      query: (input) => {
        const body = {
          query: `
            mutation CreatePaypalSubscription($input: CreatePayPalSubscriptionInput!) {
              createPaypalSubscription(input: $input) {
                success
                message
                subscriptionId
                approvalUrl
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
    }),

    // Capture Paypal Subscription (after user approval)
    capturePaypalSubscription: builder.mutation<CapturePaypalSubscriptionResponse, CapturePaypalSubscriptionInput>({
      query: (input) => {
        const body = {
          query: `
            mutation CapturePaypalSubscription($input: CapturePayPalSubscriptionInput!) {
              capturePaypalSubscription(input: $input) {
                success
                message
                subscription {
                  id
                  status
                  plan
                  currentPeriodEnd
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Subscription'],
    }),

    // Cancel Paypal Subscription
    cancelPaypalSubscription: builder.mutation<CancelPaypalSubscriptionResponse, CancelPaypalSubscriptionInput>({
      query: (input) => {
        const body = {
          query: `
            mutation CancelPaypalSubscription($input: CancelPayPalSubscriptionInput) {
              cancelPaypalSubscription(input: $input) {
                success
                message
                canceledAt
                accessEndsAt
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Subscription'],
    }),

    // Google OAuth Mutations
    getGoogleOAuthUrl: builder.mutation<GetGoogleOAuthUrlResponse, string>({
      query: (redirectUri) => {
        const body = {
          query: `
            mutation GetGoogleOAuthUrl($redirectUri: String!) {
              getGoogleOauthUrl(redirectUri: $redirectUri) {
                ... on SuccessType {
                  success
                  message
                  data
                }
                ... on ErrorType {
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: { redirectUri },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
    }),
    googleOAuthLogin: builder.mutation<GoogleOAuthLoginResponse, GoogleOAuthLoginInput>({
      query: (input) => {
        const body = {
          query: `
            mutation GoogleOAuthLogin($code: String!, $redirectUri: String!) {
              googleOauthLogin(code: $code, redirectUri: $redirectUri) {
                ... on LoginSuccessType {
                  success
                  message
                  accessToken
                  refreshToken
                  user {
                    id
                    email
                    firstName
                    lastName
                    role
                    authProvider
                    googleId
                  }
                  role
                }
                ... on ErrorType {
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: input,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['User'],
    }),
    // LinkedIn OAuth Login
    linkedinOAuthLogin: builder.mutation<LinkedInOAuthLoginResponse, LinkedInOAuthLoginInput>({
      query: (input) => {
        const body = {
          query: `
            mutation LinkedInOAuthLogin($code: String!, $redirectUri: String!, $role: String) {
              linkedinOauthLogin(code: $code, redirectUri: $redirectUri, role: $role) {
                ... on LoginSuccessType {
                  success
                  message
                  accessToken
                  refreshToken
                  user {
                    id
                    email
                    firstName
                    lastName
                    role
                    authProvider
                    linkedinId
                  }
                  role
                  profileSetupRequired
                }
                ... on ErrorType {
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: input,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['User'],
    }),
    linkGoogleAccount: builder.mutation<LinkGoogleAccountResponse, LinkGoogleAccountInput>({
      query: (input) => {
        const body = {
          query: `
            mutation LinkGoogleAccount($code: String!, $redirectUri: String!) {
              linkGoogleAccount(code: $code, redirectUri: $redirectUri) {
                success
                message
                errors {
                  field
                  message
                }
              }
            }
          `,
          variables: input,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['User'],
    }),
    unlinkGoogleAccount: builder.mutation<UnlinkGoogleAccountResponse, void>({
      query: () => {
        const body = {
          query: `
            mutation UnlinkGoogleAccount {
              unlinkGoogleAccount {
                success
                message
                errors {
                  field
                  message
                }
              }
            }
          `,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['User'],
    }),

    // ===== GOOGLE CALENDAR ENDPOINTS =====

    // Get Google Calendar Authorization URL
    getGoogleCalendarAuthUrl: builder.mutation<GetGoogleCalendarAuthUrlResponse, void>({
      query: () => {
        const redirectUri = `${API_URL}/auth/google/callback`;
        const body = {
          query: `
            mutation GetGoogleCalendarAuthUrl($redirectUri: String!) {
              getGoogleCalendarAuthUrl(redirectUri: $redirectUri) {
                ... on GoogleCalendarAuthType {
                  authorizationUrl
                  isConnected
                  message
                  success
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { redirectUri },
        };
        console.log('Getting Google Calendar auth URL with redirectUri:', redirectUri);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('Google Calendar auth URL response:', response);
        return response.data;
      },
    }),

    // Connect Google Calendar
    connectGoogleCalendar: builder.mutation<ConnectGoogleCalendarResponse, { code: string }>({
      query: ({ code }) => {
        const redirectUri = `${API_URL}/auth/google/callback`;
        const body = {
          query: `
            mutation ConnectGoogleCalendar($input: ConnectGoogleCalendarInput!) {
              connectGoogleCalendar(input: $input) {
                ... on GoogleCalendarAuthType {
                  authorizationUrl
                  isConnected
                  message
                  success
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input: { code, redirectUri } },
        };
        console.log('Connecting Google Calendar with code');
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('Connect Google Calendar response:', response);
        return response.data;
      },
      invalidatesTags: ['GoogleCalendar'],
    }),

    // Disconnect Google Calendar
    disconnectGoogleCalendar: builder.mutation<DisconnectGoogleCalendarResponse, void>({
      query: () => {
        const body = {
          query: `
            mutation DisconnectGoogleCalendar {
              disconnectGoogleCalendar {
                ... on SuccessType {
                  success
                  message
                }
                ... on ErrorType {
                  success
                  message
                }
              }
            }
          `,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['GoogleCalendar'],
    }),

    // Check if Google Calendar is connected
    isGoogleCalendarConnected: builder.query<boolean, void>({
      query: () => {
        const body = {
          query: `
            query IsGoogleCalendarConnected {
              isGoogleCalendarConnected
            }
          `,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data.isGoogleCalendarConnected,
      providesTags: ['GoogleCalendar'],
    }),

    // ===== INTERVIEW SCHEDULING ENDPOINTS =====

    // Create interview slots (Recruiter)
    createInterviewSlots: builder.mutation<CreateInterviewSlotsResponse, CreateInterviewSlotsInput>({
      query: (input) => {
        const body = {
          query: `
            mutation CreateInterviewSlots($input: CreateInterviewSlotsInput!) {
              createInterviewSlots(input: $input) {
                ... on InterviewSlotSuccessType {
                  success
                  message
                }
                ... on ErrorType {
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('Creating interview slots:', input);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('Create interview slots response:', response);
        return response.data;
      },
      invalidatesTags: ['Interviews'],
    }),

    // Select interview slot (Candidate)
    selectInterviewSlot: builder.mutation<SelectInterviewSlotResponse, { slotId: string }>({
      query: (input) => {
        const body = {
          query: `
            mutation SelectInterviewSlot($input: SelectInterviewSlotInput!) {
              selectInterviewSlot(input: $input) {
                ... on InterviewSuccessType {
                  __typename
                  success
                  message
                  interview {
                    id
                    startTime
                    endTime
                    durationMinutes
                    status
                    videoCallLink
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input: { slotId: input.slotId } },
        };
        console.log('Selecting interview slot:', input.slotId);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('Select interview slot response:', response);
        if (response.errors) {
          console.error('Select interview slot errors:', response.errors);
        }
        return response.data || { selectInterviewSlot: { __typename: 'ErrorType', success: false, message: response.errors?.[0]?.message || 'Unknown error' } };
      },
      invalidatesTags: ['Interviews', 'Applications'],
    }),

    // Cancel interview
    cancelInterview: builder.mutation<CancelInterviewResponse, CancelInterviewInput>({
      query: (input) => {
        const body = {
          query: `
            mutation CancelInterview($input: CancelInterviewInput!) {
              cancelInterview(input: $input) {
                ... on SuccessType {
                  success
                  message
                }
                ... on ErrorType {
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Interviews'],
    }),

    // Reschedule interview
    rescheduleInterview: builder.mutation<RescheduleInterviewResponse, RescheduleInterviewInput>({
      query: (input) => {
        const body = {
          query: `
            mutation RescheduleInterview($input: RescheduleInterviewInput!) {
              rescheduleInterview(input: $input) {
                ... on InterviewSlotSuccessType {
                  success
                  message
                }
                ... on ErrorType {
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Interviews'],
    }),

    // Sync interview to calendar
    syncInterviewToCalendar: builder.mutation<SyncInterviewToCalendarResponse, string>({
      query: (interviewId) => {
        const body = {
          query: `
            mutation SyncInterviewToCalendar($interviewId: ID!) {
              syncInterviewToCalendar(interviewId: $interviewId) {
                ... on SuccessType {
                  success
                  message
                }
                ... on ErrorType {
                  success
                  message
                }
              }
            }
          `,
          variables: { interviewId },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Interviews'],
    }),

    // Get interview slots for application (Candidate - only available slots)
    interviewSlots: builder.query<InterviewSlotsResponse, string>({
      query: (applicationId) => {
        const body = {
          query: `
            query InterviewSlots($applicationId: String!) {
              interviewSlots(applicationId: $applicationId) {
                id
                startTime
                endTime
                durationMinutes
                status
              }
            }
          `,
          variables: { applicationId },
        };
        console.log('🎰 [interviewSlots] Fetching for applicationId:', applicationId);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('🎰 [interviewSlots] Full response:', JSON.stringify(response, null, 2));
        if (response.errors) {
          console.error('🎰 [interviewSlots] GraphQL errors:', response.errors);
        }
        return response.data;
      },
      providesTags: ['Interviews'],
    }),

    // Get all interview slots for application (Recruiter - all slots)
    allInterviewSlots: builder.query<AllInterviewSlotsResponse, string>({
      query: (applicationId) => {
        const body = {
          query: `
            query AllInterviewSlots($applicationId: ID!) {
              allInterviewSlots(applicationId: $applicationId) {
                id
                startTime
                endTime
                durationMinutes
                status
                createdAt
              }
            }
          `,
          variables: { applicationId },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Interviews'],
    }),

    // Get my interviews
    myInterviews: builder.query<MyInterviewsResponse, string | void>({
      query: (status) => {
        const body = {
          query: `
            query MyInterviews${status ? '($status: String!)' : ''} {
              myInterviews${status ? '(status: $status)' : ''} {
                id
                startTime
                endTime
                durationMinutes
                interviewType
                location
                videoCallLink
                additionalNotes
                status
                recruiterCalendarEventId
                candidateCalendarEventId
                createdAt
                updatedAt
              }
            }
          `,
          variables: status ? { status } : undefined,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Interviews'],
    }),

    // Get upcoming interviews
    upcomingInterviews: builder.query<UpcomingInterviewsResponse, void>({
      query: () => {
        const body = {
          query: `
            query UpcomingInterviews {
              upcomingInterviews {
                id
                startTime
                endTime
                durationMinutes
                interviewType
                location
                videoCallLink
                status
                createdAt
              }
            }
          `,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Interviews'],
    }),

    // Get interview for specific application
    applicationInterview: builder.query<ApplicationInterviewResponse, string>({
      query: (applicationId) => {
        const body = {
          query: `
            query ApplicationInterview($applicationId: String!) {
              applicationInterview(applicationId: $applicationId) {
                id
                startTime
                endTime
                durationMinutes
                interviewType
                status
                videoCallLink
                location
                confirmedAt
                selectedSlot {
                  id
                  startTime
                  endTime
                  durationMinutes
                  status
                }
              }
            }
          `,
          variables: { applicationId },
        };
        console.log('📅 [applicationInterview] Fetching for applicationId:', applicationId);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('📅 [applicationInterview] Full response:', JSON.stringify(response, null, 2));
        if (response.errors) {
          console.error('📅 [applicationInterview] GraphQL errors:', response.errors);
        }
        return response.data;
      },
      providesTags: ['Interviews'],
    }),

    // Get interview by ID
    interview: builder.query<InterviewResponse, string>({
      query: (interviewId) => {
        const body = {
          query: `
            query Interview($interviewId: ID!) {
              interview(interviewId: $interviewId) {
                id
                startTime
                endTime
                durationMinutes
                interviewType
                location
                videoCallLink
                additionalNotes
                status
                recruiterCalendarEventId
                candidateCalendarEventId
                createdAt
                updatedAt
              }
            }
          `,
          variables: { interviewId },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Interviews'],
    }),

    // ===== JOB MATCH ENGINE ENDPOINTS =====

    // Recruiter - Job Posting Mutations
    createJobPosting: builder.mutation<CreateJobPostingResponse, CreateJobPostingInput>({
      query: (input) => {
        const body = {
          query: `
            mutation CreateJobPosting($input: CreateJobPostingInput!) {
              createJobPosting(input: $input) {
                ... on JobPostingSuccessType {
                  success
                  message
                  jobPosting {
                    id
                    title
                    companyName
                    status
                    createdAt
                  }
                }
                ... on ErrorType {
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Jobs'],
    }),

    updateJobPosting: builder.mutation<UpdateJobPostingResponse, UpdateJobPostingInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UpdateJobPosting($input: UpdateJobPostingInput!) {
              updateJobPosting(input: $input) {
                ... on JobPostingSuccessType {
                  success
                  message
                  jobPosting {
                    id
                    title
                    status
                  }
                }
                ... on ErrorType {
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Jobs'],
    }),

    deleteJobPosting: builder.mutation<DeleteJobPostingResponse, { jobId: string }>({
      query: (input) => {
        const body = {
          query: `
            mutation DeleteJobPosting($input: DeleteJobPostingInput!) {
              deleteJobPosting(input: $input) {
                ... on SuccessType {
                  success
                  message
                }
                ... on ErrorType {
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Jobs'],
    }),

    // Candidate - Job Application Mutations
    applyToJob: builder.mutation<ApplyToJobResponse, ApplyToJobInput>({
      query: (input) => {
        const body = {
          query: `
            mutation ApplyToJob($input: ApplyToJobInput!) {
              applyToJob(input: $input) {
                ... on JobApplicationSuccessType {
                  __typename
                  success
                  message
                  application {
                    id
                    status
                    appliedAt
                    jobPosting {
                      id
                      title
                      companyName
                    }
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        console.log('ApplyToJob mutation body:', JSON.stringify(body, null, 2));
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('ApplyToJob raw response:', JSON.stringify(response, null, 2));
        return response.data;
      },
      invalidatesTags: ['Applications', 'JobMatches'],
    }),

    withdrawApplication: builder.mutation<WithdrawApplicationResponse, { applicationId: string }>({
      query: (input) => {
        const body = {
          query: `
            mutation WithdrawApplication($input: WithdrawApplicationInput!) {
              withdrawApplication(input: $input) {
                ... on SuccessType {
                  data
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Applications', 'JobMatches'],
    }),

    // Recruiter - Application Management Mutations
    shortlistApplication: builder.mutation<ShortlistApplicationResponse, ShortlistApplicationInput>({
      query: (input) => {
        const body = {
          query: `
            mutation ShortlistApplication($input: ShortlistApplicationInput!) {
              shortlistApplication(input: $input) {
                ... on JobApplicationSuccessType {
                  success
                  message
                  application {
                    id
                    status
                  }
                }
                ... on ErrorType {
                  __typename
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Applications'],
    }),

    rejectApplication: builder.mutation<RejectApplicationResponse, RejectApplicationInput>({
      query: (input) => {
        const body = {
          query: `
            mutation RejectApplication($input: RejectApplicationInput!) {
              rejectApplication(input: $input) {
                ... on JobApplicationSuccessType {
                  success
                  message
                  application {
                    id
                    status
                    rejectionReason
                  }
                }
                ... on ErrorType {
                  __typename
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Applications'],
    }),

    // Candidate - Saved Jobs Mutations
    saveJob: builder.mutation<SaveJobResponse, SaveJobInput>({
      query: (input) => {
        const body = {
          query: `
            mutation SaveJob($input: SaveJobInput!) {
              saveJob(input: $input) {
                ... on SavedJobSuccessType {
                  success
                  message
                  savedJob {
                    id
                    notes
                    savedAt
                    jobPosting {
                      id
                      title
                      companyName
                    }
                  }
                }
                ... on ErrorType {
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['SavedJobs', 'JobMatches'],
    }),

    unsaveJob: builder.mutation<UnsaveJobResponse, { savedJobId: string }>({
      query: (input) => {
        const body = {
          query: `
            mutation UnsaveJob($input: UnsaveJobInput!) {
              unsaveJob(input: $input) {
                ... on SuccessType {
                  success
                  message
                }
                ... on ErrorType {
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['SavedJobs', 'JobMatches'],
    }),

    // Job Queries
    getJobPostings: builder.query<JobPostingsResponse, {
      status?: string;
      jobType?: string;
      experienceLevel?: string;
      workMode?: string;
      location?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }>({
      query: (params) => {
        const body = {
          query: `
            query GetJobPostings(
              $status: String
              $jobType: String
              $experienceLevel: String
              $workMode: String
              $location: String
              $search: String
              $limit: Int
              $offset: Int
            ) {
              jobPostings(
                status: $status
                jobType: $jobType
                experienceLevel: $experienceLevel
                workMode: $workMode
                location: $location
                search: $search
                limit: $limit
                offset: $offset
              ) {
                id
                title
                companyName
                description
                jobType
                experienceLevel
                location
                workMode
                requiredSkills
                preferredSkills
                salaryMin
                salaryMax
                salaryCurrency
                status
                applicationStatus
                publishedAt
                applicationsCount
                viewsCount
              }
            }
          `,
          variables: params,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Jobs'],
    }),

    getJobPosting: builder.query<JobPostingResponse, { jobId: string }>({
      query: ({ jobId }) => {
        const body = {
          query: `
            query GetJobPosting($jobId: String!) {
              jobPosting(jobId: $jobId) {
                id
                title
                companyName
                department
                description
                responsibilities
                jobType
                experienceLevel
                yearsOfExperienceMin
                yearsOfExperienceMax
                location
                workMode
                requiredSkills
                preferredSkills
                requiredQualifications
                certifications
                salaryMin
                salaryMax
                salaryCurrency
                salaryPeriod
                benefits
                applicationDeadline
                applicationEmail
                applicationInstructions
                applicationUrl
                status
                applicationStatus
                rejectionReason
                viewsCount
                applicationsCount
                publishedAt
                numberOfOpenings
                industry
                isFeatured
                closedAt
                createdAt
                updatedAt
                candidateMatch {
                  id
                  matchPercentage
                  skillsMatchScore
                  experienceMatchScore
                  qualificationsMatchScore
                  locationMatchScore
                  matchedSkills
                  missingSkills
                  extraSkills
                  suggestions
                  strengths
                  weaknesses
                  recommendation
                  isApplied
                  isSaved
                }
                recruiter {
                  id
                  organizationName
                  organizationType
                  companyName
                  companyWebsite
                  position
                  industries
                  specializations
                  linkedinUrl
                  profilePicture
                  isVerified
                  isActive
                  subRole
                  createdAt
                  updatedAt
                }
              }
            }
          `,
          variables: { jobId },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Jobs'],
    }),

    getMyJobPostings: builder.query<MyJobPostingsResponse, { status?: string }>({
      query: (params) => {
        const body = {
          query: `
            query GetMyJobPostings($status: String) {
              myJobPostings(status: $status) {
                id
                title
                companyName
                status
                viewsCount
                applicationsCount
                createdAt
                publishedAt
              }
            }
          `,
          variables: params,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Jobs'],
    }),

    getMyJobMatches: builder.query<MyJobMatchesResponse, {
      minMatchPercentage?: number;
      jobType?: string;
      experienceLevel?: string;
      workMode?: string;
      page?: number;
      pageSize?: number;
    }>({
      query: (params) => {
        const body = {
          query: `
            query GetMyJobMatches(
              $minMatchPercentage: Float
              $jobType: String
              $experienceLevel: String
              $workMode: String
              $page: Int
              $pageSize: Int
            ) {
              myJobMatches(
                minMatchPercentage: $minMatchPercentage
                jobType: $jobType
                experienceLevel: $experienceLevel
                workMode: $workMode
                page: $page
                pageSize: $pageSize
              ) {
                matches {
                  id
                  matchPercentage
                  skillsMatchScore
                  experienceMatchScore
                  qualificationsMatchScore
                  locationMatchScore
                  matchedSkills
                  missingSkills
                  suggestions
                  strengths
                  weaknesses
                  recommendation
                  isSaved
                  isApplied
                  applicationId
                  appliedAt
                  jobPosting {
                    id
                    title
                    companyName
                    description
                    location
                    workMode
                    jobType
                    experienceLevel
                    requiredSkills
                    salaryMin
                    salaryMax
                    salaryCurrency
                  }
                }
                totalCount
                page
                pageSize
                hasNext
                hasPrevious
              }
            }
          `,
          variables: params,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['JobMatches'],
    }),

    getJobMatch: builder.query<JobMatchResponse, { jobId: string }>({
      query: ({ jobId }) => {
        const body = {
          query: `
            query GetJobMatch($jobId: String!) {
              jobMatch(jobId: $jobId) {
                id
                matchPercentage
                skillsMatchScore
                experienceMatchScore
                qualificationsMatchScore
                locationMatchScore
                matchedSkills
                missingSkills
                extraSkills
                suggestions
                strengths
                weaknesses
                recommendation
                isSaved
                isApplied
                applicationId
                appliedAt
              }
            }
          `,
          variables: { jobId },
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['JobMatches'],
    }),

    getMyApplications: builder.query<MyApplicationsResponse, { status?: string }>({
      query: (params) => {
        const body = {
          query: `
            query GetMyApplications($status: String) {
              myApplications(status: $status) {
                id
                status
                coverLetter
                appliedAt
                reviewedAt
                jobPosting {
                  id
                  title
                  companyName
                  location
                  workMode
                }
                jobMatch {
                  matchPercentage
                }
              }
            }
          `,
          variables: params,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Applications'],
    }),

    getJobApplications: builder.query<JobApplicationsResponse, { jobId: string; status?: string }>({
      query: (params) => {
        const body = {
          query: `
            query GetJobApplications($jobId: String!, $status: String) {
              jobApplications(jobId: $jobId, status: $status) {
                id
                status
                appliedAt
                reviewedAt
                coverLetter
                recruiterNotes
                rejectionReason
                candidate {
                  user {
                    firstName
                    lastName
                    email
                  }
                  title
                  yearsOfExperience
                }
                jobMatch {
                  matchPercentage
                  skillsMatchScore
                  experienceMatchScore
                  qualificationsMatchScore
                  locationMatchScore
                  matchedSkills
                  missingSkills
                  extraSkills
                  strengths
                  weaknesses
                  recommendation
                }
                jobPosting {
                  id
                  title
                }
              }
            }
          `,
          variables: params,
        };
        console.log('GetJobApplications query params:', params);
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('GetJobApplications response:', JSON.stringify(response, null, 2));
        return response.data;
      },
      providesTags: ['Applications'],
    }),

    getShortlistedApplications: builder.query<ShortlistedApplicationsResponse, { jobId: string }>({
      query: (params) => {
        const body = {
          query: `
            query GetShortlistedApplications($jobId: String!) {
              shortlistedApplications(jobId: $jobId) {
                id
                status
                appliedAt
                reviewedAt
                recruiterNotes
                candidate {
                  user {
                    firstName
                    lastName
                    email
                  }
                  title
                  yearsOfExperience
                }
                jobPosting {
                  id
                  title
                }
              }
            }
          `,
          variables: params,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Applications'],
    }),

    getRejectedApplications: builder.query<RejectedApplicationsResponse, { jobId: string }>({
      query: (params) => {
        const body = {
          query: `
            query GetRejectedApplications($jobId: String!) {
              rejectedApplications(jobId: $jobId) {
                id
                status
                rejectionReason
                appliedAt
                candidate {
                  user {
                    firstName
                    lastName
                    email
                  }
                  title
                  yearsOfExperience
                }
                jobPosting {
                  id
                  title
                }
              }
            }
          `,
          variables: params,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Applications'],
    }),

    getMySavedJobs: builder.query<MySavedJobsResponse, void>({
      query: () => {
        const body = {
          query: `
            query GetMySavedJobs {
              mySavedJobs {
                id
                notes
                savedAt
                jobPosting {
                  id
                  title
                  companyName
                  location
                  workMode
                  jobType
                  salaryMin
                  salaryMax
                  salaryCurrency
                }
              }
            }
          `,
        };
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['SavedJobs'],
    }),

    // ==================== Interview Coach Mutations ====================

    startInterviewSession: builder.mutation<StartInterviewSessionResponse, StartInterviewSessionInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation StartInterviewSession($input: StartInterviewSessionInput!) {
              startInterviewSession(input: $input) {
                ... on InterviewCoachSessionSuccessType {
                  __typename
                  success
                  message
                  questions {
                    id
                    questionText
                    questionType
                    orderIndex
                    audioUrl
                  }
                  session {
                    id
                    interviewType
                    mode
                    difficulty
                    totalQuestions
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['InterviewCoach'],
    }),

    submitTextResponse: builder.mutation<SubmitTextResponseResponse, SubmitTextResponseInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation SubmitTextResponse($input: SubmitTextResponseInput!) {
              submitTextResponse(input: $input) {
                ... on SubmitResponseSuccessType {
                  __typename
                  success
                  message
                  responseId
                  analysisPending
                  analysisStatus
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['InterviewCoach'],
    }),

    submitVoiceResponse: builder.mutation<SubmitVoiceResponseResponse, SubmitVoiceResponseInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation SubmitVoiceResponse($input: SubmitVoiceResponseInput!) {
              submitVoiceResponse(input: $input) {
                ... on SubmitResponseSuccessType {
                  __typename
                  success
                  message
                  responseId
                  analysisPending
                  analysisStatus
                  voiceMetrics {
                    speakingPaceWpm
                    fillerWordCount
                    fillerWordsDetected
                    voiceConfidenceScore
                    paceAssessment
                    fillerAssessment
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['InterviewCoach'],
    }),

    completeInterviewSession: builder.mutation<CompleteSessionResponse, string>({
      query: (sessionId) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation CompleteSession($sessionId: String!) {
              completeSessionAndGenerateReport(sessionId: $sessionId) {
                ... on SessionReportSuccessType {
                  __typename
                  success
                  message
                  report {
                    id
                    overallScore
                    contentAverage
                    communicationAverage
                    voiceAverage
                    strongAreas
                    weakAreas
                    questionTypeScores
                    topImprovements
                    practiceSuggestions
                    resources
                    executiveSummary
                    detailedAnalysis
                    industryBenchmark
                    percentileRank
                    generatedAt
                    createdAt
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { sessionId },
        },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['InterviewCoach'],
    }),

    abandonInterviewSession: builder.mutation<AbandonSessionResponse, string>({
      query: (sessionId) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation AbandonSession($sessionId: String!) {
              abandonSession(sessionId: $sessionId) {
                __typename
                ... on SuccessType {
                  success
                  message
                }
                ... on ErrorType {
                  message
                }
              }
            }
          `,
          variables: { sessionId },
        },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['InterviewCoach'],
    }),

    convertVoice: builder.mutation<ConvertVoiceResponse, SpeechToSpeechInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation ConvertVoice($input: SpeechToSpeechInput!) {
              convertVoice(input: $input) {
                __typename
                ... on SpeechToSpeechResultType {
                  success
                  message
                  originalAudioSize
                  convertedAudioSize
                  convertedAudioBase64
                  targetVoiceId
                  targetVoiceName
                }
                ... on ErrorType {
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => response.data,
    }),

    convertVoiceWithAnalysis: builder.mutation<ConvertVoiceWithAnalysisResponse, SpeechToSpeechWithAnalysisInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation ConvertVoiceWithAnalysis($input: SpeechToSpeechWithAnalysisInput!) {
              convertVoiceWithAnalysis(input: $input) {
                __typename
                ... on SpeechToSpeechWithAnalysisType {
                  success
                  message
                  originalAudioSize
                  convertedAudioSize
                  convertedAudioBase64
                  targetVoiceId
                  targetVoiceName
                  transcribedText
                  voiceMetrics {
                    speakingPaceWpm
                    fillerWordCount
                    fillerWordsDetected
                    voiceConfidenceScore
                    paceAssessment
                    fillerAssessment
                  }
                }
                ... on ErrorType {
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => response.data,
    }),

    // ==================== Interview Coach Queries ====================

    getInterviewCoachSessions: builder.query<InterviewCoachSessionsResponse, { status?: string; limit?: number; offset?: number }>({
      query: ({ status, limit, offset }) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetInterviewSessions($status: String, $limit: Int, $offset: Int) {
              interviewCoachSessions(status: $status, limit: $limit, offset: $offset) {
                id
                interviewType
                jobRole
                industry
                difficulty
                mode
                status
                totalQuestions
                overallScore
                createdAt
                completedAt
              }
            }
          `,
          variables: { status, limit, offset },
        },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ['InterviewCoach'],
    }),

    getInterviewCoachSession: builder.query<InterviewCoachSessionResponse, string>({
      query: (sessionId) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetInterviewSession($sessionId: String!) {
              interviewCoachSession(sessionId: $sessionId) {
                id
                interviewType
                jobRole
                industry
                difficulty
                mode
                status
                totalQuestions
                overallScore
                createdAt
                completedAt
                questions {
                  id
                  questionText
                  questionType
                  questionCategory
                  difficulty
                  orderIndex
                }
                report {
                  id
                  overallScore
                  contentAverage
                  communicationAverage
                  voiceAverage
                  strongAreas
                  weakAreas
                  questionTypeScores
                  topImprovements
                  practiceSuggestions
                  resources
                  executiveSummary
                  detailedAnalysis
                  industryBenchmark
                  percentileRank
                  generatedAt
                  createdAt
                }
              }
            }
          `,
          variables: { sessionId },
        },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ['InterviewCoach'],
    }),

    getNextInterviewQuestion: builder.query<GetNextQuestionResponse, string>({
      query: (sessionId) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetNextQuestion($sessionId: String!) {
              getNextQuestion(sessionId: $sessionId) {
                id
                questionText
                questionType
                questionCategory
                difficulty
                orderIndex
              }
            }
          `,
          variables: { sessionId },
        },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ['InterviewCoach'],
    }),

    getInterviewCoachStats: builder.query<InterviewCoachStatsResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetInterviewStats {
              interviewCoachStats {
                totalSessions
                completedSessions
                averageScore
                bestScore
                totalQuestionsAnswered
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ['InterviewCoach'],
    }),

    getAvailableInterviewTypes: builder.query<AvailableInterviewTypesResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetInterviewTypes {
              availableInterviewTypes
            }
          `,
        },
      }),
      transformResponse: (response: any) => response.data,
    }),

    getAvailableDifficultyLevels: builder.query<AvailableDifficultyLevelsResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetDifficultyLevels {
              availableDifficultyLevels
            }
          `,
        },
      }),
      transformResponse: (response: any) => response.data,
    }),

    getAvailableVoices: builder.query<AvailableVoicesResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetVoices {
              availableVoices {
                id
                name
                description
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => response.data,
    }),

    // GDPR Consent Endpoints
    hasGivenConsent: builder.query<HasGivenConsentResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query {
              hasGivenConsent
            }
          `,
        },
      }),
      transformResponse: (response: any) => response.data,
    }),

    requiresConsentUpdate: builder.query<RequiresConsentUpdateResponse, string>({
      query: (currentVersion) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query RequiresConsentUpdate($currentVersion: String!) {
              requiresConsentUpdate(currentVersion: $currentVersion)
            }
          `,
          variables: { currentVersion },
        },
      }),
      transformResponse: (response: any) => response.data,
    }),

    acceptAllConsents: builder.mutation<AcceptAllConsentsResponse, AcceptAllConsentsInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation AcceptAllConsents($input: AcceptAllConsentsInput!) {
              acceptAllConsents(input: $input) {
                ... on ConsentSuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('AcceptAllConsents response:', response);
        return response.data;
      },
    }),

    rejectOptionalConsents: builder.mutation<RejectOptionalConsentsResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation {
              rejectOptionalConsents {
                ... on ConsentSuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        console.log('RejectOptionalConsents response:', response);
        return response.data;
      },
    }),

    updateAllConsents: builder.mutation<UpdateAllConsentsResponse, UpdateAllConsentsInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation UpdateAllConsents($input: UpdateAllConsentsInput!) {
              updateAllConsents(input: $input) {
                ... on ConsentSuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('UpdateAllConsents response:', response);
        return response.data;
      },
    }),

    // GDPR Data Export
    exportMyData: builder.mutation<ExportMyDataResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation {
              exportMyData {
                ... on DataExportSuccessType {
                  __typename
                  success
                  message
                  exportData
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        console.log('ExportMyData response:', response);
        return response.data;
      },
    }),

    // GDPR Data Deletion - Delete Account
    deleteAccount: builder.mutation<DeleteAccountResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation {
              deleteAccount {
                ... on SuccessType {
                  __typename
                  success
                  message
                  data
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        console.log('DeleteAccount response:', response);
        return response.data;
      },
    }),

    // ===== ONBOARDING ENDPOINTS =====

    // Get Onboarding Status
    getOnboardingStatus: builder.query<OnboardingStatusResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetOnboardingStatus {
              onboardingStatus {
                subscriptionComplete
                profileSetupComplete
                cvUploadComplete
                currentStep
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        console.log('GetOnboardingStatus response:', response);
        return response.data;
      },
      providesTags: ['Onboarding'],
    }),

    // Update Onboarding Step
    updateOnboardingStep: builder.mutation<UpdateOnboardingStepResponse, UpdateOnboardingStepInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation UpdateOnboardingStep($input: UpdateOnboardingStepInput!) {
              updateOnboardingStep(input: $input) {
                success
                message
                currentStep
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('UpdateOnboardingStep response:', response);
        return response.data;
      },
      invalidatesTags: ['Onboarding'],
    }),

    // Get Profile Progress
    getProfileProgress: builder.query<ProfileProgressResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetProfileProgress {
              profileProgress {
                totalPoints
                maxPoints
                completionPercentage
                sections {
                  name
                  displayName
                  points
                  completed
                  required
                }
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        console.log('GetProfileProgress response:', response);
        return response.data;
      },
      providesTags: ['Onboarding', 'Profile'],
    }),

    // Update Personal Info
    updatePersonalInfo: builder.mutation<UpdatePersonalInfoResponse, UpdatePersonalInfoInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation UpdatePersonalInfo($input: UpdatePersonalInfoInput!) {
              updatePersonalInfo(input: $input) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  message
                  success
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('UpdatePersonalInfo response:', response);
        return response.data;
      },
      invalidatesTags: ['Profile'],
    }),

    // Award Profile Points
    awardProfilePoints: builder.mutation<AwardProfilePointsResponse, AwardProfilePointsInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation AwardProfilePoints($input: AwardProfilePointsInput!) {
              awardProfilePoints(input: $input) {
                success
                message
                pointsAwarded
                totalPoints
                badge
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('AwardProfilePoints response:', response);
        return response.data;
      },
      invalidatesTags: ['Onboarding', 'Profile'],
    }),

    // CRS (Career Readiness Score) Queries
    getMyCRS: builder.query<MyCRSResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetMyCRS {
              myCrs {
                id
                totalScore
                level
                levelDisplay
                cvQualityScore
                skillsEvidenceScore
                interviewReadinessScore
                marketAlignmentScore
                engagementConsistencyScore
                wellbeingStabilityScore
                pointsToNextLevel
                nextLevel
                statusMessage
                lastCalculatedAt
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ['CRS'],
    }),

    getCRSDashboard: builder.query<CRSDashboardResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetCRSDashboard {
              crsDashboard {
                crs {
                  totalScore
                  level
                  levelDisplay
                }
                trend
                trendDescription
                primaryRecommendation
                secondaryRecommendations
                daysOnPlatform
                totalImprovements
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        console.log('GetCRSDashboard response:', response);
        return response.data;
      },
      providesTags: ['CRS'],
    }),

    // Career Dashboard Full Query
    getCareerDashboardFull: builder.query<CareerDashboardFullResponse, CareerDashboardFullInput | void>({
      query: (args) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query CareerDashboardFull($months: Int, $timeframe: TimeframeEnum) {
              careerDashboardFull(months: $months, timeframe: $timeframe) {
                currentLevel
                currentLevelDisplay
                daysOnPlatform
                nextMilestone
                pointsToNextLevel
                primaryRecommendation
                totalCrsScore
                userName
                wellbeing {
                  consistencyDescription
                  consistencyDisplay
                  consistencyLevel
                  moodDescription
                  moodDisplay
                  moodLevel
                  overallScore
                  productivityDescription
                  productivityDisplay
                  productivityLevel
                }
                scoreProgress {
                  currentActivities
                  currentCvStrength
                  currentSkillsMatch
                  dataPointsCount
                  timeframe
                  monthlyData {
                    activities
                    cvStrength
                    month
                    monthFull
                    skillsMatch
                    year
                  }
                }
                quickStats {
                  change
                  changeIsPositive
                  label
                  value
                }
              }
            }
          `,
          variables: {
            months: args?.months || 10,
            timeframe: args?.timeframe || 'MONTHLY',
          },
        },
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ['CRS'],
    }),

    // Recent Activity Query
    getRecentActivity: builder.query<RecentActivityResponse, RecentActivityInput | void>({
      query: (args) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query RecentActivity($limit: Int, $offset: Int) {
              recentActivity(limit: $limit, offset: $offset) {
                activities {
                  id
                  activityType
                  title
                  description
                  timestamp
                  relativeTime
                  actionUrl
                  actionLabel
                  metadata
                }
                totalCount
                hasMore
              }
            }
          `,
          variables: {
            limit: args?.limit ?? 3,
            offset: args?.offset ?? 0,
          },
        },
      }),
      transformResponse: (response: any) => {
        console.log('GetRecentActivity response:', response);
        return response.data;
      },
    }),

    // Feature Gating Queries
    getFeatureGates: builder.query<FeatureGatesResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetFeatureGates {
              featureGates {
                availableFeatures {
                  featureId
                  featureName
                  featureDescription
                }
                lockedFeatures {
                  featureId
                  featureName
                  requiredLevel
                  requiredLevelDisplay
                }
                nextFeatures {
                  featureId
                  featureName
                  requiredLevel
                }
                totalAvailable
                totalLocked
                currentLevel
                currentLevelDisplay
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        // If there's no data, return a fallback structure to prevent undefined
        if (!response.data || !response.data.featureGates) {
          return {
            featureGates: {
              availableFeatures: [],
              lockedFeatures: [],
              nextFeatures: [],
              totalAvailable: 0,
              totalLocked: 0,
              currentLevel: '',
              currentLevelDisplay: 'Bronze',
            }
          };
        }
        return response.data;
      },
      providesTags: ['CRS'],
    }),

    hasFeatureAccess: builder.query<HasFeatureAccessResponse, string>({
      query: (feature) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query HasFeatureAccess($feature: String!) {
              hasFeatureAccess(feature: $feature)
            }
          `,
          variables: { feature },
        },
      }),
      transformResponse: (response: any) => {
        console.log('HasFeatureAccess response:', response);
        return response.data;
      },
      providesTags: ['CRS'],
    }),

    getActiveMissions: builder.query<ActiveMissionsResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetActiveMissions {
              activeMissions {
                aiReasoning
                assignedAt
                badgeReward
                completedAt
                crsPointsReward
                daysRemaining
                description
                difficulty
                difficultyDisplay
                dueDate
                estimatedTimeMinutes
                id
                isOverdue
                missionType
                missionTypeDisplay
                progressPercentage
                status
                statusDisplay
                successCriteria
                targetComponent
                title
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ['Missions'],
    }),

    // Complete Recruiter Profile (for Google OAuth users who need to complete profile setup)
    completeRecruiterProfile: builder.mutation<CompleteRecruiterProfileResponse, CompleteRecruiterProfileInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation CompleteRecruiterProfile($input: CompleteRecruiterProfileInput!) {
              completeRecruiterProfile(input: $input) {
                ... on CompleteRecruiterProfileSuccessType {
                  success
                  message
                  recruiter {
                    id
                    organizationName
                    organizationType
                    subRole
                    position
                    linkedinUrl
                    profileSetupComplete
                    user {
                      id
                      email
                      firstName
                      lastName
                    }
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('CompleteRecruiterProfile response:', response);
        // Check for GraphQL errors
        if (response.errors && response.errors.length > 0) {
          console.error('GraphQL errors:', response.errors);
          return {
            completeRecruiterProfile: {
              __typename: 'ErrorType',
              success: false,
              message: response.errors[0]?.message || 'An error occurred',
            }
          };
        }
        // Check if data is null
        if (!response.data || !response.data.completeRecruiterProfile) {
          console.error('Null response from completeRecruiterProfile');
          return {
            completeRecruiterProfile: {
              __typename: 'ErrorType',
              success: false,
              message: 'Failed to complete profile. Please try again.',
            }
          };
        }
        return response.data;
      },
      invalidatesTags: ['Auth', 'Profile'],
    }),

    recalculateCRS: builder.mutation<{ recalculateCrs: { success: boolean; message: string; crs?: CRSData } }, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation RecalculateCRS {
              recalculateCrs {
                ... on CRSSuccessType {
                  success
                  message
                  crs {
                    totalScore
                    level
                    levelDisplay
                  }
                }
                ... on ErrorType {
                  success
                  message
                }
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        console.log('RecalculateCRS response:', response);
        return response.data;
      },
      invalidatesTags: ['CRS'],
    }),

    // Notification Queries and Mutations
    getMyNotifications: builder.query<MyNotificationsResponse, MyNotificationsInput | void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query MyNotifications {
              myNotifications {
                notifications {
                  id
                  type
                  category
                  title
                  message
                  isRead
                  readAt
                  relatedJobId
                  relatedApplicationId
                  relatedMissionId
                  relatedSubscriptionId
                  relatedCrsId
                  actionUrl
                  createdAt
                }
                totalCount
                unreadCount
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        console.log('GetMyNotifications response:', response);
        return response.data;
      },
      providesTags: ['Notifications'],
    }),

    getUnreadNotificationCount: builder.query<UnreadNotificationCountResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query UnreadCount {
              unreadNotificationCount
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        console.log('GetUnreadNotificationCount response:', response);
        return response.data;
      },
      providesTags: ['Notifications'],
    }),

    getNotification: builder.query<NotificationResponse, string>({
      query: (id) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query Notification($id: ID!) {
              notification(id: $id) {
                id
                type
                category
                title
                message
                isRead
                readAt
                relatedJobId
                relatedApplicationId
                relatedMissionId
                relatedSubscriptionId
                relatedCrsId
                actionUrl
                createdAt
              }
            }
          `,
          variables: { id },
        },
      }),
      transformResponse: (response: any) => {
        console.log('GetNotification response:', response);
        return response.data;
      },
      providesTags: ['Notifications'],
    }),

    markNotificationAsRead: builder.mutation<MarkNotificationAsReadResponse, { notificationId: string }>({
      query: ({ notificationId }) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation MarkAsRead($notificationId: ID!) {
              markNotificationAsRead(notificationId: $notificationId) {
                success
                message
                notification {
                  id
                  isRead
                  readAt
                }
              }
            }
          `,
          variables: { notificationId },
        },
      }),
      transformResponse: (response: any) => {
        console.log('MarkNotificationAsRead response:', response);
        return response.data;
      },
      invalidatesTags: ['Notifications'],
    }),

    markAllNotificationsAsRead: builder.mutation<MarkAllNotificationsAsReadResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation MarkAllAsRead {
              markAllNotificationsAsRead {
                success
                message
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        console.log('MarkAllNotificationsAsRead response:', response);
        return response.data;
      },
      invalidatesTags: ['Notifications'],
    }),

    deleteNotification: builder.mutation<DeleteNotificationResponse, { notificationId: string }>({
      query: ({ notificationId }) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation DeleteNotification($notificationId: ID!) {
              deleteNotification(notificationId: $notificationId) {
                success
                message
              }
            }
          `,
          variables: { notificationId },
        },
      }),
      transformResponse: (response: any) => {
        console.log('DeleteNotification response:', response);
        return response.data;
      },
      invalidatesTags: ['Notifications'],
    }),

    // =============================================
    // AI Features - Mission Mutations
    // =============================================

    generateWeeklyMissions: builder.mutation<GenerateWeeklyMissionsResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation GenerateWeeklyMissions {
              generateWeeklyMissions {
                ... on MissionSuccessType {
                  __typename
                  success
                  message
                  mission {
                    id
                    title
                    description
                    missionType
                    missionTypeDisplay
                    difficulty
                    difficultyDisplay
                    status
                    statusDisplay
                    progressPercentage
                    crsPointsReward
                    badgeReward
                    assignedAt
                    dueDate
                    daysRemaining
                    isOverdue
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        console.log('GenerateWeeklyMissions response:', response);
        return response.data;
      },
      invalidatesTags: ['Missions', 'CRS'],
    }),

    completeMission: builder.mutation<CompleteMissionResponse, CompleteMissionInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation CompleteMission($input: CompleteMissionInput!) {
              completeMission(input: $input) {
                ... on MissionCompletionSuccessType {
                  __typename
                  success
                  message
                  mission {
                    id
                    status
                    completedAt
                  }
                  crsPointsAwarded
                  newCrsScore
                }
                ... on ErrorType {
                  __typename
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('CompleteMission response:', response);
        return response.data;
      },
      invalidatesTags: ['Missions', 'CRS'],
    }),

    skipMission: builder.mutation<SkipMissionResponse, SkipMissionInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation SkipMission($input: SkipMissionInput!) {
              skipMission(input: $input) {
                ... on MissionSuccessType {
                  __typename
                  success
                  message
                  mission {
                    id
                    title
                    status
                    statusDisplay
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      invalidatesTags: ['Missions'],
    }),

    updateMissionProgress: builder.mutation<UpdateMissionProgressResponse, UpdateMissionProgressInput>({
      query: ({ missionId, progressPercentage }) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation UpdateProgress($missionId: String!, $progressPercentage: Int!) {
              updateMissionProgress(missionId: $missionId, progressPercentage: $progressPercentage) {
                ... on MissionSuccessType {
                  __typename
                  success
                  message
                  mission {
                    id
                    progressPercentage
                  }
                }
                ... on ErrorType {
                  __typename
                  message
                }
              }
            }
          `,
          variables: { missionId, progressPercentage },
        },
      }),
      transformResponse: (response: any) => {
        console.log('UpdateMissionProgress response:', response);
        return response.data;
      },
      invalidatesTags: ['Missions'],
    }),

    rateMission: builder.mutation<RateMissionResponse, RateMissionInput>({
      query: ({ missionId, rating, feedback }) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation RateMission($missionId: String!, $rating: Int!, $feedback: String) {
              rateMission(missionId: $missionId, rating: $rating, feedback: $feedback) {
                ... on SuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  message
                }
              }
            }
          `,
          variables: { missionId, rating, feedback },
        },
      }),
      transformResponse: (response: any) => {
        console.log('RateMission response:', response);
        return response.data;
      },
    }),

    getMyMissions: builder.query<MyMissionsResponse, MyMissionsInput | void>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query MyMissions($status: MissionStatusEnum, $limit: Int, $offset: Int) {
              myMissions(status: $status, limit: $limit, offset: $offset) {
                activeCount
                completedCount
                hasMore
                missions {
                  aiReasoning
                  assignedAt
                  badgeReward
                  completedAt
                  crsPointsReward
                  daysRemaining
                  description
                  difficulty
                  difficultyDisplay
                  dueDate
                  estimatedTimeMinutes
                  id
                  isOverdue
                  missionType
                  missionTypeDisplay
                  progressPercentage
                  status
                  statusDisplay
                  successCriteria
                  targetComponent
                  title
                }
                totalCount
              }
            }
          `,
          variables: input || {},
        },
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ['Missions'],
    }),

    getWeeklyMissions: builder.query<WeeklyMissionsResponse, WeeklyMissionsInput | void>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query WeeklyMissions($weekNumber: Int, $year: Int) {
              weeklyMissions(weekNumber: $weekNumber, year: $year) {
                weekNumber
                year
                missions {
                  id
                  title
                  description
                  missionType
                  missionTypeDisplay
                  difficulty
                  difficultyDisplay
                  status
                  statusDisplay
                  progressPercentage
                  crsPointsReward
                  badgeReward
                  aiReasoning
                  targetComponent
                  estimatedTimeMinutes
                  successCriteria
                  assignedAt
                  dueDate
                  completedAt
                  daysRemaining
                  isOverdue
                  completion {
                    id
                    completionMethod
                    crsPointsAwarded
                    badgeAwarded
                    aiFeedback
                    userRating
                    userFeedback
                    completedAt
                  }
                }
                totalPointsAvailable
                pointsEarned
                completionRate
              }
            }
          `,
          variables: input || {},
        },
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ['Missions'],
    }),

    getMissionStats: builder.query<MissionStatsResponse, void>({
      query: () => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query MissionStats {
              missionStats {
                totalCompleted
                totalPointsEarned
                currentStreak
                bestStreak
              }
            }
          `,
        },
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ['Missions'],
    }),

    getMissionDetails: builder.query<MissionDetailsResponse, { missionId: string }>({
      query: ({ missionId }) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query MissionDetails($missionId: String!) {
              missionDetails(missionId: $missionId) {
                id
                title
                description
                missionType
                missionTypeDisplay
                difficulty
                difficultyDisplay
                status
                statusDisplay
                progressPercentage
                crsPointsReward
                badgeReward
                aiReasoning
                targetComponent
                estimatedTimeMinutes
                successCriteria
                assignedAt
                dueDate
                completedAt
                daysRemaining
                isOverdue
                completion {
                  id
                  completionMethod
                  crsPointsAwarded
                  badgeAwarded
                  aiFeedback
                  userRating
                  userFeedback
                  completedAt
                }
              }
            }
          `,
          variables: { missionId },
        },
      }),
      transformResponse: (response: any) => {
        console.log('GetMissionDetails response:', response);
        return response.data;
      },
      providesTags: ['Missions'],
    }),

    // =============================================
    // AI Features - RAY Chatbot Mutations
    // =============================================

    createConversation: builder.mutation<CreateConversationResponse, CreateConversationInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation CreateConversation($input: CreateConversationInput) {
              createConversation(input: $input) {
                ... on ConversationSuccessType {
                  __typename
                  success
                  message
                  conversation {
                    id
                    title
                    status
                    createdAt
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('CreateConversation response:', response);
        return response.data;
      },
    }),

    sendTextMessage: builder.mutation<SendTextMessageResponse, SendTextMessageInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation SendTextMessage($input: SendTextMessageInput!) {
              sendTextMessage(input: $input) {
                ... on SendMessageSuccessType {
                  __typename
                  success
                  message
                  conversationId
                  userMessage {
                    id
                    content
                    role
                    createdAt
                  }
                  assistantMessage {
                    id
                    content
                    role
                    createdAt
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('SendTextMessage response:', response);
        return response.data;
      },
    }),

    sendVoiceMessage: builder.mutation<SendVoiceMessageResponse, SendVoiceMessageInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation SendVoiceMessage($input: SendVoiceMessageInput!) {
              sendVoiceMessage(input: $input) {
                ... on SendMessageSuccessType {
                  __typename
                  success
                  message
                  conversationId
                  userMessage {
                    id
                    content
                    role
                    createdAt
                    audioUrl
                  }
                  assistantMessage {
                    id
                    content
                    role
                    createdAt
                    ttsAudioUrl
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('SendVoiceMessage response:', response);
        return response.data;
      },
    }),

    uploadChatDocument: builder.mutation<DocumentUploadResponse, DocumentUploadInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation UploadDocument($input: DocumentUploadInput!) {
              uploadDocument(input: $input) {
                ... on DocumentType {
                  __typename
                  id
                  fileName
                  processedAt
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('UploadChatDocument response:', response);
        return response.data;
      },
    }),

    updateConversation: builder.mutation<UpdateConversationResponse, UpdateConversationInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation UpdateConversation($input: UpdateConversationInput!) {
              updateConversation(input: $input) {
                ... on ConversationSuccessType {
                  __typename
                  success
                  message
                  conversation {
                    id
                    title
                  }
                }
                ... on ErrorType {
                  __typename
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('UpdateConversation response:', response);
        return response.data;
      },
    }),

    archiveConversation: builder.mutation<ArchiveConversationResponse, ArchiveConversationInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation ArchiveConversation($input: ArchiveConversationInput!) {
              archiveConversation(input: $input) {
                ... on ConversationSuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('ArchiveConversation response:', response);
        return response.data;
      },
    }),

    deleteConversation: builder.mutation<DeleteConversationResponse, DeleteConversationInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation DeleteConversation($input: DeleteConversationInput!) {
              deleteConversation(input: $input) {
                ... on ConversationSuccessType {
                  __typename
                  success
                  message
                }
                ... on ErrorType {
                  __typename
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('DeleteConversation response:', response);
        return response.data;
      },
    }),

    getMyConversations: builder.query<GetConversationsResponse, GetConversationsInput | void>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query MyConversations($status: String, $limit: Int, $offset: Int) {
              myConversations(status: $status, limit: $limit, offset: $offset) {
                ... on ConversationListType {
                  __typename
                  conversations {
                    id
                    title
                    status
                    messageCount
                    lastMessageAt
                    createdAt
                  }
                  totalCount
                  hasNext
                }
                ... on ErrorType {
                  __typename
                  message
                }
              }
            }
          `,
          variables: input || {},
        },
      }),
      transformResponse: (response: any) => {
        console.log('GetMyConversations response:', response);
        return response.data;
      },
    }),

    getConversation: builder.query<GetConversationResponse, GetConversationInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetConversation($conversationId: ID!) {
              conversation(conversationId: $conversationId) {
                ... on ConversationSuccessType {
                  __typename
                  success
                  conversation {
                    id
                    title
                    status
                    createdAt
                    updatedAt
                  }
                }
                ... on ErrorType {
                  __typename
                  message
                }
              }
            }
          `,
          variables: { conversationId: input.conversationId },
        },
      }),
      transformResponse: (response: any) => {
        console.log('GetConversation response:', response);
        return response.data;
      },
    }),

    getConversationMessages: builder.query<GetConversationMessagesResponse, GetConversationMessagesInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query ConversationMessages($conversationId: ID!, $limit: Int, $beforeId: ID) {
              conversationMessages(conversationId: $conversationId, limit: $limit, beforeId: $beforeId) {
                ... on MessageListType {
                  __typename
                  messages {
                    id
                    content
                    role
                    audioUrl
                    ttsAudioUrl
                    createdAt
                  }
                  hasMore
                }
                ... on ErrorType {
                  __typename
                  message
                }
              }
            }
          `,
          variables: {
            conversationId: input.conversationId,
            limit: input.limit,
            beforeId: input.beforeId,
          },
        },
      }),
      transformResponse: (response: any) => {
        console.log('GetConversationMessages response:', response);
        return response.data;
      },
    }),

    getChatDocuments: builder.query<GetChatDocumentsResponse, GetChatDocumentsInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query ChatDocuments($conversationId: ID!, $limit: Int) {
              chatDocuments(conversationId: $conversationId, limit: $limit) {
                id
                fileName
                documentType
                status
                createdAt
              }
            }
          `,
          variables: {
            conversationId: input.conversationId,
            limit: input.limit,
          },
        },
      }),
      transformResponse: (response: any) => {
        console.log('GetChatDocuments response:', response);
        return response.data;
      },
    }),

    // =============================================
    // AI Features - Cover Letter Generator
    // =============================================

    generateCoverLetter: builder.mutation<GenerateCoverLetterResponse, GenerateCoverLetterInput>({
      query: (input) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            mutation GenerateCoverLetter($input: GenerateCoverLetterInput!) {
              generateCoverLetter(input: $input) {
                ... on CoverLetterGenerationSuccessType {
                  __typename
                  success
                  message
                  generation {
                    id
                    status
                    generatedCoverLetter
                    coverLetterPdfUrl
                    errorMessage
                  }
                }
                ... on ErrorType {
                  __typename
                  success
                  message
                }
              }
            }
          `,
          variables: { input },
        },
      }),
      transformResponse: (response: any) => {
        console.log('GenerateCoverLetter response:', response);
        return response.data;
      },
    }),

    getCoverLetterGeneration: builder.query<GetCoverLetterGenerationResponse, { id: string }>({
      query: ({ id }) => ({
        url: '/graphql/',
        method: 'POST',
        body: {
          query: `
            query GetCoverLetterGeneration($id: String!) {
              coverLetterGeneration(id: $id) {
                id
                status
                generatedCoverLetter
                coverLetterPdfUrl
                errorMessage
                createdAt
              }
            }
          `,
          variables: { id },
        },
      }),
      transformResponse: (response: any) => {
        console.log('GetCoverLetterGeneration response:', response);
        return response.data;
      },
    }),
  }),
});

export const {
  useRegisterCandidateMutation,
  useRegisterRecruiterMutation,
  useLoginMutation,
  useVerifyTokenQuery,
  useRefreshTokenMutation,
  useLogoutMutation,
  useAddEducationMutation,
  useUpdateEducationMutation,
  useDeleteEducationMutation,
  useAddExperienceMutation,
  useUpdateExperienceMutation,
  useDeleteExperienceMutation,
  useGetCandidateProfileQuery,
  useGetRecruiterProfileQuery,
  useUpdateCandidateProfileMutation,
  useAddSkillMutation,
  useRemoveSkillMutation,
  useUpdateSkillsMutation,
  useAddHobbyMutation,
  useRemoveHobbyMutation,
  useUpdateHobbiesMutation,
  // Preferred Locations hooks
  useAddPreferredLocationsMutation,
  useUpdatePreferredLocationsMutation,
  useDeletePreferredLocationsMutation,
  // Profile Picture hooks
  useGetMyProfileQuery,
  useUploadCandidateProfilePictureMutation,
  useUploadRecruiterProfilePictureMutation,
  useDeleteCandidateProfilePictureMutation,
  useDeleteRecruiterProfilePictureMutation,
  // Profile Banner hooks
  useUploadCandidateProfileBannerMutation,
  useUploadRecruiterProfileBannerMutation,
  useUploadAndParseResumeMutation,
  // Certification hooks
  useAddCertificationMutation,
  useDeleteCertificationMutation,
  useDeleteCertificatePdfMutation,
  useUpdateCertificationMutation,
  // Extra-curricular and Leadership hooks
  useAddExtraCurricularMutation,
  useDeleteExtraCurricularMutation,
  useUpdateExtraCurricularMutation,
  useAddLeadershipSocialMutation,
  useDeleteLeadershipSocialMutation,
  useUpdateLeadershipSocialMutation,
  // CV Builder hooks
  useCreateResumeMutation,
  useUpdateResumeMutation,
  useDeleteResumeMutation,
  useParseAndCreateResumeMutation,
  useParseResumeAsyncMutation,
  useGenerateProfessionalSummaryMutation,
  useImproveContentMutation,
  useAddKeywordsMutation,
  useExportResumePdfMutation,
  useGetMyResumesQuery,
  useLazyGetMyResumesQuery,
  useGetResumeByIdQuery,
  useGetResumeStatsQuery,
  useSearchResumesQuery,
  // Subscription hooks
  useGetStripePublicKeyQuery,
  useGetAvailablePlansQuery,
  useCheckSubscriptionStatusQuery,
  useGetMySubscriptionQuery,
  useCreateCheckoutSessionMutation,
  useCreatePaymentIntentMutation,
  useCreateSubscriptionSetupMutation,
  useCancelSubscriptionMutation,
  useReactivateSubscriptionMutation,
  useCreatePortalSessionMutation,
  useGetBillingHistoryQuery,
  useLazySyncSubscriptionStatusQuery,
  useChangePlanMutation,
  // Paypal Payment hooks
  useCreatePaypalSubscriptionMutation,
  useCapturePaypalSubscriptionMutation,
  useCancelPaypalSubscriptionMutation,
  // Google OAuth hooks
  useGetGoogleOAuthUrlMutation,
  useGoogleOAuthLoginMutation,
  useLinkGoogleAccountMutation,
  useUnlinkGoogleAccountMutation,
  // LinkedIn OAuth hooks
  useLinkedinOAuthLoginMutation,
  // Google Calendar hooks
  useGetGoogleCalendarAuthUrlMutation,
  useConnectGoogleCalendarMutation,
  useDisconnectGoogleCalendarMutation,
  useIsGoogleCalendarConnectedQuery,
  // Interview Scheduling hooks
  useCreateInterviewSlotsMutation,
  useSelectInterviewSlotMutation,
  useCancelInterviewMutation,
  useRescheduleInterviewMutation,
  useSyncInterviewToCalendarMutation,
  useInterviewSlotsQuery,
  useAllInterviewSlotsQuery,
  useMyInterviewsQuery,
  useUpcomingInterviewsQuery,
  useApplicationInterviewQuery,
  useInterviewQuery,
  // Job Match Engine hooks - Recruiter
  useCreateJobPostingMutation,
  useUpdateJobPostingMutation,
  useDeleteJobPostingMutation,
  useGetMyJobPostingsQuery,
  useGetJobApplicationsQuery,
  useGetShortlistedApplicationsQuery,
  useGetRejectedApplicationsQuery,
  useShortlistApplicationMutation,
  useRejectApplicationMutation,
  // Job Match Engine hooks - Candidate
  useApplyToJobMutation,
  useWithdrawApplicationMutation,
  useSaveJobMutation,
  useUnsaveJobMutation,
  useGetJobPostingsQuery,
  useGetJobPostingQuery,
  useGetMyJobMatchesQuery,
  useGetJobMatchQuery,
  useGetMyApplicationsQuery,
  useGetMySavedJobsQuery,
  // Interview Coach hooks
  useStartInterviewSessionMutation,
  useSubmitTextResponseMutation,
  useSubmitVoiceResponseMutation,
  useCompleteInterviewSessionMutation,
  useAbandonInterviewSessionMutation,
  useConvertVoiceMutation,
  useConvertVoiceWithAnalysisMutation,
  useGetInterviewCoachSessionsQuery,
  useGetInterviewCoachSessionQuery,
  useGetNextInterviewQuestionQuery,
  useGetInterviewCoachStatsQuery,
  useGetAvailableInterviewTypesQuery,
  useGetAvailableDifficultyLevelsQuery,
  useGetAvailableVoicesQuery,
  // GDPR Consent hooks
  useHasGivenConsentQuery,
  useLazyHasGivenConsentQuery,
  useRequiresConsentUpdateQuery,
  useLazyRequiresConsentUpdateQuery,
  useAcceptAllConsentsMutation,
  useRejectOptionalConsentsMutation,
  useUpdateAllConsentsMutation,
  // GDPR Data Export & Deletion hooks
  useExportMyDataMutation,
  useDeleteAccountMutation,
  // Onboarding hooks
  useGetOnboardingStatusQuery,
  useLazyGetOnboardingStatusQuery,
  useUpdateOnboardingStepMutation,
  useGetProfileProgressQuery,
  useLazyGetProfileProgressQuery,
  useAwardProfilePointsMutation,
  useUpdatePersonalInfoMutation,
  // CRS (Career Readiness Score) hooks
  useGetMyCRSQuery,
  useLazyGetMyCRSQuery,
  useGetCRSDashboardQuery,
  useLazyGetCRSDashboardQuery,
  useGetCareerDashboardFullQuery,
  useLazyGetCareerDashboardFullQuery,
  // Recent Activity hooks
  useGetRecentActivityQuery,
  useLazyGetRecentActivityQuery,
  // Feature Gating hooks
  useGetFeatureGatesQuery,
  useLazyGetFeatureGatesQuery,
  useHasFeatureAccessQuery,
  useLazyHasFeatureAccessQuery,
  // Mission hooks
  useGetActiveMissionsQuery,
  useLazyGetActiveMissionsQuery,
  useRecalculateCRSMutation,
  // Recruiter Profile Setup hooks
  useCompleteRecruiterProfileMutation,
  // Notification hooks
  useGetMyNotificationsQuery,
  useLazyGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useLazyGetUnreadNotificationCountQuery,
  useGetNotificationQuery,
  useLazyGetNotificationQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  // AI Features - Mission Mutations hooks
  useGenerateWeeklyMissionsMutation,
  useCompleteMissionMutation,
  useSkipMissionMutation,
  useUpdateMissionProgressMutation,
  useRateMissionMutation,
  useGetMyMissionsQuery,
  useLazyGetMyMissionsQuery,
  useGetWeeklyMissionsQuery,
  useLazyGetWeeklyMissionsQuery,
  useGetMissionStatsQuery,
  useLazyGetMissionStatsQuery,
  useGetMissionDetailsQuery,
  useLazyGetMissionDetailsQuery,
  // AI Features - RAY Chatbot hooks
  useCreateConversationMutation,
  useSendTextMessageMutation,
  useSendVoiceMessageMutation,
  useUploadChatDocumentMutation,
  useUpdateConversationMutation,
  useArchiveConversationMutation,
  useDeleteConversationMutation,
  useGetMyConversationsQuery,
  useLazyGetMyConversationsQuery,
  useGetConversationQuery,
  useLazyGetConversationQuery,
  useGetConversationMessagesQuery,
  useLazyGetConversationMessagesQuery,
  useGetChatDocumentsQuery,
  useLazyGetChatDocumentsQuery,
  // AI Features - Cover Letter hooks
  useGenerateCoverLetterMutation,
  useLazyGetCoverLetterGenerationQuery,
} = api;
