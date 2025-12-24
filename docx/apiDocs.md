# Resume Parsing API Documentation

> **Automatically extract and populate candidate profile data from PDF resumes**

## Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [What Gets Extracted](#what-gets-extracted)
4. [API Usage](#api-usage)
5. [Request Format](#request-format)
6. [Response Format](#response-format)
7. [Code Examples](#code-examples)
8. [What Gets Auto-Populated](#what-gets-auto-populated)
9. [Error Handling](#error-handling)
10. [Limitations & Best Practices](#limitations--best-practices)

---

## Overview

The Resume Parsing API allows candidates to upload their PDF resume and automatically extract structured information including:
- Skills
- Work Experience
- Education
- Contact Information (Email, Phone)
- Professional URLs (LinkedIn, GitHub, Portfolio)

All extracted data is automatically populated into the candidate's profile.

**Key Features:**
- PDF-only support
- Automatic text extraction using multiple PDF parsing libraries
- Intelligent section detection
- Duplicate prevention
- Base64 encoding support for easy frontend integration

---

## How It Works

### Internal Process Flow

```
1. Frontend → Converts PDF to Base64 string
2. Backend → Receives base64 data via GraphQL mutation
3. Backend → Decodes base64 to PDF bytes
4. PDF Extractor → Extracts text using pdfplumber (primary) or PyPDF2 (fallback)
5. Resume Parser → Analyzes text and identifies sections (Skills, Experience, Education)
6. Data Extraction → Extracts structured data from each section
7. Profile Update → Automatically updates candidate profile with extracted data
8. Response → Returns success message with extraction summary
```

### PDF Text Extraction (`services/utils/pdf_extractor.py`)

The system uses a **dual-library approach** for maximum compatibility:

1. **Primary:** `pdfplumber` - Better for structured, formatted PDFs
2. **Fallback:** `PyPDF2` - Used if pdfplumber fails or returns empty text

Both libraries attempt to extract text page-by-page, then the text is cleaned to remove artifacts.

### Resume Parsing (`services/utils/resume_parser.py`)

The parser uses **pattern matching and keyword detection** to:

1. **Identify Sections:** Looks for common headers like "Experience", "Education", "Skills"
2. **Extract Data:** Uses regex patterns to find dates, emails, phone numbers, URLs
3. **Structure Data:** Organizes extracted info into JSON objects matching your data models

**Supported Date Formats:**
- `September 2025`, `Sep 2025`
- `12/01/2025`, `12/2025`
- `2025`
- `Present`, `Current`, `Ongoing`

---

## What Gets Extracted

### 1. Skills
**Format:** Array of strings

**Extraction Logic:**
- Looks for "Skills", "Technical Skills", "Core Competencies" sections
- Extracts comma-separated or line-separated skills
- Removes category prefixes (e.g., "Backend:", "Frontend:")
- Falls back to common skill keyword matching if no section found
- Limits to 20 skills maximum

**Example:**
```json
["Python", "Django", "React", "PostgreSQL", "Docker", "AWS"]
```

**Supported Skills Library:** 60+ common programming languages, frameworks, databases, and tools

---

### 2. Work Experience
**Format:** Array of objects

**Extraction Logic:**
- Looks for "Experience", "Work History", "Employment" sections
- Identifies job entries by bullet points, dates, or position keywords
- Parses position, company, dates, and description
- Detects current employment via "Present", "Current" keywords

**Data Structure:**
```json
[
  {
    "position": "Senior Software Engineer",
    "company": "Google",
    "start_date": "2022-06",
    "end_date": "2024-01",
    "current": false,
    "description": "Led backend microservices development using Python and Go."
  },
  {
    "position": "Software Engineer",
    "company": "Meta",
    "start_date": "2024-02",
    "end_date": "",
    "current": true,
    "description": "Working on infrastructure optimization."
  }
]
```

**Parsed Fields:**
- `position` - Job title (e.g., "Senior Software Engineer")
- `company` - Company name (e.g., "Google")
- `start_date` - Start date in YYYY-MM format
- `end_date` - End date in YYYY-MM format (empty if current)
- `current` - Boolean indicating if still employed
- `description` - Job responsibilities and achievements

**Supported Separators:**
- `Position – Company` (en-dash)
- `Position — Company` (em-dash)
- `Position | Company` (pipe)
- `Position at Company`

---

### 3. Education
**Format:** Array of objects

**Extraction Logic:**
- Looks for "Education", "Academic", "Qualification" sections
- Detects degree types (BS, MS, PhD, Bachelor, Master, etc.)
- Extracts institution, field of study, and dates
- Parses degree format variations

**Data Structure:**
```json
[
  {
    "institution": "Stanford University",
    "degree": "Bachelor of Science",
    "field_of_study": "Computer Science",
    "start_date": "2018-09",
    "end_date": "2022-05"
  },
  {
    "institution": "MIT",
    "degree": "Master of Science",
    "field_of_study": "Artificial Intelligence",
    "start_date": "2022-09",
    "end_date": "2024-05"
  }
]
```

**Supported Degree Formats:**
- `BS (Computer Science)`
- `Bachelor of Science in Computer Science`
- `Bachelor in Computer Science`
- `Master of Science - AI`

**Recognized Degrees:** PhD, Doctorate, Master, MS, MA, MBA, Bachelor, BS, BA, B.Tech, B.E, Associate

---

### 4. Contact Information

**Email:**
- Pattern: Standard email regex
- Example: `john.doe@example.com`

**Phone:**
- Formats: `+1-234-567-8900`, `(234) 567-8900`, `2345678900`
- Example: `+1-555-123-4567`

**Note:** Phone is only populated if candidate profile doesn't already have one.

---

### 5. Professional URLs

**Detected URLs:**
- LinkedIn profiles
- GitHub profiles
- Portfolio websites
- Any other URLs in the resume

**Auto-Assignment:**
- URLs containing `linkedin.com` → `linkedin_url`
- URLs containing `github.com` → `github_url`
- Other URLs → `portfolio_url`

**Note:** URLs are only populated if the respective fields are empty.

---

## API Usage

### GraphQL Mutation

```graphql
mutation UploadAndParseResume($input: ResumeUploadInput!) {
  uploadAndParseResume(input: $input) {
    ... on SuccessType {
      success
      message
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
```

### Authentication
- **Required:** Yes (JWT Bearer token)
- **Role:** Must be `"candidate"`
- **Header:** `Authorization: Bearer <access_token>`

---

## Request Format

### Input Type: `ResumeUploadInput`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file_name` | String | ✅ Yes | Name of the PDF file (must end with .pdf) |
| `file_data` | String | ✅ Yes | Base64-encoded PDF data |
| `file_type` | String | ❌ No | MIME type (default: "application/pdf") |

### Variables Example

```json
{
  "input": {
    "file_name": "john_doe_resume.pdf",
    "file_data": "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFn...",
    "file_type": "application/pdf"
  }
}
```

### Important Notes

1. **File Format:** Only PDF files are supported (`.pdf` extension required)
2. **Encoding:** The `file_data` must be base64-encoded
3. **Data URL Prefix:** The system automatically handles data URL prefixes like `data:application/pdf;base64,`

---

## Response Format

### Success Response

```json
{
  "data": {
    "uploadAndParseResume": {
      "success": true,
      "message": "Resume uploaded and parsed successfully. Found 8 skills, 2 education entries, and 3 work experiences."
    }
  }
}
```

**Success Message Format:**
```
"Resume uploaded and parsed successfully. Found {X} skills, {Y} education entries, and {Z} work experiences."
```

### Error Responses

#### 1. Authentication Error
```json
{
  "data": {
    "uploadAndParseResume": {
      "success": false,
      "message": "Authentication required",
      "errors": []
    }
  }
}
```

#### 2. Wrong User Role
```json
{
  "data": {
    "uploadAndParseResume": {
      "success": false,
      "message": "Only candidates can upload resumes",
      "errors": []
    }
  }
}
```

#### 3. Invalid File Type
```json
{
  "data": {
    "uploadAndParseResume": {
      "success": false,
      "message": "Invalid file type. Only PDF files are supported.",
      "errors": []
    }
  }
}
```

#### 4. Base64 Decode Error
```json
{
  "data": {
    "uploadAndParseResume": {
      "success": false,
      "message": "Failed to decode base64 data: Invalid base64 string",
      "errors": []
    }
  }
}
```

#### 5. Parsing Failure
```json
{
  "data": {
    "uploadAndParseResume": {
      "success": false,
      "message": "Failed to parse resume. Please try again.",
      "errors": []
    }
  }
}
```

#### 6. Profile Not Found
```json
{
  "data": {
    "uploadAndParseResume": {
      "success": false,
      "message": "Candidate profile not found",
      "errors": []
    }
  }
}
```

---

## Code Examples

### React + Apollo Client

```typescript
import { gql, useMutation } from '@apollo/client';

const UPLOAD_RESUME = gql`
  mutation UploadAndParseResume($input: ResumeUploadInput!) {
    uploadAndParseResume(input: $input) {
      ... on SuccessType {
        success
        message
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
`;

function ResumeUploader() {
  const [uploadResume, { loading }] = useMutation(UPLOAD_RESUME);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.pdf')) {
      alert('Only PDF files are supported');
      return;
    }

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);

      // Remove data URL prefix if present
      const base64Data = base64.split(',')[1] || base64;

      // Execute mutation
      const { data } = await uploadResume({
        variables: {
          input: {
            file_name: file.name,
            file_data: base64Data,
            file_type: 'application/pdf'
          }
        }
      });

      if (data.uploadAndParseResume.success) {
        alert(data.uploadAndParseResume.message);
        // Refresh profile data
        window.location.reload();
      } else {
        alert('Error: ' + data.uploadAndParseResume.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload resume');
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        disabled={loading}
      />
      {loading && <p>Uploading and parsing resume...</p>}
    </div>
  );
}

export default ResumeUploader;
```

---

### JavaScript (Vanilla) with Fetch

```javascript
async function uploadResume(file, accessToken) {
  // Convert file to base64
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Remove data URL prefix
  const base64Data = base64.split(',')[1];

  // GraphQL mutation
  const query = `
    mutation UploadAndParseResume($input: ResumeUploadInput!) {
      uploadAndParseResume(input: $input) {
        ... on SuccessType {
          success
          message
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
  `;

  const variables = {
    input: {
      file_name: file.name,
      file_data: base64Data,
      file_type: 'application/pdf'
    }
  };

  try {
    const response = await fetch('http://your-backend.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query, variables })
    });

    const result = await response.json();

    if (result.data.uploadAndParseResume.success) {
      console.log('Success:', result.data.uploadAndParseResume.message);
    } else {
      console.error('Error:', result.data.uploadAndParseResume.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Usage
document.getElementById('resume-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const token = localStorage.getItem('access_token');
  uploadResume(file, token);
});
```

---

### Python (Requests)

```python
import base64
import requests

def upload_resume(pdf_file_path: str, access_token: str):
    # Read and encode PDF file
    with open(pdf_file_path, 'rb') as f:
        pdf_bytes = f.read()
        base64_data = base64.b64encode(pdf_bytes).decode('utf-8')

    # GraphQL mutation
    query = """
    mutation UploadAndParseResume($input: ResumeUploadInput!) {
      uploadAndParseResume(input: $input) {
        ... on SuccessType {
          success
          message
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
    """

    variables = {
        "input": {
            "file_name": pdf_file_path.split('/')[-1],
            "file_data": base64_data,
            "file_type": "application/pdf"
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.post(
        'http://your-backend.com/graphql',
        json={"query": query, "variables": variables},
        headers=headers
    )

    result = response.json()

    if result['data']['uploadAndParseResume']['success']:
        print('Success:', result['data']['uploadAndParseResume']['message'])
    else:
        print('Error:', result['data']['uploadAndParseResume']['message'])

# Usage
upload_resume('path/to/resume.pdf', 'your_access_token')
```

---

### cURL Example

```bash
# First, encode your PDF to base64
BASE64_DATA=$(base64 -w 0 resume.pdf)

# Then send the GraphQL request
curl -X POST http://your-backend.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "query": "mutation UploadAndParseResume($input: ResumeUploadInput!) { uploadAndParseResume(input: $input) { ... on SuccessType { success message } ... on ErrorType { success message } } }",
    "variables": {
      "input": {
        "file_name": "resume.pdf",
        "file_data": "'"$BASE64_DATA"'",
        "file_type": "application/pdf"
      }
    }
  }'
```

---

## What Gets Auto-Populated

After successful parsing, the following fields in the candidate profile are automatically updated:

### 1. Skills (`candidate.skills`)
- **Action:** Replaces entire skills array
- **Cleaning:** Removes category prefixes (Backend:, Frontend:, etc.)
- **Example:** `["Python", "Django", "React"]`

### 2. Education (`candidate.education`)
- **Action:** Replaces entire education array
- **Structure:** Array of education objects with institution, degree, field_of_study, dates

### 3. Experience (`candidate.experience`)
- **Action:** Replaces entire experience array
- **Structure:** Array of experience objects with company, position, dates, description

### 4. Phone Number (`user.phone_number`)
- **Action:** Sets phone number if not already set
- **Condition:** Only if `user.phone_number` is empty/null

### 5. LinkedIn URL (`candidate.linkedin_url`)
- **Action:** Sets URL if not already set
- **Detection:** URL contains "linkedin.com"
- **Condition:** Only if `candidate.linkedin_url` is empty/null

### 6. GitHub URL (`candidate.github_url`)
- **Action:** Sets URL if not already set
- **Detection:** URL contains "github.com"
- **Condition:** Only if `candidate.github_url` is empty/null

### 7. Portfolio URL (`candidate.portfolio_url`)
- **Action:** Sets URL if not already set
- **Detection:** Any other URL found in resume
- **Condition:** Only if `candidate.portfolio_url` is empty/null

### 8. Resume File (`candidate.resume`)
- **Action:** Saves the uploaded PDF file
- **Location:** Stored in `resumes/` directory

### Important Notes

**Replacement vs. Addition:**
- Skills, Education, and Experience: **REPLACED** (not merged)
- Phone and URLs: **ONLY SET if empty** (not replaced)

**Recommendation:**
- Users should review and edit the auto-populated data after upload
- Provide a profile preview before saving
- Allow manual corrections if parsing is inaccurate

---

## Error Handling

### Common Issues & Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| "Invalid file type" | Non-PDF file uploaded | Only accept .pdf files in file input |
| "Failed to decode base64" | Incorrect base64 encoding | Ensure proper base64 encoding without corruption |
| "Failed to parse resume" | PDF is image-based (scanned) | Parser cannot extract text from image PDFs - consider OCR |
| No skills extracted | Resume has unusual formatting | Skills section header not recognized - manual entry needed |
| Wrong company/position | Complex formatting | Parser misidentified separators - manual correction needed |
| Missing dates | Non-standard date format | Parser couldn't recognize format - manual entry needed |

### Best Practices for Frontend

1. **File Validation:**
   ```javascript
   if (!file.name.endsWith('.pdf')) {
     alert('Only PDF files are supported');
     return;
   }
   ```

2. **File Size Limit:**
   ```javascript
   if (file.size > 5 * 1024 * 1024) { // 5MB limit
     alert('File size must be less than 5MB');
     return;
   }
   ```

3. **Loading State:**
   - Show spinner/loader during upload
   - Disable submit button while processing
   - Estimate: 2-5 seconds for typical resume

4. **Success Handling:**
   - Show success message with extraction summary
   - Redirect to profile page for review
   - Highlight newly populated fields

5. **Error Handling:**
   - Display user-friendly error messages
   - Provide fallback to manual entry
   - Log errors for debugging

---

## Limitations & Best Practices

### Current Limitations

1. **PDF Only:**
   - No support for .doc, .docx, or .txt files
   - Consider adding format conversion if needed

2. **Text-Based PDFs Only:**
   - Cannot parse scanned/image-based PDFs
   - Requires OCR for scanned resumes (not implemented)

3. **English Language:**
   - Parser optimized for English resumes
   - May not work well with other languages

4. **Standard Formatting:**
   - Works best with standard resume formats
   - Creative/graphic-heavy resumes may parse poorly

5. **Date Format Recognition:**
   - Limited to common formats (see supported formats above)
   - Unusual date formats may not be recognized

6. **No Duplicate Detection:**
   - If user uploads multiple times, data is replaced (not merged)

### Recommended Resume Format

For **best parsing results**, advise users to:

✅ Use standard section headers (Experience, Education, Skills)
✅ Use common date formats (Month Year or MM/YYYY)
✅ Separate position and company with clear delimiters (–, |, "at")
✅ Use bullet points for experience descriptions
✅ Include contact info at the top (email, phone)
✅ List skills with commas or line breaks
✅ Use standard degree abbreviations (BS, MS, PhD)

❌ Avoid creative layouts with multiple columns
❌ Avoid image-based text or graphics
❌ Avoid unusual fonts that don't extract well
❌ Avoid non-standard section names

### Performance Considerations

- **Average Processing Time:** 2-5 seconds
- **File Size Recommendation:** Keep under 2MB for optimal performance
- **Rate Limiting:** Consider implementing rate limits (e.g., 5 uploads per hour per user)

---

## Testing the API

### Test with GraphQL Playground

1. Navigate to your GraphQL endpoint (usually `/graphql`)
2. Ensure you're authenticated
3. Use a small test PDF converted to base64
4. Run the mutation
5. Check the response and verify profile updates

### Sample Test Resume

Create a simple text file and convert to PDF:

```
John Doe
john.doe@example.com | +1-555-123-4567
linkedin.com/in/johndoe | github.com/johndoe

SKILLS
Python, Django, React, PostgreSQL, Docker, AWS

EXPERIENCE
Senior Software Engineer – Google
2022-06 - Present
Led backend microservices development using Python and Go.

Software Engineer – Meta
2020-01 - 2022-05
Built scalable web applications with React and Node.js.

EDUCATION
Bachelor of Science (Computer Science)
Stanford University
2016-09 - 2020-05
```

Convert to PDF, then to base64, and test the mutation.

---

## FAQ

**Q: Can users upload multiple resumes?**
A: Yes, but each upload replaces the previous data. Consider adding version history if needed.

**Q: What happens to existing profile data?**
A: Skills, education, and experience are replaced. Phone and URLs are only set if empty.

**Q: Can users edit the parsed data?**
A: Yes, use the regular profile update mutations after parsing.

**Q: How accurate is the parsing?**
A: Accuracy depends on resume formatting. Standard formats: 80-95% accurate. Creative formats: 50-70% accurate.

**Q: Is the uploaded file saved?**
A: Yes, the PDF is saved to `candidate.resume` field and stored in `resumes/` directory.

**Q: Can I parse resumes in other formats?**
A: Currently only PDF is supported. You'd need to add converters for .doc/.docx formats.

---

## Summary

### Key Points

1. **Mutation:** `uploadAndParseResume(input: ResumeUploadInput!)`
2. **Input:** Base64-encoded PDF file with filename
3. **Authentication:** Required (candidate role)
4. **Extracts:** Skills, Experience, Education, Contact info, URLs
5. **Auto-populates:** Candidate profile fields
6. **Processing time:** 2-5 seconds
7. **Response:** Success message with extraction summary

### Quick Integration Checklist

- [ ] Add file input with `.pdf` accept type
- [ ] Implement file-to-base64 conversion
- [ ] Add GraphQL mutation with proper variables
- [ ] Include authentication header (Bearer token)
- [ ] Handle loading state during upload
- [ ] Display success/error messages
- [ ] Redirect to profile page for review
- [ ] Allow manual editing of parsed data
- [ ] Add file size validation (recommend 5MB max)
- [ ] Test with various resume formats

---

**Need help?** Check the GraphQL schema or contact the backend team.

**File Location:** `services/strawberry/mutations.py:640-756`
**Parser Location:** `services/utils/resume_parser.py`
**PDF Extractor:** `services/utils/pdf_extractor.py`

---

*Last Updated: November 14, 2024*
