import * as taskService from '../services/task.service.js';
import catchAsync from '../middleware/catchAsync.js';

const getProjectTasks = catchAsync(async (req, res) => {
  const tasks = await taskService.getTasksByProject(req.params.projectId);
  res.json(tasks);
});

const createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTask({ ...req.body, userId: req.user._id });
  res.status(201).json(task);
});

const updateTask = catchAsync(async (req, res) => {
  const task = await taskService.updateTask(req.params.taskId, req.body, req.user._id);
  res.json(task);
});

const addComment = catchAsync(async (req, res) => {
  const task = await taskService.addComment(req.params.taskId, {
    text: req.body.text,
    userId: req.user._id,
  });
  res.json(task);
});

const deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTask(req.params.taskId);
  res.json({ message: 'Task deleted' });
});

export { getProjectTasks, createTask, updateTask, addComment, deleteTask };
