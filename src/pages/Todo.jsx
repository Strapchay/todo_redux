import { useContext, useEffect } from "react";
import styles from "./Todo.module.css";
import { useState } from "react";
import { BiGridVertical } from "react-icons/bi";
import { BiDotsVertical } from "react-icons/bi";
import { HiXMark } from "react-icons/hi2";
import { useDispatch, useSelector } from "react-redux";
import {
  APICreateTodo,
  APIDeleteTodo,
  APIDeleteTodoTask,
  APIUpdateTodoComplete,
  APIUpdateTodoIndex,
  APIUpdateTodoTask,
  completeOrUncompleteTodo,
  deleteTaskForTodo,
  deleteTodo,
  replaceTodoIndex,
  selectAllTodos,
  selectCurrentTodo,
  setCurrentTodo,
  updateTaskForTodo,
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
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTaskRender } from "../hooks/useTaskRender";
import { formatEditDate } from "../../utils";
import Modal from "../Modal";
import { AppContext } from "../ProtectedRoute";
import { FixedSizeGrid as Grid } from "react-window";
import { TODO_LIST_GAP, UPDATE_FORMS } from "../constants";
import UpdateInfoForm from "./forms/UpdateInfoForm";
import UpdatePwdForm from "./forms/UpdatePwdForm";
import Switcher, { SwitcherContext } from "./Switcher";
import { useScreens } from "../hooks/useScreens";

function Todo() {
  useEffect(() => {
    document.documentElement.classList.add("html");
    document.body.classList.add("body");

    return () => {
      document.documentElement.classList.remove("html");
      document.body.classList.remove("body");
    };
  }, []);
  return (
    <Switcher propValues={UPDATE_FORMS}>
      <TodoRenderer />;
    </Switcher>
  );
}

function TaskAddInput({
  id,
  task = null,
  todoId = null,
  handleSyncActive = null,
}) {
  const { token, removeToken } = useContext(AppContext);
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
      const payload = { ...task, task: e.target.textContent.trim() };
      dispatch(updateTaskForTodo(payload));
      dispatch(
        APIUpdateTodoTask({
          token,
          task: payload,
          handleSyncActive,
          removeToken,
        }),
      );
    }
    if (e.type === "change") {
      const payload = { ...task, completed: e.target.checked };
      dispatch(updateTaskForTodo(payload));
      dispatch(
        APIUpdateTodoTask({
          token,
          task: payload,
          handleSyncActive,
          removeToken,
        }),
      );
    }
  }

  function handleTaskDelete() {
    const payload = { taskId: task.taskId, todoId };
    dispatch(deleteTaskForTodo(payload));
    dispatch(APIDeleteTodoTask({ ...payload, token, removeToken }));
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

function SortableTaskInput({ tasks, activeDict, handleSyncActive }) {
  const { sensors, handleDragEnd, handleDragStart, currentTodo } =
    useTaskRender(handleSyncActive);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
        {tasks?.map((t) => (
          <TaskAddInput
            id={t?.taskId}
            key={t?.taskId}
            task={t}
            todoId={currentTodo.todoId}
            handleSyncActive={handleSyncActive}
          />
        ))}
      </SortableContext>
      <DragOverlay>
        {activeDict ? (
          <TaskAddInput
            id={activeDict.taskId}
            task={activeDict}
            todoId={currentTodo.todoId}
            handleSyncActive={handleSyncActive}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function UpdateInfoComponent() {
  const { formProps, currentForm, setCurrentForm } =
    useContext(SwitcherContext);

  useEffect(() => {
    setCurrentForm(formProps[0].form);
  }, []);

  return (
    <div className={styles["td-update-info"]}>
      <div className={styles["info-update-heading"]}>
        <h2>Update Your Info</h2>
      </div>
      <div className={styles["info-update-content"]}>
        <Switcher.Switch />
        {currentForm === formProps[0].form && <UpdateInfoForm />}
        {currentForm === formProps[1].form && <UpdatePwdForm />}
      </div>
    </div>
  );
}

function TaskContentRender({ initFormRendered, handleSyncActive }) {
  const {
    handleTitleUpdate,
    incompletedTasks,
    completedTasks,
    handleAddTask,
    incompleteActiveDict,
    completeActiveDict,
    currentTodo,
  } = useTaskRender(handleSyncActive);

  return (
    <div
      className={[
        styles["td-render--container"],
        styles[!initFormRendered ? "hidden" : ""],
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
            >
              {currentTodo?.title}
            </div>
          </div>
          <div className={styles["td-render-component-container"]}>
            <div className={styles["td-render-component-container-content"]}>
              {incompletedTasks && (
                <SortableTaskInput
                  tasks={incompletedTasks}
                  activeDict={incompleteActiveDict}
                  handleSyncActive={handleSyncActive}
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
                  handleSyncActive={handleSyncActive}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TodoListItem({
  id,
  todo,
  currentTodo,
  setInitFormRendered,
  initFormRendered,
  todoTasks,
  handleSyncActive,
  style: gridStyle = {},
}) {
  const dispatch = useDispatch();
  const { token, removeToken } = useContext(AppContext);
  const gap = TODO_LIST_GAP;
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...gridStyle,
    top: gridStyle.top + gap / 2,
    left: gridStyle.left + gap / 2,
    width: gridStyle.width - gap,
    height: gridStyle.height - gap,
    // overflowX: "hidden",
  };

  function formatItemHeading() {
    const todoTitle = todo?.title.length > 0 ? todo.title : ".";
    const retTitle = todoTitle.slice(0, 10).padEnd(13, ".");
    return retTitle;
  }

  function setTodoAsCurrentTodo() {
    dispatch(setCurrentTodo({ todoId: todo?.todoId }));
    if (!initFormRendered) setInitFormRendered(true);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={styles["component-container--box"]}
      data-id={todo?.todoId}
      onClick={setTodoAsCurrentTodo}
    >
      <span className={styles["nudge-btn"]}>
        <BiDotsVertical size={20} />
        <div className={styles["nudge-action--bar"]}>
          <div className={styles["nudge-action--container"]}>
            <ul className={styles["nudge-actions"]}>
              <li
                className={[
                  styles["nudge-action--btn"],
                  styles["nudge-action--delete"],
                ].join(" ")}
                onClick={(e) => {
                  e.stopPropagation();
                  if (todo?.todoId === currentTodo) setInitFormRendered(false);
                  dispatch(deleteTodo({ todoId: todo?.todoId }));
                  dispatch(
                    APIDeleteTodo({ token, todoId: todo?.todoId, removeToken }),
                  );
                }}
              >
                Delete
              </li>
              <li
                className={[
                  styles["nudge-action--btn"],
                  styles["nudge-action--complete"],
                ].join(" ")}
                onClick={() => {
                  dispatch(
                    APIUpdateTodoComplete({
                      token,
                      completed: !todo?.completed,
                      todoId: todo?.todoId,
                      removeToken,
                    }),
                  );
                  dispatch(completeOrUncompleteTodo({ todoId: todo?.todoId }));
                }}
              >
                {todo?.completed ? "Unmark Complete" : "Mark Complete"}
              </li>
            </ul>
          </div>
        </div>
      </span>

      <div className={styles["component-header"]}>
        <div className={styles["draggable-component-btn"]} {...listeners}>
          <BiGridVertical size={20} />
        </div>
        <h3
          className={[
            styles["component-heading"],
            styles[todo?.completed ? "strike-through-task" : ""],
          ].join(" ")}
        >
          {formatItemHeading(todo)}
        </h3>
      </div>
      <div className={styles["component-content-container"]}>
        <ul>
          {todoTasks?.slice(0, 3).map((task) => (
            <div
              key={task?.taskId}
              className={[
                styles["component-content"],
                styles[task?.completed ? "strike-through-task" : ""],
              ].join(" ")}
            >
              <input
                type="checkbox"
                className={styles["td-complete"]}
                checked={task.completed || false}
                onChange={(e) => {
                  e.stopPropagation();
                  const payload = { ...task, completed: e.target.checked };
                  dispatch(updateTaskForTodo(payload));
                  dispatch(
                    APIUpdateTodoTask({
                      token,
                      task: payload,
                      handleSyncActive,
                      removeToken,
                    }),
                  );
                }}
              />
              <label htmlFor="td-complete">
                {task?.task.slice(0, 15).padEnd(18, ".")}
              </label>
            </div>
          ))}
        </ul>
        <p className={styles["component-editted-bar"]}>
          {formatEditDate(todo?.lastAdded)}
        </p>
      </div>
    </div>
  );
}

function TodoListRender({
  initFormRendered,
  setInitFormRendered,
  handleSyncActive,
  gridWidthAndColumnWidth,
}) {
  const { token, removeToken, mobileScreen, setMobileScreen } =
    useContext(AppContext);
  const sensors = useSensors(useSensor(PointerSensor));
  const [activeTodoDict, setActiveTodoDict] = useState({});
  const [formRendered, setFormRendered] = useState(false);
  const dispatch = useDispatch();
  const todos = useSelector(selectAllTodos);
  const currentTodo = useSelector(selectCurrentTodo);

  function handleAddTodoForm() {
    if (!initFormRendered) {
      dispatch(APICreateTodo({ token, handleSyncActive, removeToken }));
      setInitFormRendered(true);
    }
    if (initFormRendered)
      dispatch(APICreateTodo({ token, handleSyncActive, removeToken }));
    if (mobileScreen.active) setMobileScreen((v) => ({ ...v, default: false }));
  }

  function handleDragStart(event) {
    const { active } = event;
    const todo = todos.find((todo) => todo.todoId === active.id);
    setActiveTodoDict(todo);
  }

  function handleDragEnd(event) {
    console.log("the vent drag val", event);
    const { active, over } = event;
    if (active.id !== over.id) {
      dispatch(replaceTodoIndex({ from: active.id, to: over.id }));
      dispatch(APIUpdateTodoIndex({ token, handleSyncActive, removeToken }));
    }
    setActiveTodoDict({});
  }

  return (
    <div className={styles["td-component--container"]}>
      <div
        onClick={handleAddTodoForm}
        className={styles["td-render-todo--add-btn"]}
      >
        + Add Todo
      </div>
      <div className={styles["component-container"]} id="component-container">
        {todos?.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          >
            <SortableContext
              items={todos}
              strategy={verticalListSortingStrategy}
            >
              <Grid
                style={{ marginBottom: "4rem" }}
                height={600}
                columnCount={gridWidthAndColumnWidth.columnCount}
                columnWidth={gridWidthAndColumnWidth.columnWidth}
                rowHeight={110}
                rowCount={Math.ceil((todos.length ?? 0) / 2)}
                itemData={todos}
                itemSize={35}
                width={gridWidthAndColumnWidth.width}
              >
                {({ columnIndex, rowIndex, style, data, columnCount }) => {
                  const todo = data[rowIndex * 2 + columnIndex];
                  return (
                    <TodoListItem
                      currentTodo={currentTodo}
                      id={todo?.todoId}
                      todo={todo}
                      todoTasks={todo?.task}
                      key={todo?.todoId}
                      setInitFormRendered={setInitFormRendered}
                      initFormRendered={initFormRendered}
                      handleSyncActive={handleSyncActive}
                      style={style}
                    />
                  );
                }}
              </Grid>
            </SortableContext>
            <DragOverlay>
              {activeTodoDict ? (
                <TodoListItem todo={activeTodoDict} id={activeTodoDict.id} />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}

function TodoRenderer() {
  const [initFormRendered, setInitFormRendered] = useState(false);
  const [syncUIActive, setSyncUIActive] = useState(false);
  const [updaterActive, setUpdaterActive] = useState(false);
  const {
    syncLoading,
    setSyncLoading,
    sync,
    setSync,
    mobileScreen,
    setMobileScreen,
  } = useContext(AppContext);
  const { gridWidthAndColumnWidth } = useScreens();
  const { currentForm, setCurrentForm } = useContext(SwitcherContext);
  useEffect(() => {
    if (sync && !syncLoading) {
      setSyncLoading(true);
    }
  }, [setSyncLoading, sync, syncLoading]);

  function handleSyncActive() {
    setSyncUIActive(true);
  }
  console.log("mobile screen val", mobileScreen);

  return (
    <div
      className={[
        styles["container"],
        styles["todo-active"],
        currentForm && styles["update-info-active"],
      ].join(" ")}
    >
      <header>
        <nav className={styles["navbar"]}>
          {mobileScreen.active && !mobileScreen.default && (
            <p
              onClick={() => setMobileScreen((v) => ({ ...v, default: true }))}
              className={[styles["navbar-back--btn"]].join(" ")}
            >
              Back
            </p>
          )}
          <p className={styles["navbar-header-title"]}>TD App</p>
          <button
            onClick={() => {
              setUpdaterActive((v) => !v);
              currentForm && setCurrentForm("");
            }}
            className={styles["btn-update"]}
          >
            Update Info
          </button>
        </nav>
      </header>

      <div className={styles["row"]}>
        {syncUIActive && (
          <SyncUINotifier
            syncUIActive={syncUIActive}
            setSyncUIActive={setSyncUIActive}
            setSync={setSync}
          />
        )}
        <div className={styles["td-row"]}>
          {(mobileScreen.active && mobileScreen.default) ||
          !mobileScreen.active ? (
            <TodoListRender
              initFormRendered={initFormRendered}
              setInitFormRendered={setInitFormRendered}
              handleSyncActive={handleSyncActive}
              gridWidthAndColumnWidth={gridWidthAndColumnWidth}
            />
          ) : (
            ""
          )}

          {(mobileScreen.active && !mobileScreen.default) ||
          !mobileScreen.active ? (
            <TaskContentRender
              initFormRendered={initFormRendered}
              handleSyncActive={handleSyncActive}
            />
          ) : (
            ""
          )}
          {updaterActive && <UpdateInfoComponent />}

          {syncLoading && (
            <Modal>
              <Modal.Open opens="sync-loader" click={false}></Modal.Open>
              <Modal.Window name="sync-loader">
                <div></div>
              </Modal.Window>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
}

function SyncUINotifier({ syncUIActive, setSyncUIActive, setSync }) {
  function handleStartSync() {
    console.log("starting sync...");
    setSync(true);
    setSyncUIActive(false);
  }

  return (
    <div className={styles["sync-alert"]}>
      <div className={styles["sync-msg"]}>
        Network Connectivity Issue Detected, its advisable to save data now to
        prevent data Loss If connectivity Still available
      </div>
      <div className={styles["sync-btns"]}>
        <button
          className={[
            styles["btn-sync"],
            styles["btn-sync-now"],
            styles["bd-radius"],
          ].join(" ")}
          onClick={handleStartSync}
        >
          Sync Now
        </button>
        <button
          className={[
            styles["btn-sync"],
            styles["btn-sync-later"],
            styles["bd-radius"],
          ].join(" ")}
          onClick={() => setSyncUIActive(false)}
        >
          Sync Later
        </button>
      </div>
    </div>
  );
}

export default Todo;
