import express from 'express';

const app = express();
const port = 3000;

app.use(express.json());

let users: Array<{ id: number; name: string }> = [];

app.get('/users', (req, res) => {
  res.json(users);
});

app.post('/users', (req, res) => {
  const user = req.body;
  users.push(user);
  res.status(201).json(user);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
