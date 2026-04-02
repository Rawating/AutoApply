# AutoApply — Job Application Form Filler

AutoApply is a Chrome extension that eliminates the repetitive work of filling out job applications. Enter your information once in the profile editor, then let AutoApply detect and fill form fields automatically across any job site.

---

## How It Works

Navigate to any job application page, click the AutoApply icon in your Chrome toolbar, and select **Fill This Page**. The extension scans the form, identifies fields by their labels, HTML attributes, and platform-specific patterns, and populates them with your saved profile data. It handles text inputs, dropdowns, and custom select widgets, and works inside embedded iframes such as those used by Greenhouse and other major hiring platforms.

---

## Supported Platforms

AutoApply is tested and optimized for the following applicant tracking systems, and works on most custom job application forms as well.

| Platform | Detection Method |
|---|---|
| Greenhouse | iframe support, autocomplete attributes, field IDs |
| Workday | legal name fields, address line patterns |
| iCIMS | PersonProfileFields dot-notation IDs |
| Lever | name, org, and urls[] field patterns |
| Taleo | firstName, lastName, eMailAddress patterns |
| BambooHR | standard name and contact patterns |
| SmartRecruiters | candidate field patterns |

---

## Profile Fields

The extension profile covers the full range of information required by modern job applications.

**Personal Information** — prefix, first, middle, and last name, suffix, preferred name, email, phone, phone type, pronouns, and date of birth.

**Address** — street address, apartment or suite, city, state, ZIP code, and country.

**Work History** — job title, company, employment dates, location, employment type, and description of responsibilities. Multiple positions are supported.

**Education** — school, degree, field of study, start year, graduation year, GPA, and location. Multiple entries are supported. Includes a separate dropdown for highest level of education achieved.

**Skills** — technical skills, soft skills, and languages, each stored as a tag list.

**Links** — LinkedIn, GitHub, portfolio or personal website, and one additional URL.

**Job Preferences** — base salary expectation, work authorization status, visa sponsorship requirement, remote preference, employment type, available start date, non-compete agreement status, and a default answer for former employee questions.

**EEO / Demographics** — gender, race and ethnicity, veteran status, and disability status. All fields are voluntary.

**Cover Letter** — a single cover letter or professional summary automatically matched to open-text fields asking you to describe yourself or explain your interest in the role.

**Custom Fields** — any additional key-value pairs you define, matched against form labels on the page.

---

## Privacy and Security

AutoApply was designed with data privacy as a foundational requirement.

All profile data is stored exclusively on your local device using Chrome's built-in `chrome.storage` API. There are no external servers, no databases, no accounts, and no telemetry. The Content Security Policy in the manifest enforces `connect-src 'none'`, blocking all outbound network requests at the browser level.

The extension requests only three permissions: `storage` to save your profile locally, `activeTab` to access the job application page you are currently viewing, and `scripting` to execute the form-filling logic when you click Fill This Page. None of these permissions are active in the background or on pages you have not chosen to fill.

All user input is sanitized before being written to the DOM. URL fields are validated to accept only `http` and `https` schemes. Input length is capped at the application layer.

For the full privacy policy, see [PRIVACY.md](./PRIVACY.md).

---

## Installation

### From the Chrome Web Store
*(Link will be added upon publication.)*

### Manual Installation (Developer Mode)
1. Download and unzip this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer Mode** using the toggle in the top-right corner.
4. Click **Load unpacked** and select the unzipped folder.

---

## Usage

After installation, click the AutoApply icon in your Chrome toolbar and select **Edit Profile** to open the profile editor. Fill in your information across each section and click **Save Profile**. Your data is saved immediately to local storage.

When you are ready to apply for a job, navigate to the application page, open the AutoApply popup, and click **Fill This Page**. The extension will populate all matching fields. Fields that already contain a value will not be overwritten. Resume upload fields cannot be filled automatically due to browser security restrictions, but AutoApply will highlight them so you can locate them quickly.

---

## License

This project is released under the [MIT License](./LICENSE).

---

## Contact

For questions, bug reports, or feature requests, please open an issue in this repository.
