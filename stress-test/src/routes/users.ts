import { Router } from 'express';

const userRouter = Router();

// Create User
userRouter.post('/', (req, res) => {
  const user = req.body;
  // Add logic to save user to database
  res.status(201).send({ message: 'User created', user });
});

// Read User
userRouter.get('/:id', (req, res) => {
  const userId = req.params.id;
  // Add logic to retrieve user from database
  res.send({ message: 'User retrieved', userId });
});

// Update User
userRouter.put('/:id', (req, res) => {
  const userId = req.params.id;
  const user = req.body;
  // Add logic to update user in database
  res.send({ message: 'User updated', userId, user });
});

// Delete User
userRouter.delete('/:id', (req, res) => {
  const userId = req.params.id;
  // Add logic to delete user from database
  res.send({ message: 'User deleted', userId });
});

export { userRouter };