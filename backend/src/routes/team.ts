import express from 'express';
import {
  getTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember,
  getTeams, createTeam, updateTeam, deleteTeam
} from '../controllers/teamController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);

router.get('/', getTeamMembers);
router.post('/', addTeamMember);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);

router.get('/groups', getTeams);
router.post('/groups', createTeam);
router.put('/groups/:id', updateTeam);
router.delete('/groups/:id', deleteTeam);

export default router;
