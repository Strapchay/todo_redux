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
  updateTaskForTodo,
  updateTodo,
} from "../slices/todo/todoSlice";

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

function TaskAddInput({ task = null }) {
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
      className={[
        styles["td-component-content"],
        styles[completed ? "strike-through-task" : ""],
      ].join(" ")}
      data-taskid={task?.taskId}
    >
      <div className={styles["td-component-actions"]}>
        <div className={styles["draggable-component-btn"]}>
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
  const dispatch = useDispatch();
  const currentTodo = useSelector((state) =>
    state.todos.todo.find((t) => t.todoId === state.todos.currentTodo),
  );
  const incompletedTasks = currentTodo?.task.filter((task) => !task.completed);
  const completedTasks = currentTodo?.task.filter((task) => task.completed);
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
              {incompletedTasks &&
                incompletedTasks?.map((t) => (
                  <TaskAddInput key={t?.taskId} task={t} />
                ))}
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
