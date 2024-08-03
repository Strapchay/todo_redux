import { useForm } from "react-hook-form";
import styles from "./AuthForm.module.css";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { API } from "../../api";
import toast from "react-hot-toast";
import { useContext } from "react";
import { AppContext } from "../../ProtectedRoute";
import { SwitcherContext } from "../Switcher";

function UpdateInfoForm() {
  //TODO: if form update info, retrieve dets to upd
  const { token } = useContext(AppContext);
  const { currentForm, setCurrentForm } = useContext(SwitcherContext);
  const { register, handleSubmit, reset, getValues, formState } = useForm();
  const navigate = useNavigate();
  const { errors } = formState;
  const { handleRequest } = useAuth(
    API.APIEnum.USER.UPDATE_INFO,
    reset,
    "updatePwd",
    token,
  );

  function onSubmit(data) {
    handleRequest(
      data,
      {
        onSuccess: (res) => {
          reset();
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
      className={styles["form-class"]}
      id="update-info-form"
      onSubmit={handleSubmit(onSubmit, onError)}
    >
      <div
        className={[
          styles["update-first-name-box"],
          styles["update-form-box"],
        ].join(" ")}
      >
        <input
          type="text"
          name="first_name"
          placeholder="first name"
          className={styles["bd-radius"]}
          {...register("first_name", {
            required: "This field is required",
          })}
        />
      </div>

      <div
        className={[
          styles["update-last-name-box"],
          styles["update-form-box"],
        ].join(" ")}
      >
        <input
          type="text"
          name="last_name"
          placeholder="last name"
          className={styles["bd-radius"]}
          {...register("last_name", {
            required: "This field is required",
          })}
        />
      </div>
      <div
        className={[styles["update-email-box"], styles["update-form-box"]].join(
          " ",
        )}
      >
        <input
          type="email"
          name="email"
          placeholder="email"
          className={styles["bd-radius"]}
          {...register("email", {
            required: "This field is required",
            pattern: {
              value: /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/,
              message: "The entered email value is invalid",
            },
          })}
        />
      </div>
      <button className="btn-submit">Submit</button>
    </form>
  );
}

export default UpdateInfoForm;
