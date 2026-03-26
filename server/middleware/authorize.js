import Project from '../models/project.model.js';
import AppError from '../config/AppError.js';

const getProjectRole = async (userId, projectId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  if (project.owner.toString() === userId.toString()) return 'admin';
  const member = project.members.find((m) => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

const authorize = (...allowedRoles) => async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.project;
    if (!projectId) return next(new AppError('Project ID is required', 400));

    const role = await getProjectRole(req.user._id, projectId);
    if (!role) return next(new AppError('You are not a member of this project', 403));
    if (!allowedRoles.includes(role)) return next(new AppError('You do not have permission to do this', 403));

    req.projectRole = role;
    next();
  } catch (err) {
    next(err);
  }
};

export { authorize, getProjectRole };
