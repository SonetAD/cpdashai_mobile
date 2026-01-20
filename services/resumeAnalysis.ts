import { AnalyzeResumeResponse } from './api';

// Remove trailing slash to prevent double slashes in URLs
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000').replace(/\/$/, '');

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
  // Validate required parameters
  if (!file) {
    throw new Error('No file provided for analysis');
  }

  if (!accessToken) {
    throw new Error('Authentication token is required');
  }

  // Validate file object has required properties
  if (!file.uri || !file.name) {
    throw new Error('Invalid file object: missing uri or name');
  }

  try {
    const formData = new FormData();

    // Ensure proper file URI format for React Native
    let fileUri = file.uri;

    // On Android, file:// prefix is required
    // On iOS, the URI might already have the correct format
    if (fileUri && !fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
      fileUri = `file://${fileUri}`;
    }

    // Append resume file with correct field name (backend expects 'resume_file')
    const filePayload = {
      uri: fileUri,
      type: file.type || 'application/pdf',
      name: file.name,
    };

    console.log('[ResumeAnalysis] File payload:', JSON.stringify(filePayload));
    formData.append('resume_file', filePayload as any);

    // Append job description as text if provided (backend expects 'job_description_text')
    if (jobDescription && jobDescription.trim()) {
      formData.append('job_description_text', jobDescription.trim());
    }

    // Optionally append user email
    if (userEmail) {
      formData.append('user_email', userEmail);
    }

    console.log('[ResumeAnalysis] Making API request to:', `${API_URL}/api/resume/analyze/`);
    console.log('[ResumeAnalysis] File info:', { name: file.name, type: file.type, uri: fileUri?.substring(0, 80) });
    console.log('[ResumeAnalysis] Job description provided:', jobDescription ? jobDescription.substring(0, 50) : 'none');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/resume/analyze/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // Note: Don't set Content-Type for FormData, it will be set automatically with boundary
        },
        body: formData,
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection and try again.');
      }
      throw new Error(`Network error: ${fetchError.message || 'Failed to connect to server'}`);
    }

    clearTimeout(timeoutId);

    console.log('[ResumeAnalysis] Response status:', response.status);

    // Handle HTTP errors
    if (!response.ok) {
      let errorMessage = `Server error: ${response.status}`;

      try {
        const errorData = await response.json();
        console.error('[ResumeAnalysis] Error response:', errorData);

        if (errorData.error) {
          errorMessage = errorData.error;
        }
        if (errorData.details) {
          // Handle validation errors like {"details": {"resume_file": ["No file was submitted."]}}
          const detailMessages = Object.entries(errorData.details)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${messages}`;
            })
            .join('; ');
          errorMessage = detailMessages || errorMessage;
        }
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If we can't parse JSON, try to get text
        try {
          const errorText = await response.text();
          console.error('[ResumeAnalysis] Error text:', errorText);
          if (errorText) {
            errorMessage = errorText.substring(0, 200);
          }
        } catch {
          // Ignore parse errors
        }
      }

      // Provide user-friendly error messages based on status code
      switch (response.status) {
        case 400:
          throw new Error(`Invalid request: ${errorMessage}`);
        case 401:
          throw new Error('Your session has expired. Please log in again.');
        case 403:
          throw new Error('You do not have permission to use this feature. Please upgrade your subscription.');
        case 404:
          throw new Error('Analysis service not available. Please try again later.');
        case 413:
          throw new Error('File is too large. Please upload a smaller file.');
        case 422:
          throw new Error(`Validation error: ${errorMessage}`);
        case 429:
          throw new Error('Too many requests. Please wait a moment and try again.');
        case 500:
        case 502:
        case 503:
          // If we have a specific error message from the server, use it
          if (errorMessage && errorMessage !== `Server error: ${response.status}`) {
            throw new Error(`Analysis failed: ${errorMessage}`);
          }
          throw new Error('Server is temporarily unavailable. Please try again later.');
        default:
          throw new Error(errorMessage);
      }
    }

    // Parse response
    let result: any;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error('[ResumeAnalysis] Failed to parse response:', parseError);
      throw new Error('Invalid response from server. Please try again.');
    }

    console.log('[ResumeAnalysis] Response received:', {
      success: result.success,
      hasData: !!result.data,
      message: result.message,
    });

    // Handle API-level errors
    if (!result.success) {
      throw new Error(result.message || result.error || 'Analysis failed. Please try again.');
    }

    // Validate response data exists
    if (!result.data) {
      console.error('[ResumeAnalysis] Missing data in response:', result);
      throw new Error('Invalid response: missing analysis data');
    }

    // Extract and validate the data from the response
    const data = result.data;

    const analysisData: AnalyzeResumeResponse = {
      success: true,
      overall_score: typeof data.overall_score === 'number' ? data.overall_score : 0,
      strong_points: Array.isArray(data.strong_points) ? data.strong_points : [],
      weak_points: Array.isArray(data.weak_points) ? data.weak_points : [],
      detailed_feedback: typeof data.detailed_feedback === 'string' ? data.detailed_feedback : '',
      job_match_score: typeof data.job_match_score === 'number' ? data.job_match_score : undefined,
      matching_skills: Array.isArray(data.matching_skills) ? data.matching_skills : [],
      missing_skills: Array.isArray(data.missing_skills) ? data.missing_skills : [],
    };

    console.log('[ResumeAnalysis] Analysis complete:', {
      overall_score: analysisData.overall_score,
      job_match_score: analysisData.job_match_score,
      strong_points_count: analysisData.strong_points.length,
      weak_points_count: analysisData.weak_points.length,
    });

    return analysisData;
  } catch (error: any) {
    console.error('[ResumeAnalysis] Error:', error);

    // Re-throw if it's already a properly formatted error
    if (error.message && !error.message.includes('TypeError')) {
      throw error;
    }

    // Handle unexpected errors
    throw new Error('An unexpected error occurred while analyzing your resume. Please try again.');
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
  // Validate inputs
  if (!uri) {
    throw new Error('File URI is required');
  }
  if (!fileName) {
    throw new Error('File name is required');
  }

  try {
    // Determine the correct mime type
    let type = mimeType;
    if (!type) {
      // Infer from file extension
      const extension = fileName.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'pdf':
          type = 'application/pdf';
          break;
        case 'docx':
          type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'doc':
          type = 'application/msword';
          break;
        default:
          type = 'application/octet-stream';
      }
    }

    // In React Native, we can pass a file object to FormData directly
    // with uri, type, and name properties (no need for actual Blob)
    const fileObject = {
      uri: uri,
      type: type,
      name: fileName,
    };

    console.log('[ResumeAnalysis] Created file object:', {
      uri: fileObject.uri.substring(0, 60) + (fileObject.uri.length > 60 ? '...' : ''),
      type: fileObject.type,
      name: fileObject.name,
    });

    return fileObject;
  } catch (error: any) {
    console.error('[ResumeAnalysis] Error creating file object:', error);
    throw new Error('Failed to prepare file for upload. Please try selecting the file again.');
  }
}
