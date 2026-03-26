import Project from '../models/project.model.js';
import AppError from '../config/AppError.js';

const populate = (query) =>
  query.populate('owner', 'name email').populate('members.user', 'name email');

const getUserProjects = (userId) =>
  populate(Project.find({ $or: [{ owner: userId }, { 'members.user': userId }], isArchived: false }));

const getProjectById = async (projectId) => {
  const project = await populate(Project.findById(projectId));
  if (!project) throw new AppError('Project not found', 404);
  return project;
};

const createProject = async ({ name, description, ownerId }) => {
  const project = await Project.create({
    name, description, owner: ownerId,
    lists: [
      { title: 'To Do', order: 0 },
      { title: 'In Progress', order: 1 },
      { title: 'Done', order: 2 },
    ],
  });
  await project.populate('owner', 'name email');
  return project;
};

const updateProject = (projectId, { name, description }) =>
  populate(Project.findByIdAndUpdate(projectId, { name, description }, { new: true }));

const addMember = async (projectId, { userId, role }) => {
  const project = await Project.findById(projectId);
  if (project.members.find((m) => m.user.toString() === userId))
    throw new AppError('User is already a member of this project', 400);

  project.members.push({ user: userId, role: role || 'contributor' });
  await project.save();
  await project.populate('members.user', 'name email');
  return project;
};

const addList = async (projectId, { title }) => {
  const project = await Project.findById(projectId);
  project.lists.push({ title, order: project.lists.length });
  await project.save();
  return project;
};

const archiveProject = (projectId) =>
  Project.findByIdAndUpdate(projectId, { isArchived: true });

export { getUserProjects, getProjectById, createProject, updateProject, addMember, addList, archiveProject };
