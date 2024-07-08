import { useEffect } from "react";
import styles from "./Landing.module.css";
import Modal from "../Modal";
import LoginForm from "./forms/LoginForm";
import RegisterForm from "./forms/RegisterForm";

function Landing() {
  useEffect(() => {
    document.documentElement.classList.add("html");
    document.body.classList.add("body");

    return () => {
      document.documentElement.classList.remove("html");
      document.body.classList.remove("body");
    };
  }, []);

  return (
    <main className={styles["body"]}>
      <div className={styles.content}>
        <header>
          <nav className={styles["nav-links"]}>
            <div className={styles["header-logo-box"]}>
              <h1 className={styles["header-logo"]}>Td App</h1>
            </div>
          </nav>
        </header>
        <div className={styles["content-container"]}>
          <div className={styles["row"]}>
            <div className={styles["page-content"]}>
              <p className={styles["page-content-text"]}>
                Get your todos in order, seamlessly
              </p>
              <div className={styles["cta-section"]}>
                <Modal>
                  <ul className={styles["btn_list"]}>
                    <Modal.Open opens="login-form">
                      <li
                        className={[
                          styles.btn_link,
                          styles["btn-sm"],
                          styles["btn-login"],
                          styles["bd-radius"],
                        ].join(" ")}
                      >
                        Login
                      </li>
                    </Modal.Open>
                    <Modal.Window name="login-form">
                      <LoginForm />
                    </Modal.Window>

                    <Modal.Open opens="signup-form">
                      <li
                        className={[
                          styles.btn_link,
                          styles["btn-create"],
                          styles["bd-radius"],
                        ].join(" ")}
                      >
                        Create Account
                      </li>
                    </Modal.Open>
                    <Modal.Window name="signup-form">
                      <RegisterForm />
                    </Modal.Window>
                  </ul>
                </Modal>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Landing;
