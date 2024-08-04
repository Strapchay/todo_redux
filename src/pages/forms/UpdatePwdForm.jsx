import { useForm } from "react-hook-form";
import styles from "../Todo.module.css";
import globals from "./AuthForm.module.css";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { API } from "../../api";
import toast from "react-hot-toast";
import { useContext } from "react";
import { AppContext } from "../../ProtectedRoute";
import { SwitcherContext } from "../Switcher";

function UpdatePwdForm() {
  //TODO: if form update info, retrieve dets to upd
  const { token, removeToken } = useContext(AppContext);
  const { currentForm, setCurrentForm } = useContext(SwitcherContext);
  const { register, handleSubmit, reset, getValues, formState } = useForm();
  const navigate = useNavigate();
  const { errors } = formState;
  const { handleRequest } = useAuth(
    API.APIEnum.USER.UPDATE_PWD,
    reset,
    "updatePwd",
    token.token,
    removeToken,
  );

  function onSubmit(data) {
    handleRequest(
      data,
      {
        onSuccess: (res) => {
          reset();
          toast.success("Password update completed successfully");
        },
        onError: (res) => {},
      },
      "PUT",
    );
  }

  function onError() {}

  return (
    <form
      action=""
      className={globals["form-class"]}
      id="update-info-form"
      onSubmit={handleSubmit(onSubmit, onError)}
    >
      <div
        className={[
          styles["update-password-box"],
          styles["update-form-box"],
        ].join(" ")}
      >
        <input
          type="password"
          name="old_password"
          placeholder="old password"
          className={styles["bd-radius"]}
          {...register("old_password", {
            required: "This field is required",
          })}
        />
      </div>
      <div
        className={[
          styles["update-password-box"],
          styles["update-form-box"],
        ].join(" ")}
      >
        <input
          type="password"
          name="password"
          placeholder="password"
          className={styles["bd-radius"]}
          {...register("password", {
            required: "This field is required",
          })}
        />
      </div>
      <div
        className={[
          styles["update-password-box"],
          styles["update-form-box"],
        ].join(" ")}
      >
        <input
          type="password"
          name="password2"
          placeholder="confirm password"
          className={styles["bd-radius"]}
          {...register("password2", {
            required: "This field is required",
          })}
        />
      </div>
      <button className={styles["btn-submit"] ?? globals["btn-submit"]}>
        Submit
      </button>
    </form>
  );
}

export default UpdatePwdForm;
