# Express REST API

This is a simple Express REST API built with TypeScript.

## Features

- CRUD operations for users
- Simple error handling
- Bootstrap code for an Express server

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. To run the development server:

   ```bash
   npm start
   ```

3. To build the project:

   ```bash
   npm run build
   ```

## Structure

- **index.ts**: Entry point for the application
- **routes/**: Contains route handlers
- **middlewares/**: Contains middleware for error handling

## Routes

- `POST /users/`: Create a new user
- `GET /users/:id`: Read an existing user
- `PUT /users/:id`: Update an existing user
- `DELETE /users/:id`: Delete a user

## Middleware

- **Error Handler**: Logs errors and sends a generic error response
