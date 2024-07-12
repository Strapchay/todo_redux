import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createTaskForTodo,
  replaceTaskIndexForTodo,
  updateTodo,
} from "../slices/todo/todoSlice";

export function useTaskRender() {
  const [title, setTitle] = useState("");
  const [incompleteActiveDict, setIncompleteActiveDict] = useState(null);
  const [completeActiveDict, setCompleteActiveDict] = useState(null);

  const dispatch = useDispatch();
  const sensors = useSensors(useSensor(PointerSensor));
  const currentTodo = useSelector((state) =>
    state.todos.todo.find((t) => t.todoId === state.todos.currentTodo),
  );

  const incompletedTasks = currentTodo?.task.filter((task) => !task.completed);
  const completedTasks = currentTodo?.task.filter((task) => task.completed);
  const incompletedTasksIdList = incompletedTasks?.map((task) => task.taskId);
  const completedTasksIdList = completedTasks?.map((task) => task.taskId);

  function handleTitleUpdate(e) {
    e.preventDefault();
    if (e.key !== "Enter") setTitle(e.target.textContent.trim());
    else {
      dispatch(updateTodo({ ...currentTodo, title }));
    }
  }

  function handleAddTask() {
    dispatch(createTaskForTodo());
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
  };
}
