import express from 'express';
import {
  getTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember,
  getTeams, createTeam, updateTeam, deleteTeam
} from '../controllers/teamController';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'MANAGER']));

router.get('/', getTeamMembers);
router.post('/', addTeamMember);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);

router.get('/groups', getTeams);
router.post('/groups', createTeam);
router.put('/groups/:id', updateTeam);
router.delete('/groups/:id', deleteTeam);

export default router;
