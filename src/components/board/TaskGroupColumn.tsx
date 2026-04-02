import { useState } from 'react';
import type { TaskGroup } from '../../types';
import { TaskCard } from '../task/TaskCard';
import styles from './TaskGroupColumn.module.css';

interface Props {
  group: TaskGroup;
  boardId: number;
  onUpdateGroup: (groupId: number, data: { title?: string }) => Promise<void>;
  onDeleteGroup: (groupId: number) => Promise<void>;
  onCreateTask: (groupId: number, data: { title: string; description?: string }) => Promise<void>;
  onUpdateTask: (taskId: number, data: { title?: string; description?: string }) => Promise<void>;
  onDeleteTask: (groupId: number, taskId: number) => Promise<void>;
}

export function TaskGroupColumn({
  group,
  onUpdateGroup,
  onDeleteGroup,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: Props) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [groupTitle, setGroupTitle] = useState(group.title);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  const sortedTasks = [...group.tasks].sort((a, b) => a.position - b.position);

  async function handleTitleSave() {
    if (!groupTitle.trim()) {
      setGroupTitle(group.title);
      setIsEditingTitle(false);
      return;
    }
    await onUpdateGroup(group.id, { title: groupTitle.trim() });
    setIsEditingTitle(false);
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await onCreateTask(group.id, {
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || undefined,
    });
    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsAddingTask(false);
  }

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        {isEditingTitle ? (
          <input
            className={styles.titleInput}
            value={groupTitle}
            onChange={e => setGroupTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={e => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') {
                setGroupTitle(group.title);
                setIsEditingTitle(false);
              }
            }}
            autoFocus
          />
        ) : (
          <button
            className={styles.titleBtn}
            onClick={() => setIsEditingTitle(true)}
          >
            <span className={styles.title}>{group.title}</span>
            <span className={styles.count}>{group.tasks.length}</span>
          </button>
        )}
        <button
          className={styles.deleteGroupBtn}
          onClick={async () => {
            if (confirm(`Delete column "${group.title}" and all its tasks?`)) {
              await onDeleteGroup(group.id);
            }
          }}
          title="Delete column"
        >
          ×
        </button>
      </div>

      <div className={styles.tasks} role="list">
        {sortedTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onUpdate={onUpdateTask}
            onDelete={(taskId) => onDeleteTask(group.id, taskId)}
          />
        ))}
      </div>

      {isAddingTask ? (
        <form className={styles.addTaskForm} onSubmit={handleAddTask}>
          <input
            className={styles.addTaskInput}
            type="text"
            placeholder="Task title"
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className={styles.addTaskDesc}
            placeholder="Description (optional)"
            value={newTaskDesc}
            onChange={e => setNewTaskDesc(e.target.value)}
            rows={2}
          />
          <div className={styles.addTaskActions}>
            <button className={styles.confirmBtn} type="submit">Add task</button>
            <button
              className={styles.cancelBtn}
              type="button"
              onClick={() => {
                setIsAddingTask(false);
                setNewTaskTitle('');
                setNewTaskDesc('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          className={styles.addTaskBtn}
          onClick={() => setIsAddingTask(true)}
        >
          + Add task
        </button>
      )}
    </div>
  );
}
