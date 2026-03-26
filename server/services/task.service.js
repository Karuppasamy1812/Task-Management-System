import Task from '../models/task.model.js';
import AppError from '../config/AppError.js';
import logger from '../config/logger.js';

const populate = (query) =>
  query
    .populate('assignees', 'name email')
    .populate('comments.user', 'name email')
    .populate('history.user', 'name email');

const getTasksByProject = (projectId) =>
  populate(Task.find({ project: projectId })).sort({ order: 1 });

const createTask = async ({ title, description, project, listId, assignees, priority, dueDate, labels, userId }) => {
  const count = await Task.countDocuments({ project, listId });
  const task = await Task.create({
    title, description, project, listId,
    assignees, priority, dueDate, labels,
    order: count,
    history: [{ user: userId, action: 'created task' }],
  });
  logger.info('Tasks', `Task created: "${task.title}" in project ${project}`);
  return populate(Task.findById(task._id));
};

const updateTask = async (taskId, updates, userId) => {
  const task = await Task.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);

  const { title, description, status, priority, assignees, dueDate, listId, order, labels } = updates;
  const historyEntries = [];

  if (status && status !== task.status)
    historyEntries.push({ user: userId, action: 'changed status', from: task.status, to: status });
  if (listId && listId !== task.listId.toString())
    historyEntries.push({ user: userId, action: 'moved task', from: task.listId, to: listId });
  if (assignees)
    historyEntries.push({ user: userId, action: 'updated assignees' });

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (assignees !== undefined) task.assignees = assignees;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (labels !== undefined) task.labels = labels;
  if (listId) task.listId = listId;
  if (order !== undefined) task.order = order;
  task.history.push(...historyEntries);

  await task.save();
  return populate(Task.findById(task._id));
};

const addComment = async (taskId, { text, userId }) => {
  const task = await Task.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);

  task.comments.push({ user: userId, text });
  task.history.push({ user: userId, action: 'added comment' });
  await task.save();
  return populate(Task.findById(task._id));
};

const deleteTask = async (taskId) => {
  const task = await Task.findByIdAndDelete(taskId);
  if (task) logger.info('Tasks', `Task deleted: "${task.title}"`);
};

export { getTasksByProject, createTask, updateTask, addComment, deleteTask };
