import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { Task, TaskGroup } from '../../types';
import { ColorPicker, getContrastColor } from '../common/ColorPicker';
import styles from './TaskGroupColumn.module.css';

// ── Sortable task card ────────────────────────────────────────────────────────

function SortableTaskCard({
  task,
  textColor,
  onUpdate,
  onDelete,
}: {
  task: Task;
  textColor?: string;
  onUpdate: (taskId: number, data: { taskName?: string }) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [taskName, setTaskName] = useState(task.taskName);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
  id: task.id,
  data: {
    type: 'task',
    taskId: task.id,
    groupId: task.taskGroupId,
  },
}); 

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  async function handleSave() {
    if (!taskName.trim()) return;
    await onUpdate(task.id, { taskName: taskName.trim() });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className={styles.taskCard}>
        <input
          className={styles.taskEditInput}
          value={taskName}
          onChange={e => setTaskName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') { setTaskName(task.taskName); setIsEditing(false); }
          }}
          autoFocus
        />
        <div className={styles.taskEditActions}>
          <button className={styles.saveBtn} onClick={handleSave}>Save</button>
          <button className={styles.cancelSmBtn} onClick={() => { setTaskName(task.taskName); setIsEditing(false); }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
     <div
    ref={setNodeRef}
    style={style}
    className={styles.taskCard}
    {...listeners}
    {...attributes}
  >
     <div className={styles.taskDragHandle}> 
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9"  cy="5"  r="1.5"/><circle cx="9"  cy="12" r="1.5"/><circle cx="9"  cy="19" r="1.5"/>
          <circle cx="15" cy="5"  r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
        </svg>
      </div>
      <p className={styles.taskName} style={textColor ? { color: textColor } : undefined}>
        {task.taskName}
      </p>
      <div className={styles.taskActions}>
        <button className={styles.taskActionBtn} onClick={() => setIsEditing(true)} title="Edit">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          className={`${styles.taskActionBtn} ${styles.taskDeleteBtn}`}
          onClick={async () => { if (confirm(`Delete "${task.taskName}"?`)) await onDelete(task.id); }}
          title="Delete"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────

interface Props {
  group: TaskGroup;
  boardId: number;
  isDraggingTask: boolean;
  onUpdateGroup: (groupId: number, data: { taskGroupName?: string; color?: string | null }) => Promise<void>;
  onDeleteGroup: (groupId: number) => Promise<void>;
  onCreateTask: (groupId: number, data: { taskName: string; taskGroupId: number }) => Promise<void>;
  onUpdateTask: (taskId: number, data: { taskName?: string }) => Promise<void>;
  onDeleteTask: (groupId: number, taskId: number) => Promise<void>;
}

export function TaskGroupColumn({
  group,
  isDraggingTask,
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

  // useSortable makes the column draggable for group reordering
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isGroupDragging,
    } = useSortable({
  id: group.id,
  data: {
    type: 'group',
    groupId: group.id,
  },
});

  // useDroppable makes the column a drop zone for tasks
  // Use a prefixed id so it doesn't collide with the group's sortable id
  const { setNodeRef: setDropRef, isOver } = useDroppable({
  id: `droppable-${group.id}`,
  data: {
    type: 'group-dropzone',
    groupId: group.id,
  },
}); 

  // Merge both refs onto the same div
  function mergeRefs(el: HTMLDivElement | null) {
    setSortableRef(el);
    setDropRef(el);
  }

  const hasColor = !!group.color;
  const textColor = hasColor ? getContrastColor(group.color!) : undefined;

  const columnStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isGroupDragging ? 0.5 : 1,
    ...(group.color ? { background: group.color } : {}),
    ...(textColor ? { '--col-text': textColor } as React.CSSProperties : {}),
  };

  const sortedTasks = [...group.tasks].sort((a, b) => a.position - b.position);

  async function handleTitleSave() {
    if (!groupName.trim()) { setGroupName(group.taskGroupName); setIsEditingTitle(false); return; }
    await onUpdateGroup(group.id, { taskGroupName: groupName.trim() });
    setIsEditingTitle(false);
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    await onCreateTask(group.id, { taskName: newTaskName.trim(), taskGroupId: group.id });
    setNewTaskName('');
    setIsAddingTask(false);
  }

  return (
    <div
      ref={mergeRefs}
      style={columnStyle}
      className={[
        styles.column,
        hasColor ? styles.colored : '',
        isOver && isDraggingTask ? styles.dropTarget : '',
      ].join(' ')}
      {...attributes}
    >
      <div className={styles.header}>
        <div className={styles.dragHandle} {...listeners} title="Drag to reorder column">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9"  cy="5"  r="1.5"/><circle cx="9"  cy="12" r="1.5"/><circle cx="9"  cy="19" r="1.5"/>
            <circle cx="15" cy="5"  r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
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
              if (e.key === 'Escape') { setGroupName(group.taskGroupName); setIsEditingTitle(false); }
            }}
            autoFocus
          />
        ) : (
          <button className={styles.titleBtn} onClick={() => setIsEditingTitle(true)}>
            <span className={styles.title}>{group.taskGroupName}</span>
            <span className={styles.count}>{group.tasks.length}</span>
          </button>
        )}

        <ColorPicker
          currentColor={group.color}
          onSelect={color => onUpdateGroup(group.id, { color })}
        />

        <button
          className={styles.deleteGroupBtn}
          onClick={async () => {
            if (confirm(`Delete column "${group.taskGroupName}" and all its tasks?`)) {
              await onDeleteGroup(group.id);
            }
          }}
          title="Delete column"
        >×</button>
      </div>

      <SortableContext
  items={sortedTasks.map(t => t.id)}
  strategy={verticalListSortingStrategy}
>
  <div className={styles.tasks} role="list">
    {sortedTasks.map(task => (
      <SortableTaskCard
        key={task.id}
        task={task}
        textColor={textColor}
        onUpdate={onUpdateTask}
        onDelete={taskId => onDeleteTask(group.id, taskId)}
      />
    ))}
  </div>
</SortableContext>

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
            <button className={styles.cancelBtn} type="button"
              onClick={() => { setIsAddingTask(false); setNewTaskName(''); }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button className={styles.addTaskBtn} onClick={() => setIsAddingTask(true)}>
          + Add task
        </button>
      )}
    </div>
  );
}
