import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { TaskGroup } from '../../types';
import { TaskCard } from '../task/TaskCard';
import styles from './TaskGroupColumn.module.css';

interface Props {
  group: TaskGroup;
  boardId: number;
  onUpdateGroup: (groupId: number, data: { taskGroupName?: string }) => Promise<void>;
  onDeleteGroup: (groupId: number) => Promise<void>;
  onCreateTask: (groupId: number, data: { taskName: string; taskGroupId: number }) => Promise<void>;
  onUpdateTask: (taskId: number, data: { taskName?: string }) => Promise<void>;
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
  const [groupName, setGroupName] = useState(group.taskGroupName);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');

  // dnd-kit sortable hook — gives us ref, style, and listener props
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function handleTitleSave() {
    if (!groupName.trim()) {
      setGroupName(group.taskGroupName);
      setIsEditingTitle(false);
      return;
    }
    await onUpdateGroup(group.id, { taskGroupName: groupName.trim() });
    setIsEditingTitle(false);
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    await onCreateTask(group.id, {
      taskName: newTaskName.trim(),
      taskGroupId: group.id,
    });
    setNewTaskName('');
    setIsAddingTask(false);
  }

  return (
    // ref and style make this element draggable
    // attributes adds accessibility props (aria-*)
    <div ref={setNodeRef} style={style} className={styles.column} {...attributes}>
      <div className={styles.header}>

        {/* Drag handle — listeners only here so clicks elsewhere still work */}
        <div className={styles.dragHandle} {...listeners} title="Drag to reorder">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9"  cy="5"  r="1.5"/>
            <circle cx="9"  cy="12" r="1.5"/>
            <circle cx="9"  cy="19" r="1.5"/>
            <circle cx="15" cy="5"  r="1.5"/>
            <circle cx="15" cy="12" r="1.5"/>
            <circle cx="15" cy="19" r="1.5"/>
          </svg>
        </div>

        {isEditingTitle ? (
          <input
            className={styles.titleInput}
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={e => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') {
                setGroupName(group.taskGroupName);
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
            <span className={styles.title}>{group.taskGroupName}</span>
            <span className={styles.count}>{group.tasks.length}</span>
          </button>
        )}

        <button
          className={styles.deleteGroupBtn}
          onClick={async () => {
            if (confirm(`Delete column "${group.taskGroupName}" and all its tasks?`)) {
              await onDeleteGroup(group.id);
            }
          }}
          title="Delete column"
        >
          ×
        </button>
      </div>

      <div className={styles.tasks} role="list">
        {group.tasks.map(task => (
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
            placeholder="Task name"
            value={newTaskName}
            onChange={e => setNewTaskName(e.target.value)}
            autoFocus
          />
          <div className={styles.addTaskActions}>
            <button className={styles.confirmBtn} type="submit">Add task</button>
            <button
              className={styles.cancelBtn}
              type="button"
              onClick={() => {
                setIsAddingTask(false);
                setNewTaskName('');
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
