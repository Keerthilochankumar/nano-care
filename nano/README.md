# ICU Decision Support System

An AI-powered clinical decision-support system designed specifically for ICU environments. This application integrates patient data, real-time vitals, and clinical documentation to enhance patient care through intelligent AI assistance.

## Features

- **Real-Time Monitoring**: Continuous integration with ICU monitors for live vital signs, alarms, and trending data
- **Clinical Intelligence**: AI-powered analysis of patient data, lab results, imaging, and clinical notes
- **Safety First**: Built with clinical safety protocols, red flag detection, and compliance with healthcare standards
- **Patient-Centered Care**: Individual patient profiles with complete medical history and care team information
- **Secure Authentication**: Clerk-based authentication for healthcare professionals
- **Database Integration**: Supabase for secure patient data storage and management

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **AI/LLM**: Groq with Llama 3.3 70B
- **Real-time Features**: AI SDK for streaming responses

## Quick Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
# Groq API Key (required for LLM)
GROQ_API_KEY=your_groq_api_key_here

# Pinecone Configuration (required for RAG)
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=your_index_name_here
PINECONE_HOST=your_pinecone_host_url_here

# Embedding API Keys (optional - for better embeddings)
OPENAI_API_KEY=your_openai_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql` in your Supabase SQL editor
3. This will create all necessary tables with sample data

### 3. Authentication Setup

1. Create a Clerk account and application
2. Configure your Clerk settings:
   - Add your domain to allowed origins
   - Set up sign-in/sign-up pages
   - Configure redirect URLs

### 4. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The application uses the following main tables:

- **patients**: Core patient information, demographics, and medical history
- **patient_documents**: Clinical documents (lab reports, imaging, notes)
- **vital_signs**: Real-time vital sign data from ICU monitors
- **icu_sessions**: User sessions for tracking clinical interactions

## Clinical Decision Support Features

### AI Assistant Capabilities

The AI assistant is specifically designed for ICU environments and provides:

- **Clinical Snapshot**: Current patient status summary
- **Key Considerations**: Important clinical insights and red flags
- **Potential Causes/Differentials**: Evidence-based diagnostic suggestions
- **Suggested Next Assessments**: Recommendations for additional monitoring or tests
- **Safety Reminders**: Compliance with clinical protocols

### Safety Features

- Patient data isolation (one patient per session)
- Red flag detection for critical conditions
- No specific dosing recommendations (safety protocol)
- Emphasis on bedside assessment and local protocols
- HIPAA-compliant data handling

## Usage

1. **Sign In**: Healthcare professionals sign in using Clerk authentication
2. **Dashboard**: View all ICU patients with current status and vital signs
3. **Patient Selection**: Click on a patient to open their clinical chat interface
4. **AI Consultation**: Ask questions about patient status, interpret findings, or discuss treatment options
5. **Real-time Data**: The AI has access to live vitals, recent documents, and patient history

## API Endpoints

- `/api/icu-chat`: Main chat endpoint for clinical decision support
- Authentication handled by Clerk middleware
- Database operations through Supabase client

## Contributing

This is a clinical application designed for healthcare professionals. All contributions should maintain:

- Clinical safety standards
- HIPAA compliance
- Evidence-based medical practices
- Proper authentication and authorization

## License

This project is designed for healthcare environments and should be used only by licensed healthcare professionals in compliance with local regulations and protocols.

## Disclaimer

This is decision-support information for trained clinicians and does not replace bedside assessment, multidisciplinary discussion, or local protocols. Always follow your institution's clinical guidelines and protocols.
