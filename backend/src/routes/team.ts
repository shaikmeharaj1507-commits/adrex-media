import express from 'express';
import { getTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember } from '../controllers/teamController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);

router.get('/', getTeamMembers);
router.post('/', addTeamMember);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);

export default router;
