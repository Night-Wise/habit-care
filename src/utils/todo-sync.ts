import type { Todo } from '@/context/todos-context';

/** Todo id -> ISO time it was deleted. Synced so a delete on one device sticks on every device. */
export type DeletedTodos = Record<string, string>;

export interface TodoSyncState {
  todos: Todo[];
  deletedTodos: DeletedTodos;
}

/**
 * Fields that only make sense on the device that set them (scheduled notification ids, local
 * ringtone file). They are never uploaded and a merge always keeps this device's values.
 */
const DEVICE_LOCAL_FIELDS = [
  'notificationId',
  'notificationIds',
  'ringNotificationIds',
  'ringSoundUri',
] as const;

/** Bookkeeping fields excluded when deciding whether a habit's settings changed. */
const NON_SETTING_FIELDS = new Set<string>([
  ...DEVICE_LOCAL_FIELDS,
  'updatedAt',
  'completions',
  'completionsUpdatedAt',
  'completed',
]);

type DeviceLocalFields = Pick<Todo, (typeof DEVICE_LOCAL_FIELDS)[number]>;

function deviceLocalFields(todo: Todo | undefined): DeviceLocalFields {
  const fields: DeviceLocalFields = {};
  for (const key of DEVICE_LOCAL_FIELDS) {
    (fields as any)[key] = todo?.[key];
  }
  return fields;
}

export function stripDeviceLocalFields(todo: Todo): Todo {
  const copy = { ...todo };
  for (const key of DEVICE_LOCAL_FIELDS) delete copy[key];
  return copy;
}

function sameValue(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

export function settingsChanged(a: Todo, b: Todo): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (NON_SETTING_FIELDS.has(key)) continue;
    if (!sameValue((a as any)[key], (b as any)[key])) return true;
  }
  return false;
}

function changedCompletionKeys(a: Todo | undefined, b: Todo): string[] {
  const before = a?.completions || {};
  const after = b.completions || {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key) => before[key] !== after[key]);
}

/** True when anything another device should see differs between the two versions. */
export function syncedContentChanged(a: Todo, b: Todo): boolean {
  return settingsChanged(a, b) || changedCompletionKeys(a, b).length > 0;
}

/** Latest time anything synced on this habit was changed ('' for legacy data with no stamps). */
function lastModified(todo: Todo): string {
  let latest = todo.updatedAt || '';
  for (const stamp of Object.values(todo.completionsUpdatedAt || {})) {
    if (stamp > latest) latest = stamp;
  }
  return latest;
}

/**
 * Stamp a local change: bumps `updatedAt` when settings changed, stamps each changed completion
 * day, and records deletions. `changed` is false when only device-local fields moved.
 */
export function trackLocalChanges(
  prev: TodoSyncState,
  nextTodos: Todo[],
  now: string
): { state: TodoSyncState; changed: boolean } {
  const prevById = new Map(prev.todos.map((t) => [t.id, t]));
  const deletedTodos = { ...prev.deletedTodos };
  let changed = false;

  const todos = nextTodos.map((todo) => {
    const before = prevById.get(todo.id);
    if (before === todo) return todo;

    if (deletedTodos[todo.id]) {
      delete deletedTodos[todo.id];
      changed = true;
    }

    const isNew = !before;
    const settingsDiffer = isNew || settingsChanged(before, todo);
    const completionKeys = changedCompletionKeys(before, todo);
    if (!settingsDiffer && completionKeys.length === 0) return todo;

    changed = true;
    const stamps = { ...(todo.completionsUpdatedAt || {}) };
    for (const key of completionKeys) stamps[key] = now;
    return {
      ...todo,
      updatedAt: settingsDiffer ? now : todo.updatedAt,
      completionsUpdatedAt: stamps,
    };
  });

  const nextIds = new Set(todos.map((t) => t.id));
  for (const todo of prev.todos) {
    if (!nextIds.has(todo.id)) {
      deletedTodos[todo.id] = now;
      changed = true;
    }
  }

  return { state: { todos, deletedTodos }, changed };
}

/** Newest settings win; each completion day is resolved on its own; ties go to `local`. */
function mergeTodo(local: Todo, remote: Todo): Todo {
  const base = (remote.updatedAt || '') > (local.updatedAt || '') ? remote : local;

  const localDone = local.completions || {};
  const remoteDone = remote.completions || {};
  const localStamps = local.completionsUpdatedAt || {};
  const remoteStamps = remote.completionsUpdatedAt || {};
  const completions: Record<string, boolean> = {};
  const completionsUpdatedAt: Record<string, string> = {};

  for (const key of new Set([...Object.keys(localDone), ...Object.keys(remoteDone)])) {
    const localStamp = localStamps[key] || '';
    const remoteStamp = remoteStamps[key] || '';
    const useRemote =
      remoteStamp > localStamp || (remoteStamp === localStamp && !(key in localDone));
    const value = useRemote ? remoteDone[key] : localDone[key];
    if (typeof value === 'boolean') completions[key] = value;
    const stamp = useRemote ? remoteStamp : localStamp;
    if (stamp) completionsUpdatedAt[key] = stamp;
  }

  return {
    ...base,
    ...deviceLocalFields(local),
    completions,
    completionsUpdatedAt,
  };
}

/**
 * Merge two copies of the habit list. A habit stays deleted unless it was changed after the
 * delete. Device-local fields always come from `local`.
 */
export function mergeSyncStates(local: TodoSyncState, remote: TodoSyncState): TodoSyncState {
  const deletedTodos: DeletedTodos = { ...remote.deletedTodos };
  for (const [id, deletedAt] of Object.entries(local.deletedTodos)) {
    if (!deletedTodos[id] || deletedAt > deletedTodos[id]) deletedTodos[id] = deletedAt;
  }

  const localById = new Map(local.todos.map((t) => [t.id, t]));
  const remoteById = new Map(remote.todos.map((t) => [t.id, t]));
  const orderedIds = [
    ...local.todos.map((t) => t.id),
    ...remote.todos.map((t) => t.id).filter((id) => !localById.has(id)),
  ];

  const todos: Todo[] = [];
  for (const id of orderedIds) {
    const localTodo = localById.get(id);
    const remoteTodo = remoteById.get(id);
    const merged =
      localTodo && remoteTodo
        ? mergeTodo(localTodo, remoteTodo)
        : localTodo ?? { ...remoteTodo!, ...deviceLocalFields(undefined) };

    const deletedAt = deletedTodos[id];
    if (deletedAt) {
      if (deletedAt >= lastModified(merged)) continue;
      delete deletedTodos[id];
    }
    todos.push(merged);
  }

  return { todos, deletedTodos };
}

/** Use `source` as the full list, keeping this device's local-only fields for matching habits. */
export function adoptSyncState(local: TodoSyncState, source: TodoSyncState): TodoSyncState {
  const localById = new Map(local.todos.map((t) => [t.id, t]));
  return {
    todos: source.todos.map((t) => ({ ...t, ...deviceLocalFields(localById.get(t.id)) })),
    deletedTodos: { ...source.deletedTodos },
  };
}

export function parseDeletedTodos(raw: unknown): DeletedTodos {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result: DeletedTodos = {};
  for (const [id, deletedAt] of Object.entries(raw)) {
    if (typeof deletedAt === 'string') result[id] = deletedAt;
  }
  return result;
}
