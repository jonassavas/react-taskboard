import { useState } from 'react';
import type { Task } from '../../types';
import styles from './TaskCard.module.css';

interface Props {
  task: Task;
  onUpdate: (taskId: number, data: { title?: string; description?: string }) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
}

export function TaskCard({ task, onUpdate, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');

  async function handleSave() {
    if (!title.trim()) return;
    await onUpdate(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
    });
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && e.metaKey) handleSave();
    if (e.key === 'Escape') {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <div className={`${styles.card} ${styles.editing}`}>
        <input
          className={styles.editTitle}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <textarea
          className={styles.editDesc}
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a description… (optional)"
          rows={3}
        />
        <div className={styles.editActions}>
          <button className={styles.saveBtn} onClick={handleSave}>Save</button>
          <button
            className={styles.cancelBtn}
            onClick={() => {
              setTitle(task.title);
              setDescription(task.description ?? '');
              setIsEditing(false);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card} role="listitem">
      <div className={styles.content}>
        <p className={styles.title}>{task.title}</p>
        {task.description && (
          <p className={styles.description}>{task.description}</p>
        )}
      </div>
      <div className={styles.actions}>
        <button
          className={styles.actionBtn}
          onClick={() => setIsEditing(true)}
          title="Edit task"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          className={`${styles.actionBtn} ${styles.deleteBtn}`}
          onClick={async () => {
            if (confirm(`Delete "${task.title}"?`)) {
              await onDelete(task.id);
            }
          }}
          title="Delete task"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
