# AutoApply – Chrome Extension

Auto-fill job application forms with your saved profile. Fill your info once, use it everywhere.

## Installation

1. **Open Chrome** and go to `chrome://extensions`
2. **Enable Developer Mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the `job-filler-extension` folder you downloaded
5. The AutoApply icon will appear in your Chrome toolbar

## Setup

1. Click the AutoApply icon in the toolbar
2. Click **"Edit Profile"** (or right-click the icon → Options)
3. Fill in all your info across the sections:
   - Personal Info (name, email, phone)
   - Address
   - Work History
   - Education
   - Skills
   - Links & Social
   - Job Preferences (salary, work auth, remote preference, etc.)
   - Custom Fields (for anything else)
4. Click **"Save Profile"**

## Using It

1. Navigate to a job application form (Greenhouse, Lever, Workday, etc.)
2. Click the AutoApply icon
3. Click **"Fill This Page"**
4. Fields matching your profile will be filled automatically

## What Gets Filled

- First/last name, email, phone
- Full address (street, city, state, zip, country)
- Current job title and employer
- Education (degree, school, graduation year)
- LinkedIn, GitHub, portfolio URLs
- Salary expectations
- Work authorization / visa status
- Remote work preference
- EEO fields (gender, veteran, disability status)
- Cover letter / summary text
- Any custom fields you define

## Tips

- Fields already filled will NOT be overwritten
- Works on React-based forms (Greenhouse, Lever, Workday, etc.)
- Add custom fields for anything the extension doesn't cover by default
- The extension only runs when you click "Fill" — it never fills automatically without your action

## Supported Job Boards

Tested on: Greenhouse, Lever, Workday, BambooHR, Taleo, iCIMS, JazzHR, and most plain HTML forms.
