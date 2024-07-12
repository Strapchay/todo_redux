import { useEffect } from "react";
import styles from "./Todo.module.css";
import { useState } from "react";
import { useRef } from "react";
import { BiGridVertical } from "react-icons/bi";
import { HiXMark } from "react-icons/hi2";
import { useDispatch, useSelector } from "react-redux";
import {
  createTaskForTodo,
  createTodo,
  deleteTaskForTodo,
  replaceTaskIndexForTodo,
  updateTaskForTodo,
  updateTodo,
} from "../slices/todo/todoSlice";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTaskRender } from "../hooks/useTaskRender";

function Todo() {
  const [initFormRendered, setInitFormRendered] = useState(false);
  const [formRendered, setFormRendered] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    document.documentElement.classList.add("html");
    document.body.classList.add("body");

    return () => {
      document.documentElement.classList.remove("html");
      document.body.classList.remove("body");
    };
  }, []);

  function handleAddTodoForm() {
    if (!initFormRendered) {
      dispatch(createTodo());
      setInitFormRendered(true);
    }
  }

  return (
    <div className={[styles["container"], styles["todo-active"]].join(" ")}>
      <header>
        <nav className={styles["navbar"]}>
          <p
            className={[styles["navbar-back--btn"], styles["hidden"]].join(" ")}
          >
            Back
          </p>
          <p className={styles["navbar-header-title"]}>TD App</p>
        </nav>
      </header>

      <div className={styles["row"]}>
        <div className={styles["td-row"]}>
          <div className={styles["td-component--container"]}>
            <div
              onClick={handleAddTodoForm}
              className={styles["td-render-todo--add-btn"]}
            >
              + Add Todo
            </div>
            <div
              className={styles["component-container"]}
              id="component-container"
            ></div>
          </div>
          <TaskContentRender initFormRendered={initFormRendered} />
        </div>
      </div>
    </div>
  );
}

function TaskAddInput({ id, task = null }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dispatch = useDispatch();
  const completed = task?.completed;
  function handleTaskUpdate(e) {
    if (e.type === "keyup" && e.key === "Enter") {
      e.preventDefault();
      dispatch(
        updateTaskForTodo({ ...task, task: e.target.textContent.trim() }),
      );
    }
    if (e.type === "change") {
      dispatch(updateTaskForTodo({ ...task, completed: e.target.checked }));
    }
  }

  function handleTaskDelete() {
    dispatch(deleteTaskForTodo({ taskId: task.taskId }));
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={[
        styles["td-component-content"],
        styles[completed ? "strike-through-task" : ""],
      ].join(" ")}
      data-taskid={task?.taskId}
    >
      <div className={styles["td-component-actions"]}>
        <div className={styles["draggable-component-btn"]} {...listeners}>
          <BiGridVertical size={20} />
        </div>
        <div className={styles["td-component-actions-container"]}>
          <div
            onClick={handleTaskDelete}
            className={styles["delete-component-btn"]}
          >
            <HiXMark size={20} />
          </div>
          {task?.task && (
            <input
              type="checkbox"
              className={styles["td-complete"]}
              checked={completed}
              onChange={handleTaskUpdate}
            />
          )}
        </div>
      </div>
      <div
        contentEditable={true}
        suppressContentEditableWarning={true}
        className={styles["form-task-td"]}
        onKeyUp={handleTaskUpdate}
      >
        {task?.task ?? ""}
      </div>
    </div>
  );
}

function SortableTaskInput({ tasks, activeDict }) {
  const { sensors, handleDragEnd } = useTaskRender();
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
        {tasks?.map((t) => (
          <TaskAddInput id={t?.taskId} key={t?.taskId} task={t} />
        ))}
      </SortableContext>
      <DragOverlay>
        {activeDict ? (
          <TaskAddInput id={activeDict.taskId} task={activeDict} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function TaskContentRender({ initFormRendered }) {
  const {
    handleTitleUpdate,
    incompletedTasks,
    completedTasks,
    handleAddTask,
    incompleteActiveDict,
    completeActiveDict,
  } = useTaskRender();

  return (
    <div
      className={[
        styles["td-render--container"],
        styles[!initFormRendered ? "hidden" : ""],
        styles["mobile-nav--hidden"],
      ].join(" ")}
    >
      <div className={styles["td-render--body"]}>
        <div className={styles["td-render--content"]}>
          <div className={styles["td-render-component-title"]}>
            <div
              contentEditable={true}
              suppressContentEditableWarning={true}
              className={styles["td-render-title"]}
              placeholder="Untitled"
              onKeyUp={handleTitleUpdate}
            ></div>
          </div>
          <div className={styles["td-render-component-container"]}>
            <div className={styles["td-render-component-container-content"]}>
              {incompletedTasks && (
                <SortableTaskInput
                  tasks={incompletedTasks}
                  activeDict={incompleteActiveDict}
                />
              )}
            </div>
            <div className={styles["add-td-component-content"]}>
              <span className={styles["placeholder"]} onClick={handleAddTask}>
                + Add content
              </span>
            </div>
            <div className={styles["completed-td-component-content"]}>
              {completedTasks && (
                <SortableTaskInput
                  tasks={completedTasks}
                  activeDict={completeActiveDict}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Todo;
