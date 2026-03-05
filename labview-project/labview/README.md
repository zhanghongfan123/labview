# LabVIEW Assistant Frontend

This is the frontend for the LabVIEW Assistant, built with React, Vite, and Tailwind CSS.

## Features

- **Multi-Agent Support**: Switch between 4 specialized agents (Panel Reading, Requirement Confirmation, Panel Building, Test Plan) + Help.
- **Chat Interface**: Markdown rendering, file upload support (mocked for now).
- **Modern UI**: Clean interface using Tailwind CSS.

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run development server**:
    ```bash
    npm run dev
    ```

## Project Structure

- `src/components`: UI components (Sidebar, ChatInterface).
- `src/types.ts`: TypeScript definitions.
- `src/App.tsx`: Main layout.

## API Integration

The API calls are currently mocked in `src/components/ChatInterface.tsx`. To integrate with Dify:
1.  Uncomment the API call section in `handleSubmit`.
2.  Add your Dify API keys and endpoints.
