import express from 'express';
import { json } from 'body-parser';
import { userRouter } from './routes/users';
import { errorHandler } from './middlewares/error-handler';

const app = express();
app.use(json());

app.use('/users', userRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});