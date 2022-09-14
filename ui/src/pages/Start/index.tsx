// @ts-nocheck
import { useLayoutEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

if (window.isFirstRun === undefined) {
  window.isFirstRun = true;
}
const StartPage = () => {
  const [search, setSearch] = useSearchParams();
  const [formData, setFormData] = useState({ full_name: "" });
  const [isLoaded, setIsLoaded] = useState(
    search.get("intro") === "false" ? true : false
  );

  useLayoutEffect(() => {
    // console.log("innnn", search.get("intro"));
    if (
      search.get("intro") === "false"
      // window.isFirstRun === true
      // !sessionStorage.getItem("isFirstRun") ||
      // sessionStorage.getItem("isFirstRun") === true
      // sessionStorage.getItem("isFirstRun") === false
    ) {
    } else {
      setTimeout(() => {
        setIsLoaded(true);
        // window.isFirstRun = false;
        // sessionStorage.setItem("isFirstRun", false);
        // setTimeout(() => setIsShowApp(true), 100);
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
          <source src="intro.mp4" type="video/mp4" />
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
                id="exampleFormControlInput1"
                placeholder="ФИО"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((state) => ({
                    ...state,
                    full_name: e.target.value,
                  }))
                }
              />
              <input
                type="email"
                className="form-control mt-3"
                id="exampleFormControlInput1"
                placeholder="Должность"
              />
              <input
                type="email"
                className="form-control mt-3"
                id="exampleFormControlInput1"
                placeholder="Наименование организации"
              />
              <input
                type="email"
                className="form-control mt-3"
                id="exampleFormControlInput1"
                placeholder="Наименование объекта"
              />
              <input
                type="email"
                className="form-control mt-3"
                id="exampleFormControlInput1"
                placeholder="Номер участка"
              />
              <div className="d-flex justify-content-center mt-4">
                <Link to={`/dashboard?full_name=${formData.full_name}`}>
                  <button
                    className="btn btn-primary"
                    type="button"
                    style={{
                      background: "#00AAD4",
                      borderColor: "#00AAD4;",
                      textTransform: "uppercase",
                    }}
                  >
                    Начать работу
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartPage;
