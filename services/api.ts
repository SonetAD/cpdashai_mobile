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
  createCandidate: SuccessType | ErrorType;
}

export interface RegisterRecruiterInput {
  email?: string;
  password: string;
  passwordConfirm: string;
  phoneNumber?: string;
  firstName?: string;
}

export interface RegisterRecruiterResponse {
  createRecruiter: SuccessType | ErrorType;
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

export interface UpdateEducationSuccessType {
  __typename: 'UpdateEducationSuccessType';
  education: Education;
  message: string;
  success: boolean;
}

export interface UpdateEducationResponse {
  updateEducation: UpdateEducationSuccessType | ErrorType;
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
  tagTypes: ['Auth', 'Profile'],
  endpoints: (builder) => ({
    registerCandidate: builder.mutation<RegisterCandidateResponse, RegisterCandidateInput>({
      query: (input) => {
        const body = {
          query: `
            mutation CreateCandidate($input: RegisterAsCandidateInput!) {
              createCandidate(input: $input) {
                ... on SuccessType {
                  __typename
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
        console.log('Making request to:', `${API_URL}/graphql/`);
        console.log('Request body:', JSON.stringify(body, null, 2));
        return {
          url: '/graphql/',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => {
        console.log('Response received:', response);
        return response.data;
      },
      invalidatesTags: ['Auth'],
    }),
    registerRecruiter: builder.mutation<RegisterRecruiterResponse, RegisterRecruiterInput>({
      query: (input) => {
        const body = {
          query: `
            mutation CreateRecruiter($input: RegisterAsRecruiterInput!) {
              createRecruiter(input: $input) {
                ... on SuccessType {
                  __typename
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
    }),
    updateEducation: builder.mutation<UpdateEducationResponse, UpdateEducationInput>({
      query: (input) => {
        const body = {
          query: `
            mutation UpdateEducation($input: UpdateEducationInput!) {
              updateEducation(input: $input) {
                ... on UpdateEducationSuccessType {
                  __typename
                  success
                  message
                  education {
                    id
                    degree
                    institution
                    fieldOfStudy
                    startDate
                    endDate
                    grade
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
              myCandidateProfile {
                id
                user {
                  id
                  email
                  firstName
                  lastName
                  fullName
                  phoneNumber
                  bio
                  role
                  isVerified
                  profilePictureUrl
                  dateJoined
                  updatedAt
                }
                title
                experienceLevel
                yearsOfExperience
                skills
                hobbies
                education
                experience
                portfolioUrl
                githubUrl
                linkedinUrl
                resumeUrl
                lookingForJob
                expectedSalary
                preferredLocations
                preferredLocationsList
                isActive
                createdAt
                updatedAt
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
        if (response.data?.myCandidateProfile) {
          // Parse JSON fields if they're strings
          const profile = response.data.myCandidateProfile;
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
  useAddSkillMutation,
  useRemoveSkillMutation,
  useUpdateSkillsMutation,
  useAddHobbyMutation,
  useRemoveHobbyMutation,
  useUpdateHobbiesMutation,
  useUploadAndParseResumeMutation,
} = api;
