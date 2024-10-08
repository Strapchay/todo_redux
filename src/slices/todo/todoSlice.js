import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { arrayMove } from "../../../utils";
import {
  formatAPIResponseBody,
  formatLoadedAPIData,
  makeAPIRequest,
  persistDiff,
  persistTodo,
} from "../../helpers";
import { API } from "../../api";
import {
  taskOrdering,
  taskToCreate,
  taskToDelete,
  taskToUpdate,
  todoOrdering,
  todoToCreate,
  todoToDelete,
  todoToUpdate,
} from "./diffSlice";

const initialState = {
  todo: [],
  completed: [],
  currentTodo: null,
  loadedFromDb: false,
};

const todoSlice = createSlice({
  name: "todo",
  initialState,
  reducers: {
    setInitialTodoFromLocalStorageOrAPI(state, action) {
      const isArray = Array.isArray(action.payload);
      if (!isArray) return { ...action.payload };
      else return action.payload;
    },
    replaceTodos(state, action) {
      state.todo = [...action.payload];
    },
    createTodo: {
      prepare(payload) {
        return {
          payload: {
            ...payload,
            title: "",
            completed: false,
            task: [],
          },
        };
      },
      reducer(state, action) {
        state.todo = [action.payload, ...state.todo];
        state.currentTodo = action.payload.todoId;
      },
    },
    updateTodo: {
      prepare(payload) {
        const currentTime = Date.now();
        return {
          payload: {
            ...payload,
            lastAdded: new Date(currentTime).toISOString(),
          },
        };
      },
      reducer(state, action) {
        const idVal = state.currentTodo ?? action.payload.todoId;
        const todoIndex = state.todo.findIndex((todo) => todo.todoId === idVal);
        const modState = [...state.todo];
        modState.splice(todoIndex, 1, action.payload);
        state.todo = modState;
      },
    },
    deleteTodo(state, action) {
      const todoIndex = state.todo.findIndex(
        (todo) => todo.todoId === action.payload.todoId,
      );
      const modState = [...state.todo];
      modState.splice(todoIndex, 1);
      state.todo = modState;
      if (action.payload.todoId === state.currentTodo) state.currentTodo = null;
    },
    completeOrUncompleteTodo(state, action) {
      const todoIndex = state.todo.findIndex(
        (todo) => todo.todoId === state.currentTodo,
      );
      const modState = [...state.todo];
      const currentTodo = modState[todoIndex];

      if (!currentTodo.completed) {
        currentTodo.completed = true;
        if (currentTodo?.tasks?.length > 0)
          currentTodo?.task.forEach((task) => (task.completed = true));
      } else {
        currentTodo.completed = false;
      }
      modState.splice(todoIndex, 1, currentTodo);
      state.todo = modState;
    },
    replaceTodoIndex(state, action) {
      const fromTodoIndex = state.todo.findIndex(
        (todo) => todo.todoId === action.payload.from,
      );
      const toTodoIndex = state.todo.findIndex(
        (todo) => todo.todoId === action.payload.to,
      );
      const modState = arrayMove(state.todo, fromTodoIndex, toTodoIndex);
      state.todo = modState;
    },
    createTaskForTodo: {
      prepare(payload) {
        return {
          payload: {
            ...payload,
            // taskId: Number(currentTime),
            task: "",
            completed: false,
            // todoLastAdded: new Date(currentTime).toISOString(),
          },
        };
      },
      reducer(state, action) {
        const todoIndex = state.todo.findIndex(
          (todo) => todo.todoId === state.currentTodo,
        );
        const modState = [...state.todo];
        const currentTodo = JSON.parse(
          JSON.stringify({ ...state.todo[todoIndex] }),
        );
        currentTodo.task = [...currentTodo.task, action.payload];
        currentTodo.lastAdded = action.payload.todoLastAdded;

        modState.splice(todoIndex, 1, currentTodo);
        state.todo = modState;
      },
    },
    updateTaskForTodo: {
      prepare(payload) {
        const currentTime = Date.now();
        return {
          payload: {
            ...payload,
            todoLastAdded: new Date(currentTime).toISOString(),
          },
        };
      },
      reducer(state, action) {
        const todoIndex = state.todo.findIndex(
          (todo) => todo.todoId === state.currentTodo,
        );
        const modState = [...state.todo];
        const currentTodo = Object.assign({}, state.todo[todoIndex]);
        const currentTaskIndex = currentTodo.task.findIndex(
          (task) => task.taskId === action.payload.taskId,
        );
        currentTodo.task.splice(currentTaskIndex, 1, action.payload);
        currentTodo.lastAdded = action.payload.todoLastAdded;
        modState.splice(todoIndex, 1, currentTodo);
        state.todo = modState;
      },
    },
    deleteTaskForTodo(state, action) {
      const todoIndex = state.todo.findIndex(
        (todo) => todo.todoId === state.currentTodo,
      );
      const modState = [...state.todo];
      const currentTodo = Object.assign({}, state.todo[todoIndex]);
      const currentTaskIndex = currentTodo.task.findIndex(
        (task) => task.taskId === action.payload.taskId,
      );
      currentTodo.task.splice(currentTaskIndex, 1);
      modState.splice(todoIndex, 1, currentTodo);
      state.todo = modState;
    },
    replaceTaskIndexForTodo(state, action) {
      const todoIndex = state.todo.findIndex(
        (todo) => todo.todoId === state.currentTodo,
      );
      const modState = [...state.todo];
      const currentTodo = Object.assign({}, state.todo[todoIndex]);
      const fromTaskIndex = currentTodo.task.findIndex(
        (task) => task.taskId === action.payload.from,
      );
      const toTaskIndex = currentTodo.task.findIndex(
        (task) => task.taskId === action.payload.to,
      );
      const currentTodoTasks = arrayMove(
        currentTodo.task,
        fromTaskIndex,
        toTaskIndex,
      );
      currentTodo.task = currentTodoTasks;
      modState.splice(todoIndex, 1, currentTodo);
      state.todo = modState;
    },
    setCurrentTodo(state, action) {
      state.currentTodo = action.payload.todoId;
    },
  },
  // extraReducers(builder) {
  //   builder.addCase(APICreateTodo.fulfilled, (state, action) => {});
  // },
});

export const {
  createTodo,
  updateTodo,
  deleteTodo,
  replaceTodos,
  completeOrUncompleteTodo,
  createTaskForTodo,
  updateTaskForTodo,
  deleteTaskForTodo,
  replaceTaskIndexForTodo,
  setCurrentTodo,
  replaceTodoIndex,
  setInitialTodoFromLocalStorageOrAPI,
} = todoSlice.actions;
export default todoSlice.reducer;

export const selectAllTodos = (state) => state.todos.todo;
export const selectCurrentTodo = (state) => state.todos.currentTodo;

export const APIListTodo = createAsyncThunk(
  "todo/APIListTodo",
  async ({ token, removeToken }, { dispatch, getState, rejectWithValue }) => {
    const res = await makeAPIRequest(
      API.APIEnum.TODO.LIST,
      null,
      "loadTodos",
      token.token,
      "GET",
      removeToken,
      {
        onSuccess: (data) => {
          const todos = { ...getState().todos };
          const formattedData = formatLoadedAPIData(data);
          todos.todo = formattedData;
          dispatch(setInitialTodoFromLocalStorageOrAPI(todos));

          persistTodo(todos);
        },
        onError: (_) => {},
      },
    );
    return res;
  },
);

export const APICreateTodo = createAsyncThunk(
  "todo/APICreateTodo",
  async (
    { token, handleSyncActive, removeToken },
    { dispatch, getState, rejectWithValue },
  ) => {
    const res = await makeAPIRequest(
      API.APIEnum.TODO.CREATE,
      { title: "" },
      "createTodo",
      token.token,
      "POST",
      removeToken,
      {
        onSuccess: (data) => {
          const todoBody = formatAPIResponseBody(data, "todo");
          const payload = {
            type: createTodo.type,
            payload: todoBody,
          };
          dispatch(payload);
          const todos = getState().todos;
          persistTodo(todos);
        },
        onError: (_) => {
          const currentTime = Date.now();
          dispatch(
            createTodo({
              todoId: Number(currentTime),
              lastAdded: new Date(currentTime).toISOString(),
            }),
          );
          dispatch(todoToCreate({ todoId: currentTime }));
          const todos = getState().todos;
          const diff = getState().diff;
          persistTodo(todos);
          persistDiff(diff);
          handleSyncActive();
        },
      },
    );
    return res;
  },
);

export const APIUpdateTodoTitle = createAsyncThunk(
  "todo/APIUpdateTodoTitle",
  async (
    { token, title, todoId, removeToken, handleSyncActive },
    { dispatch, getState, rejectWithValue },
  ) => {
    const res = await makeAPIRequest(
      API.APIEnum.TODO.PATCH(todoId),
      { title: title },
      "updateTodo",
      token.token,
      "PATCH",
      removeToken,
      {
        onSuccess: () => {
          const todos = getState().todos;
          persistTodo(todos);
        },
        onError: (_) => {
          const payload = { todoId, title };
          dispatch(todoToUpdate(payload));
          const todos = getState().todos;
          const diff = getState().diff;
          persistTodo(todos);
          persistDiff(diff);
          handleSyncActive();
        },
      },
    );
    return res;
  },
);

export const APIUpdateTodoComplete = createAsyncThunk(
  "todo/APIUpdateTodoComplete",
  async (
    { token, completed, todoId, removeToken, handleSyncActive },
    { dispatch, getState, rejectWithValue },
  ) => {
    const res = await makeAPIRequest(
      API.APIEnum.TODO.PATCH(todoId),
      { completed },
      "updateTodo",
      token.token,
      "PATCH",
      removeToken,
      {
        onSuccess: () => {
          const todos = getState().todos;
          persistTodo(todos);
        },
        onError: (_) => {
          const payload = { todoId, completed };
          dispatch(todoToUpdate(payload));
          const todos = getState().todos;
          const diff = getState().diff;
          persistTodo(todos);
          persistDiff(diff);
          handleSyncActive();
        },
      },
    );
    return res;
  },
);

export const APIDeleteTodo = createAsyncThunk(
  "todo/APIDeleteTodo",
  async (
    { token, todoId, removeToken, handleSyncActive },
    { dispatch, getState, rejectWithValue },
  ) => {
    const res = await makeAPIRequest(
      API.APIEnum.TODO.DELETE(todoId),
      null,
      "deleteTodo",
      token.token,
      "DELETE",
      removeToken,
      {
        onSuccess: (_) => {
          const todos = getState().todos;
          persistTodo(todos);
        },
        onError: (err) => {
          const errContainsStatus =
            err?.includes("status") && err.split(":")[1];
          if (errContainsStatus && Number(errContainsStatus) === 405) return;
          else dispatch(todoToDelete({ todoId }));
          const todos = getState().todos;
          const diff = getState().diff;
          persistTodo(todos);
          persistDiff(diff);
          handleSyncActive();
        },
      },
    );
    return res;
  },
);

export const APIUpdateTodoIndex = createAsyncThunk(
  "todo/APIUpdateTodoIndex",
  async (
    { token, removeToken, ordering, handleSyncActive },
    { dispatch, getState, rejectWithValue },
  ) => {
    const todos = getState().todos.todo;
    const fromTodoIndex = todos.findIndex(
      (todo) => todo.todoId === ordering.from,
    );
    const toTodoIndex = todos.findIndex((todo) => todo.todoId === ordering.to);

    const listItems = [
      {
        id: todos[fromTodoIndex].todoId,
        ordering: todos[toTodoIndex].ordering,
      },
      {
        id: todos[toTodoIndex].todoId,
        ordering: todos[fromTodoIndex].ordering,
      },
    ];
    dispatch(replaceTodoIndex(ordering));
    const payload = { ordering_list: listItems };

    const res = await makeAPIRequest(
      API.APIEnum.TODO.BATCH_UPDATE_ORDERING,
      payload,
      "updateTodo",
      token.token,
      "PATCH",
      removeToken,
      {
        onSuccess: () => {
          const todos = getState().todos;
          persistTodo(todos);
        },
        onError: (_) => {
          const todos = getState().todos;
          const fallbackPayload = [];

          todos.todo.forEach((todo, i) =>
            fallbackPayload.push({
              id: todo.todoId,
              ordering: todos.todo.length - i,
            }),
          );
          dispatch(todoOrdering(fallbackPayload));
          const diff = getState().diff;
          persistTodo(todos);
          persistDiff(diff);
          handleSyncActive();
        },
      },
    );
    return res;
  },
);

export const APICreateTodoTask = createAsyncThunk(
  "todo/APICreateTodoTask",
  async (
    { token, todoId, removeToken, handleSyncActive },
    { dispatch, getState, rejectWithValue },
  ) => {
    const res = await makeAPIRequest(
      API.APIEnum.TASK.CREATE,
      { task: "", todo_id: todoId, completed: false },
      "createTask",
      token.token,
      "POST",
      removeToken,
      {
        onSuccess: (data) => {
          const taskBody = formatAPIResponseBody(data, "task");
          const payload = {
            type: createTaskForTodo.type,
            payload: taskBody,
          };
          dispatch(payload);
          const todos = getState().todos;
          const diff = getState().diff;
          persistTodo(todos);
          persistDiff(diff);
        },
        onError: (_) => {
          const currentTime = Date.now();
          dispatch(
            createTaskForTodo({
              taskId: Number(currentTime),
              todoLastAdded: new Date(currentTime).toISOString(),
            }),
          );
          dispatch(taskToCreate({ todoId, taskId: Number(currentTime) }));
          const todos = getState().todos;
          const diff = getState().diff;
          persistTodo(todos);
          persistDiff(diff);
          handleSyncActive();
        },
      },
    );
    return res;
  },
);

export const APIUpdateTodoTask = createAsyncThunk(
  "todo/APIUpdateTodoTask",
  async (
    { token, task, handleSyncActive, removeToken },
    { dispatch, getState, rejectWithValue },
  ) => {
    const res = await makeAPIRequest(
      API.APIEnum.TASK.PATCH(task.taskId),
      { ...task },
      "updateTodo",
      token.token,
      "PATCH",
      removeToken,
      {
        onSuccess: () => {
          const todos = getState().todos;
          persistTodo(todos);
        },
        onError: (_) => {
          const currentTodoId = getState().todos.currentTodo;
          const currentTodo = getState().todos.todo.find(
            (todo) => todo.todoId === currentTodoId,
          );

          const payload = {
            taskId: task.taskId,
            completed: task.completed,
            todoLastAdded: currentTodo.lastAdded,
            todoId: currentTodoId,
          };
          dispatch(taskToUpdate(payload));
          const todos = getState().todos;
          const diff = getState().diff;
          persistTodo(todos);
          persistDiff(diff);
          handleSyncActive();
        },
      },
    );
    return res;
  },
);

export const APIDeleteTodoTask = createAsyncThunk(
  "todo/APIDeleteTodoTask",
  async (
    { token, taskId, todoId, removeToken, handleSyncActive },
    { dispatch, getState, rejectWithValue },
  ) => {
    const res = await makeAPIRequest(
      API.APIEnum.TASK.DELETE(taskId),
      null,
      "deleteTask",
      token.token,
      "DELETE",
      removeToken,
      {
        onSuccess: (_) => {
          const todos = getState().todos;
          persistTodo(todos);
        },
        onError: (_) => {
          dispatch(taskToDelete({ taskId, todoId }));
          const todos = getState().todos;
          const diff = getState().diff;
          persistTodo(todos);
          persistDiff(diff);
          handleSyncActive();
        },
      },
    );
    return res;
  },
);

export const APIUpdateTodoTaskIndex = createAsyncThunk(
  "todo/APIUpdateTodoTaskIndex",
  async (
    { token, removeToken, handleSyncActive },
    { dispatch, getState, rejectWithValue },
  ) => {
    const currentTodoId = getState().todos.currentTodo;
    const currentTodo = getState().todos.todo.find(
      (todo) => todo.todoId === currentTodoId,
    );
    const listItems = [];
    currentTodo.task.forEach((task, i) =>
      listItems.push({ id: task.taskId, ordering: i + 1 }),
    );

    const payload = { ordering_list: listItems };

    const res = await makeAPIRequest(
      API.APIEnum.TASK.BATCH_UPDATE_ORDERING,
      payload,
      "updateTask",
      token.token,
      "PATCH",
      removeToken,
      {
        onSuccess: () => {
          const todos = getState().todos;
          persistTodo(todos);
        },
        onError: (_) => {
          dispatch(taskOrdering(payload));
          const todos = getState().todos;
          const diff = getState().diff;
          persistTodo(todos);
          persistDiff(diff);
          handleSyncActive();
        },
      },
    );
    return res;
  },
);
