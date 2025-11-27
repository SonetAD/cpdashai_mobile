import { AnalyzeResumeResponse } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

/**
 * Analyze a resume using the REST API
 * @param file - The resume file (PDF or DOCX) as a file object with uri, type, name
 * @param jobDescription - Optional job description for matching
 * @param accessToken - JWT access token for authentication
 * @param userEmail - Optional user email for tracking
 * @returns Promise with analysis results
 */
export async function analyzeResume(
  file: any,
  jobDescription: string | null,
  accessToken: string,
  userEmail?: string
): Promise<AnalyzeResumeResponse> {
  try {
    const formData = new FormData();

    // Append resume file with correct field name
    formData.append('resume_file', file as any);

    // Append job description as text if provided
    if (jobDescription && jobDescription.trim()) {
      formData.append('job_description_text', jobDescription.trim());
    }

    // Optionally append user email
    if (userEmail) {
      formData.append('user_email', userEmail);
    }

    console.log('Making analyzeResume REST API request to:', `${API_URL}/api/resume/analyze/`);
    console.log('File info:', { name: file.name, type: file.type });
    console.log('Job description provided:', !!jobDescription);
    console.log('User email provided:', !!userEmail);

    const response = await fetch(`${API_URL}/api/resume/analyze/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        // Note: Don't set Content-Type for FormData, it will be set automatically with boundary
      },
      body: formData,
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resume analysis failed:', response.status, errorText);
      throw new Error(`Resume analysis failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Resume analysis response received:', {
      success: result.success,
      hasData: !!result.data,
    });

    if (!result.success) {
      throw new Error(result.message || 'Analysis failed');
    }

    // Extract the data from the response
    const analysisData: AnalyzeResumeResponse = {
      success: result.success,
      overall_score: result.data.overall_score,
      strong_points: result.data.strong_points || [],
      weak_points: result.data.weak_points || [],
      detailed_feedback: result.data.detailed_feedback || '',
      job_match_score: result.data.job_match_score,
      matching_skills: result.data.matching_skills || [],
      missing_skills: result.data.missing_skills || [],
    };

    console.log('Parsed analysis data:', {
      overall_score: analysisData.overall_score,
      job_match_score: analysisData.job_match_score,
      strong_points_count: analysisData.strong_points.length,
      weak_points_count: analysisData.weak_points.length,
    });

    return analysisData;
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw error;
  }
}

/**
 * Convert a URI to a file object for upload (React Native compatible)
 * This is useful for React Native where files are accessed via URI
 * @param uri - The file URI
 * @param fileName - The name of the file
 * @param mimeType - The MIME type of the file
 * @returns Promise with file object that React Native FormData can handle
 */
export async function uriToBlob(uri: string, fileName: string, mimeType: string): Promise<any> {
  try {
    // In React Native, we can pass a file object to FormData directly
    // with uri, type, and name properties (no need for actual Blob)
    const fileObject = {
      uri: uri,
      type: mimeType,
      name: fileName,
    };

    console.log('Created file object for FormData:', {
      uri: fileObject.uri.substring(0, 60) + '...',
      type: fileObject.type,
      name: fileObject.name,
    });

    return fileObject as any;
  } catch (error) {
    console.error('Error creating file object:', error);
    throw new Error('Failed to create file object from URI');
  }
}
