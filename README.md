# TaskNest - Task Manager

A professional task management application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring user authentication, task management, and a clean UI.

## Features

- User authentication (Login/Signup)
- Full CRUD operations on tasks
- Task completion toggle
- Due date and priority settings (Low/Medium/High)
- Filter by All/Completed/Pending
- Responsive UI with clean design
- JWT-based secure authentication

## Tech Stack

- **Frontend**: React (with Vite) + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based secure login/signup
- **HTTP Client**: Axios for API communication

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Start the server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Authentication Flow

1. **Registration**: Users can create an account with name, email, and password
2. **Login**: Users can sign in with their email and password
3. **Dashboard**: After successful authentication, users are redirected to the dashboard
4. **Protected Routes**: Dashboard is protected and requires authentication

## API Endpoints

- `POST /api/users` - Register a new user
- `POST /api/users/login` - Login a user
- `GET /` - Health check endpoint

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Input validation is implemented on both frontend and backend
- Protected routes require valid JWT tokens