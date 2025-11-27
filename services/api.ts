import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

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

// Candidate profile types
export interface CandidateExperience {
  company: string;
  position: string;
  location: string;
  start_date: string;
  end_date: string;
  description: string;
  current: boolean;
  employment_type?: string;
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
  preferredLocations?: string[];
  preferredLocationsList?: string[];
  lookingForJob?: boolean;
  yearsOfExperience?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  education?: CandidateEducation[];
  experience?: CandidateExperience[];
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
  experienceLevel?: string;
  expectedSalary?: string;
  skills?: string[];
  hobbies?: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  preferredLocations?: string[];
  preferredLocationsList?: string[];
  lookingForJob?: boolean;
  yearsOfExperience?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  education?: CandidateEducation[];
  experience?: CandidateExperience[];
}

export interface GetCandidateProfileResponse {
  candidate: GetCandidateProfileSuccessType | ErrorType;
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
  cancelSubscription: SuccessType | ErrorType;
}

export interface ReactivateSubscriptionResponse {
  reactivateSubscription: SuccessType | ErrorType;
}

export interface CreatePortalSessionResponse {
  createPortalSession: {
    success: boolean;
    message: string;
    portalUrl: string | null;
  };
}

export interface StripePublicKeyResponse {
  stripePublicKey: string;
}

// Create the API
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState, endpoint }) => {
      headers.set('Content-Type', 'application/json');

      // Get tokens from Redux state
      const state = (getState() as any).auth;
      const token = state.token;
      const refreshToken = state.refreshToken;

      console.log('PrepareHeaders - Endpoint:', endpoint);
      console.log('PrepareHeaders - Token exists:', !!token);
      console.log('PrepareHeaders - Auth state:', { isAuthenticated: state.isAuthenticated, hasToken: !!token });

      if (token) {
        // Check token format
        const tokenPreview = token.substring(0, 20) + '...';
        console.log('PrepareHeaders - Token preview:', tokenPreview);
        console.log('PrepareHeaders - Token length:', token.length);

        headers.set('Authorization', `Bearer ${token}`);
        console.log('PrepareHeaders - Authorization header set with Bearer token');
      } else {
        console.warn('PrepareHeaders - No token found in Redux state!');
      }

      // For logout, also send refresh token in custom header
      if (endpoint === 'logout' && refreshToken) {
        headers.set('X-Refresh-Token', refreshToken);
      }

      return headers;
    },
  }),
  tagTypes: ['Auth', 'Profile', 'Resume', 'Subscription'],
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
                  preferredLocations
                  preferredLocationsList
                  resumeUrl
                  skills
                  title
                  updatedAt
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
          if (typeof profile.preferredLocationsList === 'string') {
            profile.preferredLocationsList = profile.preferredLocationsList.trim() ? JSON.parse(profile.preferredLocationsList) : [];
          }
          console.log('Transformed profile data:', {
            educationCount: profile.education?.length || 0,
            experienceCount: profile.experience?.length || 0,
            skillsCount: profile.skills?.length || 0,
            hobbiesCount: profile.hobbies?.length || 0,
          });
          return { candidate: { __typename: 'CandidateType', ...profile } };
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
    getMyResumes: builder.query<MyResumesResponse, void>({
      query: () => {
        const body = {
          query: `
            query MyResumes {
              myResumes {
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
    cancelSubscription: builder.mutation<CancelSubscriptionResponse, CancelSubscriptionInput>({
      query: (input) => {
        const body = {
          query: `
            mutation CancelSubscription($input: CancelSubscriptionInput!) {
              cancelSubscription(input: $input) {
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
      invalidatesTags: ['Subscription'],
    }),
    reactivateSubscription: builder.mutation<ReactivateSubscriptionResponse, void>({
      query: () => {
        const body = {
          query: `
            mutation ReactivateSubscription {
              reactivateSubscription {
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
  useAddSkillMutation,
  useRemoveSkillMutation,
  useUpdateSkillsMutation,
  useAddHobbyMutation,
  useRemoveHobbyMutation,
  useUpdateHobbiesMutation,
  useUploadAndParseResumeMutation,
  // CV Builder hooks
  useCreateResumeMutation,
  useUpdateResumeMutation,
  useDeleteResumeMutation,
  useParseAndCreateResumeMutation,
  useGenerateProfessionalSummaryMutation,
  useImproveContentMutation,
  useAddKeywordsMutation,
  useExportResumePdfMutation,
  useGetMyResumesQuery,
  useGetResumeByIdQuery,
  useGetResumeStatsQuery,
  useSearchResumesQuery,
  // Subscription hooks
  useGetStripePublicKeyQuery,
  useGetAvailablePlansQuery,
  useCheckSubscriptionStatusQuery,
  useGetMySubscriptionQuery,
  useCreateCheckoutSessionMutation,
  useCancelSubscriptionMutation,
  useReactivateSubscriptionMutation,
  useCreatePortalSessionMutation,
} = api;
