import express from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/calendarController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();
router.use(requireAuth);

router.get('/', getEvents);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
