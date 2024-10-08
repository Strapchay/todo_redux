import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  APICreateTodoTask,
  APIUpdateTodoTaskIndex,
  APIUpdateTodoTitle,
  createTaskForTodo,
  replaceTaskIndexForTodo,
  updateTodo,
} from "../slices/todo/todoSlice";
import { AppContext } from "../ProtectedRoute";
import { useRef } from "react";
import { useEffect } from "react";

export function useTaskRender(handleSyncActive) {
  const { token, removeToken } = useContext(AppContext);
  const [title, setTitle] = useState("");
  const titleRef = useRef(null);

  const [incompleteActiveDict, setIncompleteActiveDict] = useState(null);
  const [completeActiveDict, setCompleteActiveDict] = useState(null);

  const dispatch = useDispatch();
  const sensors = useSensors(useSensor(PointerSensor));
  const currentTodo = useSelector((state) =>
    state.todos?.todo?.find((t) => t.todoId === state.todos.currentTodo),
  );

  const incompletedTasks = currentTodo?.task?.filter((task) => !task.completed);
  const completedTasks = currentTodo?.task?.filter((task) => task.completed);
  const incompletedTasksIdList = incompletedTasks?.map((task) => task.taskId);
  const completedTasksIdList = completedTasks?.map((task) => task.taskId);

  useEffect(() => {
    if (!title && titleRef.current && titleRef.current.children.length)
      titleRef.current.textContent = "";
  }, [title]);

  function handleTitleUpdate(e) {
    e.preventDefault();
    if (e.key !== "Enter") setTitle(e.target.textContent.trim());
    else if (e.key === "Enter" && e.target.textContent.trim()) {
      dispatch(updateTodo({ ...currentTodo, title }));
      dispatch(
        APIUpdateTodoTitle({
          token,
          title,
          todoId: currentTodo.todoId,
          removeToken,
          handleSyncActive,
        }),
      );
    }
  }

  function handleAddTask() {
    dispatch(
      APICreateTodoTask({
        token,
        todoId: currentTodo.todoId,
        removeToken,
        handleSyncActive,
      }),
    );
  }

  function handleDragStart(event) {
    const { active } = event;

    const isIncompletedTaskType = incompletedTasksIdList.includes(active.id)
      ? true
      : false;
    const isCompletedTaskType = completedTasksIdList.includes(active.id)
      ? true
      : false;

    const activeIncompletedTask =
      isIncompletedTaskType &&
      incompletedTasks.find((task) => task.taskId === active.id);

    const activeCompletedTask =
      isCompletedTaskType &&
      completedTasks.find((task) => task.taskId === active.id);

    activeIncompletedTask && setIncompleteActiveDict(activeIncompletedTask);
    activeCompletedTask && setCompleteActiveDict(activeCompletedTask);
  }

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      dispatch(replaceTaskIndexForTodo({ from: active.id, to: over.id }));
      dispatch(
        APIUpdateTodoTaskIndex({ token, removeToken, handleSyncActive }),
      );
    }
    const isIncompletedTaskType = incompletedTasksIdList.includes(active.id)
      ? true
      : false;
    const isCompletedTaskType = completedTasksIdList.includes(active.id)
      ? true
      : false;

    isIncompletedTaskType && setIncompleteActiveDict({});
    isCompletedTaskType && setCompleteActiveDict({});
  }

  return {
    handleTitleUpdate,
    incompletedTasks,
    completedTasks,
    handleAddTask,
    sensors,
    handleDragEnd,
    handleDragStart,
    completeActiveDict,
    incompleteActiveDict,
    currentTodo,
    title,
    titleRef,
  };
}
