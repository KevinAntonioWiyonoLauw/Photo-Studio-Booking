# Photo Studio Booking Application

This project is a photo studio booking application that consists of a React.js frontend and a Node.js backend. It allows users to register, log in, and manage their bookings.

## Project Structure

```
photo-studio-booking
├── backend
│   ├── src
│   │   ├── controllers
│   │   │   └── authController.js
│   │   ├── models
│   │   │   └── user.js
│   │   ├── routes
│   │   │   ├── api.js
│   │   │   └── auth.js
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
├── frontend
│   ├── public
│   │   └── index.html
│   ├── src
│   │   ├── components
│   │   │   ├── Booking.js
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── routes.js
│   ├── package.json
│   └── README.md
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node package manager)
- Docker (for containerization)

### Backend Setup

1. Navigate to the `backend` directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the backend server:
   ```
   npm start
   ```

4. The backend will run on `http://localhost:3000`.

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend application:
   ```
   npm start
   ```

4. The frontend will run on `http://localhost:3001`.

## API Endpoints

- **POST /api/auth/register**: Register a new user.
- **POST /api/auth/login**: Log in an existing user.
- **GET /api/bookings**: Retrieve all bookings (requires authentication).

## Docker

To build and run the backend using Docker, navigate to the `backend` directory and run:
```
docker build -t photo-studio-backend .
docker run -p 3000:3000 photo-studio-backend
```

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.

## License

This project is licensed under the MIT License.