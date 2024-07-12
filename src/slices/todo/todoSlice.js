import { createSlice } from "@reduxjs/toolkit";
import { arrayMove } from "../../../utils";

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
        const currentTime = Date.now();
        return {
          payload: {
            ...payload,
            todoId: Number(currentTime),
            title: "",
            completed: false,
            task: [],
            lastAdded: new Date(currentTime).toISOString(),
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
        currentTodo.task.forEach((task) => (task.completed = true));
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
        const currentTime = Date.now();
        return {
          payload: {
            ...payload,
            taskId: Number(currentTime),
            task: "",
            completed: false,
            todoLastAdded: new Date(currentTime).toISOString(),
          },
        };
      },
      reducer(state, action) {
        const todoIndex = state.todo.findIndex(
          (todo) => todo.todoId === state.currentTodo,
        );
        const modState = [...state.todo];
        const currentTodo = state.todo[todoIndex];
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
