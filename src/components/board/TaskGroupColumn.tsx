import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { Task, TaskGroup } from '../../types';
import { ColorPicker, getContrastColor } from '../common/ColorPicker';
import styles from './TaskGroupColumn.module.css';

function SortableTaskCard({
  task,
  textColor,
  onUpdate,
  onDelete,
  groupId,
}: {
  task: Task;
  textColor?: string;
  onUpdate: (taskId: number, data: any) => Promise<any>;
  onDelete: (taskId: number) => Promise<any>;
  groupId: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [taskName, setTaskName] = useState(task.taskName);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      taskId: task.id,
      groupId: groupId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className={styles.taskCard} onPointerDown={e => e.stopPropagation()}>
        <input
          className={styles.taskEditInput}
          value={taskName}
          onChange={e => setTaskName(e.target.value)}
          onBlur={() => {
            onUpdate(task.id, { taskName });
            setIsEditing(false);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') { 
              onUpdate(task.id, { taskName }); 
              setIsEditing(false); 
            }
            if (e.key === 'Escape') {
              setTaskName(task.taskName);
              setIsEditing(false);
            }
          }}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={styles.taskCard}>
      <div className={styles.taskDragHandle} {...listeners} {...attributes}>
        ⠿
      </div>
      
      <p className={styles.taskName} style={textColor ? { color: textColor } : undefined}>
        {task.taskName}
      </p>

      <div className={styles.taskActions} onPointerDown={e => e.stopPropagation()}>
        <button className={styles.taskActionBtn} onClick={() => setIsEditing(true)}>✏️</button>
        <button className={`${styles.taskActionBtn} ${styles.taskDeleteBtn}`} onClick={() => onDelete(task.id)}>❌</button>
      </div>
    </div>
  );
}

interface Props {
  group: TaskGroup;
  boardId: number;
  isDraggingTask: boolean;
  onUpdateGroup: (groupId: number, data: { taskGroupName?: string; color?: string | null }) => Promise<any>;
  onDeleteGroup: (groupId: number) => Promise<any>;
  onCreateTask: (groupId: number, data: { taskName: string; taskGroupId: number }) => Promise<any>;
  onUpdateTask: (taskId: number, data: { taskName?: string }) => Promise<any>;
  onDeleteTask: (groupId: number, taskId: number) => Promise<any>;
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

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isGroupDragging,
  } = useSortable({
    id: `group-${group.id}`,
    data: {
      type: 'group',
      groupId: group.id,
    },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `group-dropzone-${group.id}`, 
    data: {
      type: 'group-dropzone',
      groupId: group.id,
    },
  }); 

  function mergeRefs(el: HTMLDivElement | null) {
    setSortableRef(el);
    setDropRef(el);
  }

  const hasColor = !!group.color;
  const textColor = hasColor ? getContrastColor(group.color!) : undefined;

  const columnStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isGroupDragging ? 0.3 : 1,

    ...(group.color ? { background: group.color } : {}),

    ...(textColor
      ? { ['--col-text' as any]: textColor }
      : { ['--col-text' as any]: undefined }),
  }; 

  const sortedTasks = group.tasks; 

  return (
    <div
      ref={mergeRefs}
      style={columnStyle}
      className={[
        styles.column,
        hasColor ? styles.colored : '',
        isOver && isDraggingTask ? styles.dropTarget : '',
      ].join(' ')}
    >
      <div className={styles.header}>
        <div className={styles.dragHandle} {...listeners} {...attributes}>
          ⠿
        </div>

        {isEditingTitle ? (
          <div onPointerDown={e => e.stopPropagation()} style={{ flex: 1 }}>
            <input
              className={styles.titleInput}
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              onBlur={() => { onUpdateGroup(group.id, { taskGroupName: groupName }); setIsEditingTitle(false); }}
              autoFocus
            />
          </div>
        ) : (
          <button 
            className={styles.titleBtn} 
            onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
            onPointerDown={e => e.stopPropagation()}
          >
            <span className={styles.title}>{group.taskGroupName}</span>
            <span className={styles.count}>{group.tasks.length}</span>
          </button>
        )}

        <div onPointerDown={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
          <ColorPicker
            currentColor={group.color}
            onSelect={color =>
                onUpdateGroup(group.id, {
                  color: color ?? null
                })
              } 
          />
          <button className={styles.deleteGroupBtn} onClick={() => onDeleteGroup(group.id)}>×</button>
        </div>
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
              groupId={group.id}
            />
          ))}
        </div>
      </SortableContext>

      <div onPointerDown={e => e.stopPropagation()}>
        {isAddingTask ? (
          <form className={styles.addTaskForm} onSubmit={async (e) => {
            e.preventDefault();
            if (!newTaskName.trim()) return;
            await onCreateTask(group.id, { taskName: newTaskName.trim(), taskGroupId: group.id });
            setNewTaskName('');
            setIsAddingTask(false);
          }}>
            <input 
              className={styles.addTaskInput} 
              value={newTaskName} 
              onChange={e => setNewTaskName(e.target.value)} 
              autoFocus 
            />
            <div className={styles.addTaskActions}>
              <button className={styles.confirmBtn} type="submit">Add</button>
              <button className={styles.cancelBtn} type="button" onClick={() => setIsAddingTask(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <button className={styles.addTaskBtn} onClick={() => setIsAddingTask(true)}>+ Add task</button>
        )}
      </div>
    </div>
  );
}