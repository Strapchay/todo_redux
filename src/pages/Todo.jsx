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

function TaskContentRender({ initFormRendered }) {
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

  console.log("cur todo", currentTodo);
  const contentVisibilityContainerRef = useRef();

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
    console.log("drag start event", event);
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
      console.log(active);
      console.log("the active and over id", active.id, over.id);
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

  return (
    <div
      ref={contentVisibilityContainerRef}
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
            <div
              // ref={contentContainerRef}
              className={styles["td-render-component-container-content"]}
            >
              {incompletedTasks && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={incompletedTasks}
                    strategy={verticalListSortingStrategy}
                  >
                    {incompletedTasks?.map((t) => (
                      <TaskAddInput id={t?.taskId} key={t?.taskId} task={t} />
                    ))}
                  </SortableContext>
                  <DragOverlay>
                    {incompleteActiveDict ? (
                      <TaskAddInput
                        id={incompleteActiveDict.taskId}
                        task={incompleteActiveDict}
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
            <div className={styles["add-td-component-content"]}>
              <span className={styles["placeholder"]} onClick={handleAddTask}>
                + Add content
              </span>
            </div>
            <div className={styles["completed-td-component-content"]}>
              {completedTasks &&
                completedTasks.map((task) => (
                  <TaskAddInput key={task?.taskId} task={task} />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Todo;
