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

The API calls are integrated with Dify in `src/components/ChatInterface.tsx`.

## Deployment Instructions / 部署说明

| 项目 | 版本 |
| :--- | :--- |
| Node.js | v18.20.7 |
| npm | 10.8.2 |
| Vite | ^5.4.19 |
| React | ^19.2.0 |
| Tailwind CSS | ^3.4.19 |
| TypeScript | ~5.9.3 |
| @vitejs/plugin-react | ^4.7.0 |

### 部署步骤

1.  **解压**
    ```bash
    tar xzf labview-project.tar.gz && cd labview
    ```

2.  **复制并编辑环境变量**
    ```bash
    cp .env.example .env
    # 填入实际的 Dify API 地址和各 Agent 的 API Key
    ```

3.  **安装依赖**
    ```bash
    npm install
    ```

4.  **构建**
    ```bash
    npm run build
    ```

5.  **启动服务（端口 3001）**
    ```bash
    node server.js
    ```
