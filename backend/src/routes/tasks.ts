import express from 'express';
import { 
  getTasks, 
  getTaskById, 
  createTask, 
  updateTask, 
  deleteTask,
  getTaskComments,
  createTaskComment
} from '../controllers/taskController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Task comments routes
router.get('/:taskId/comments', getTaskComments);
router.post('/:taskId/comments', createTaskComment);

export default router;
