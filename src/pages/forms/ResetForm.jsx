import { useForm } from "react-hook-form";
import styles from "./AuthForm.module.css";
import { useAuth } from "../../hooks/useAuth";
import { API } from "../../api";
import { useContext } from "react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { SwitcherContext } from "../Switcher";

function ResetForm() {
  const { setCurrentForm, currentForm } = useContext(SwitcherContext);
  const { register, handleSubmit, reset, getValues, formState } = useForm();
  const { errors } = formState;
  const { handleRequest } = useAuth(
    currentForm === "reset"
      ? API.APIEnum.USER.RESET_PWD
      : API.APIEnum.USER.RESET_PWD_CONFIRM,
    reset,
    currentForm,
  );

  function onSubmit(data) {
    if (currentForm === "reset")
      handleRequest(data, {
        onSuccess: (res) => {
          toast.success(res.detail);
          setCurrentForm((_) => "reset_confirm");
        },
      });
    if (currentForm === "reset_confirm")
      handleRequest(data, {
        onSuccess: (res) => {
          toast.success(res.detail);
          setCurrentForm((_) => "login");
        },
      });
  }

  function onError() {}
  return (
    <form
      action=""
      id="reset-pwd-form"
      className={styles["form-class"]}
      onSubmit={handleSubmit(onSubmit, onError)}
    >
      <h2 className={styles["reset-heading"]}>Reset Password</h2>

      {currentForm === "reset" && (
        <div className={styles["reset-reset"]}>
          <div className={[styles["email-box"], styles["form-box"]].join(" ")}>
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
        </div>
      )}

      {currentForm === "reset_confirm" && (
        <div className={styles["reset-confirm"]}>
          <div
            className={[styles["reset-token-box"], styles["form-box"]].join(
              " ",
            )}
          >
            <input
              type="text"
              name="token"
              placeholder="token"
              className={styles["bd-radius"]}
              {...register("token", {
                required: "This field is required",
              })}
            />
          </div>
          <div
            className={[styles["reset-uid-box"], styles["form-box"]].join(" ")}
          >
            <input
              type="text"
              name="uid"
              placeholder="uid"
              className={styles["bd-radius"]}
              {...register("uid", {
                required: "This field is required",
              })}
            />
          </div>
          <div
            className={[styles["reset-password-box"], styles["form-box"]].join(
              " ",
            )}
          >
            <input
              type="password"
              name="new_password1"
              placeholder="new password"
              className={styles["bd-radius"]}
              {...register("new_password1", {
                required: "This field is required",
                validate: (value) =>
                  value == getValues().new_password2 ||
                  "Password fields don't match",
              })}
            />
          </div>
          <div
            className={[styles["reset-password-box"], styles["form-box"]].join(
              " ",
            )}
          >
            <input
              type="password"
              name="new_password2"
              placeholder="confirm password"
              className={styles["bd-radius"]}
              {...register("new_password2", {
                required: "This field is required",
              })}
            />
          </div>
        </div>
      )}
      <button className={styles["btn-submit"]}>Submit</button>
    </form>
  );
}

export default ResetForm;
