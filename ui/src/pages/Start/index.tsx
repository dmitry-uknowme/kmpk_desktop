// @ts-nocheck
import AuthContext from "@/context/AuthContext";
import axios from "axios";
import { useLayoutEffect, useState, useContext, useEffect } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useNavigation,
  useSearchParams,
} from "react-router-dom";
import { toast } from "react-toastify";
import IntroVideo from "../../../public/intro.mp4";

if (window.isFirstRun === undefined) {
  window.isFirstRun = true;
}
const StartPage = () => {
  const { auth, setAuth } = useContext(AuthContext);
  const [search, setSearch] = useSearchParams();
  const [formData, setFormData] = useState({
    user_full_name: "",
    user_position: "",
    user_org_name: "",
    object_name: "",
    object_point_number: "",
  });

  const [isLoaded, setIsLoaded] = useState(
    search.get("intro") === "false" ? true : false
  );

  const isForShow = search.get("variant") === "show" ? true : false;

  const navigate = useNavigate();

  const authUser = async () => {
    const { data } = await axios.post("http://localhost:8081/auth/login", {
      user: {
        full_name: formData.user_full_name,
        position: formData.user_position,
        org_name: formData.user_org_name,
      },
      object: {
        name: formData.object_name,
        point_number: formData.object_point_number,
      },
    });

    if (data.status === "success") {
      setAuth(data.response);
      // setTimeout(() => {
      localStorage.setItem("auth", JSON.stringify(auth));
      // }, 500);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } else {
      toast.error("Ошибка авторизации");
    }
  };

  useLayoutEffect(() => {
    if (search.get("intro") === "false") {
    } else {
      setTimeout(() => {
        setIsLoaded(true);
      }, 8000);
    }
  }, []);

  return (
    <div
      className="start_page h-100 w-100"
      style={{ background: isLoaded ? "#fff" : "#000" }}
    >
      {!isLoaded ? (
        <video
          id="introVideo"
          width="100%"
          height="100%"
          autoPlay
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
          }}
        >
          <source src={IntroVideo} type="video/mp4" />
        </video>
      ) : (
        ""
      )}
      <div
        className="container-fluid h-100"
        style={{
          transform: isLoaded ? "translateY(0)" : "translateY(200%)",
          transition: "all 0.7s",
        }}
      >
        <div className="row h-100 d-flex justify-content-center align-items-center">
          <div className="col-md-8 offset-md-1">
            <div className="form mb-3">
              <div className="d-flex justify-content-center">
                <div className="logo header__logo signin__logo">КМПК</div>
              </div>
              <input
                type="email"
                className="form-control"
                placeholder="ФИО"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((state) => ({
                    ...state,
                    user_full_name: e.target.value,
                  }))
                }
                disabled={isForShow}
              />
              <input
                className="form-control mt-3"
                placeholder="Должность"
                value={formData.user_position}
                onChange={(e) =>
                  setFormData((state) => ({
                    ...state,
                    user_position: e.target.value,
                  }))
                }
                disabled={isForShow}
              />
              <input
                className="form-control mt-3"
                placeholder="Наименование организации"
                value={formData.user_org_name}
                onChange={(e) =>
                  setFormData((state) => ({
                    ...state,
                    user_org_name: e.target.value,
                  }))
                }
                disabled={isForShow}
              />
              <input
                className="form-control mt-3"
                placeholder="Наименование объекта"
                value={formData.object_name}
                onChange={(e) =>
                  setFormData((state) => ({
                    ...state,
                    object_name: e.target.value,
                  }))
                }
                disabled={isForShow}
              />
              <input
                className="form-control mt-3"
                placeholder="Номер участка"
                value={formData.object_point_number}
                onChange={(e) =>
                  setFormData((state) => ({
                    ...state,
                    object_point_number: e.target.value,
                  }))
                }
                disabled={isForShow}
              />
              <div className="d-flex justify-content-center mt-4">
                {/* <Link to={`/dashboard?full_name=${formData.full_name}`}> */}
                {!isForShow ? (
                  <button
                    className="btn btn-primary"
                    type="button"
                    style={{
                      background: "#00AAD4",
                      borderColor: "#00AAD4;",
                      textTransform: "uppercase",
                    }}
                    onClick={() => authUser()}
                  >
                    Начать работу
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    type="button"
                    style={{
                      background: "#00AAD4",
                      borderColor: "#00AAD4;",
                      textTransform: "uppercase",
                    }}
                    onClick={() => authUser()}
                  >
                    Начать новую смену
                  </button>
                )}
                {/* </Link> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartPage;
