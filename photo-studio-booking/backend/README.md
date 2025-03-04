# Photo Studio Booking Application

This project is a photo studio booking application that consists of a React.js frontend and a Node.js backend. The application allows users to register, log in, and book photo studio sessions.

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

## Backend

The backend is built using Node.js and Express. It provides API endpoints for user authentication and booking functionalities.

### Setup Instructions

1. Navigate to the `backend` directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```

### API Endpoints

- **POST /api/auth/register**: Register a new user.
- **POST /api/auth/login**: Log in an existing user.
- **GET /api/bookings**: Retrieve all bookings (requires authentication).

## Frontend

The frontend is built using React.js. It provides a user interface for users to register, log in, and manage bookings.

### Setup Instructions

1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the React application:
   ```
   npm start
   ```

## Contributing

Feel free to fork the repository and submit pull requests for any improvements or bug fixes.