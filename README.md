# PII Detector Chat Application

A web application built with Next.js that enables detection and analysis of Personally Identifiable Information (PII) in files using artificial intelligence. The application combines file analysis with an intelligent chat interface to provide insights about sensitive information found.

## Features

- **PII Detection**: Automatically identifies emails, phone numbers, SSNs, credit cards, names, and addresses
- **File Analysis**: Supports PDF files, images (JPG, PNG), and text documents
- **Intelligent Chat**: Conversational interface to ask questions about performed analyses
- **AI Processing**: Uses Google Gemini AI for advanced document analysis
- **Modern Interface**: Responsive UI built with Tailwind CSS and custom components

## Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **AI**: Google Gemini AI, Tesseract.js (OCR)
- **Processing**: PDF-parse, Zod (validation)
- **Icons**: Lucide React

## Prerequisites

- Node.js 18 or higher
- npm, yarn, pnpm, or bun
- Google Gemini AI API Key

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd take-home-assigment
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
GOOGLE_API_KEY=your_google_gemini_api_key
```

To get your Google Gemini API key:
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy and paste the key into your `.env.local` file

### 4. Run in Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

```bash
# Development with Turbopack
npm run dev

# Build for production
npm run build

# Run in production
npm run start

# Linting
npm run lint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── chat/          # Chat endpoint
│   │   └── upload/        # File upload endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Main layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── shared/           # Shared components
│   └── ui/               # UI components
├── constants/            # Project constants
├── hooks/                # Custom hooks
├── interfaces/           # TypeScript type definitions
├── lib/                  # Utilities and configurations
├── services/             # Business services
├── types/                # TypeScript types
└── utils/                # Utility functions
```

## Application Usage

### 1. Upload Files

- Click "Select Files" or drag files to the upload area
- Supported types: PDF, JPG, PNG, TXT
- Maximum size: 10MB per file

### 2. Automatic Analysis

Once uploaded, files are automatically analyzed to detect:
- Email addresses
- Phone numbers
- Social Security Numbers (SSN)
- Credit card numbers
- Full names
- Physical addresses

### 3. Review Results

- Results are displayed in cards organized by file
- Each PII type is identified with colored badges
- Context where the information was found is included

### 4. Intelligent Chat

- Ask questions about the performed analyses
- The chat has access to results and can provide insights
- Example questions:
  - "How many emails were found?"
  - "Which files contain the most sensitive information?"
  - "Are there any patterns in the found data?"

## Architecture

### Main Components

- **Chat**: Main component that handles chat interface and analysis
- **FileProcessor**: Service for processing different file types
- **GeminiService**: Google Gemini AI integration
- **AnalysisService**: Analysis logic and result summarization

### Data Flow

1. User uploads files
2. FileProcessor extracts content based on type
3. GeminiService analyzes content to detect PII
4. AnalysisService processes and summarizes results
5. Chat displays results and allows interaction

## Detected PII Types

- **Email**: Valid email addresses
- **Phone**: Numbers in various formats (US/International)
- **SSN**: US Social Security Numbers
- **Credit Card**: 16-digit numbers
- **Names**: First and last name combinations
- **Addresses**: Physical addresses with street numbers

## Security Considerations

- Files are processed temporarily in memory
- No files are stored on the server
- PII information is processed locally when possible
- Recommended for use in secure environments for sensitive data

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in the dashboard
3. Deploy automatically

### Other Platforms

The application is compatible with any platform that supports Next.js:
- Netlify
- Railway
- Heroku
- AWS Amplify

## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## Known Issues

- Some PII patterns may generate false positives
- Name detection may include common words

## Support

If you encounter any problems or have questions:
1. Review existing issues
2. Create a new issue with problem details
3. Include information about your development environment

## License

This project is under the MIT License. See the `LICENSE` file for more details.
