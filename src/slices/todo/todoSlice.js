import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { arrayMove } from "../../../utils";
import { formatAPIResponseBody, makeAPIRequest } from "../../helpers";
import { API } from "../../api";
import {
  taskToCreate,
  taskToUpdate,
  todoToCreate,
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
        state.todo = [...state.todo, action.payload];
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
        const todoIndex = state.todo.findIndex(
          (todo) => todo.todoId === state.currentTodo,
        );
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
        if (currentTodo.tasks.length > 0)
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
  completeOrUncompleteTodo,
  createTaskForTodo,
  updateTaskForTodo,
  deleteTaskForTodo,
  replaceTaskIndexForTodo,
  setCurrentTodo,
  replaceTodoIndex,
} = todoSlice.actions;
export default todoSlice.reducer;

export const selectAllTodos = (state) => state.todos.todo;
export const selectCurrentTodo = (state) => state.todos.currentTodo;

export const APICreateTodo = createAsyncThunk(
  "todo/APICreateTodo",
  async (token, { dispatch, getState, rejectWithValue }) => {
    const res = await makeAPIRequest(
      API.APIEnum.TODO.CREATE,
      { title: "" },
      "createTodo",
      token.token,
      "POST",
      {
        onSuccess: (data) => {
          const todoBody = formatAPIResponseBody(data, "todo");
          const payload = {
            type: createTodo.type,
            payload: todoBody,
          };
          dispatch(payload);
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
        },
      },
    );
    return res;
  },
);

export const APIUpdateTodoTitle = createAsyncThunk(
  "todo/APIUpdateTodoTitle",
  async ({ token, title, todoId }, { dispatch, getState, rejectWithValue }) => {
    const res = await makeAPIRequest(
      API.APIEnum.TODO.PATCH(todoId),
      { title: title },
      "updateTodo",
      token.token,
      "PATCH",
      {
        onSuccess: () => {},
        onError: (_) => {
          const payload = { todoId, title };
          dispatch(todoToUpdate(payload));
        },
      },
    );
    return res;
  },
);

export const APIUpdateTodoComplete = createAsyncThunk(
  "todo/APIUpdateTodoComplete",
  async (
    { token, completed, todoId },
    { dispatch, getState, rejectWithValue },
  ) => {
    const res = await makeAPIRequest(
      API.APIEnum.TODO.PATCH(todoId),
      { completed },
      "updateTodo",
      token.token,
      "PATCH",
      {
        onSuccess: () => {},
        onError: (_) => {
          const payload = { todoId, completed };
          dispatch(todoToUpdate(payload));
        },
      },
    );
    return res;
  },
);

export const APICreateTodoTask = createAsyncThunk(
  "todo/APICreateTodoTask",
  async ({ token, todoId }, { dispatch, getState, rejectWithValue }) => {
    const res = await makeAPIRequest(
      API.APIEnum.TASK.CREATE,
      { task: "", todo_id: todoId, completed: false },
      "createTask",
      token.token,
      "POST",
      {
        onSuccess: (data) => {
          const taskBody = formatAPIResponseBody(data, "task");
          const payload = {
            type: createTaskForTodo.type,
            payload: taskBody,
          };
          dispatch(payload);
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
        },
      },
    );
    return res;
  },
);

export const APIUpdateTodoTask = createAsyncThunk(
  "todo/APIUpdateTodoTask",
  async ({ token, task }, { dispatch, getState, rejectWithValue }) => {
    const res = await makeAPIRequest(
      API.APIEnum.TASK.PATCH(783278373),
      { ...task },
      "updateTodo",
      token.token,
      "PATCH",
      {
        onSuccess: () => {},
        onError: (_) => {
          const currentTodoId = getState().todos.currentTodo;
          const currentTodo = getState().todos.todo.find(
            (todo) => todo.todoId === currentTodoId,
          );

          const payload = {
            taskId: task.taskId,
            completed: task.completed,
            todoLastAdded: currentTodo.lastAdded,
          };
          dispatch(taskToUpdate(payload));
        },
      },
    );
    return res;
  },
);
