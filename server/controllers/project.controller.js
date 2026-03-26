import * as projectService from '../services/project.service.js';
import catchAsync from '../middleware/catchAsync.js';

const getAllProjects = catchAsync(async (req, res) => {
  const projects = await projectService.getUserProjects(req.user._id);
  res.json(projects);
});

const getProject = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.params.projectId);
  res.json(project);
});

const createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject({ ...req.body, ownerId: req.user._id });
  res.status(201).json(project);
});

const updateProject = catchAsync(async (req, res) => {
  const project = await projectService.updateProject(req.params.projectId, req.body);
  res.json(project);
});

const addMember = catchAsync(async (req, res) => {
  const project = await projectService.addMember(req.params.projectId, req.body);
  res.json(project);
});

const addList = catchAsync(async (req, res) => {
  const project = await projectService.addList(req.params.projectId, req.body);
  res.json(project);
});

const archiveProject = catchAsync(async (req, res) => {
  await projectService.archiveProject(req.params.projectId);
  res.json({ message: 'Project archived' });
});

export { getAllProjects, getProject, createProject, updateProject, addMember, addList, archiveProject };
