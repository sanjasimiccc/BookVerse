import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../App.js";
import SviZanrovi from "./SviZanrovi.js";

import myImage from "../assets/slika.jpeg";
import spirala from "../assets/spiralica.png";

function Pocetna() {
  const [isRegister, setIsRegister] = useState(false);
  const [isZanroviOpen, setIsZanroviOpen] = useState(false);
  const { tryLoad } = useContext(AppContext);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    opis: "",
    slika: "",
    zanrovi: [], //lista selektovanih zanrova
  });
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Otvaranje modala za žanrove
  const handleOpenZanrovi = () => {
    setIsZanroviOpen(true);
  };

  // Zatvaranje modala i postavljanje selektovanih žanrova
  const handleZanroviSelect = (selectedZanrovi) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      zanrovi: selectedZanrovi,
    }));
  };

  const navigate = useNavigate();

  const handleToggle = () => {
    setIsRegister(!isRegister);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, slika: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    const userData = {
      ime: formData.fullName,
      username: formData.email,
      sifra: formData.password,
      opis: formData.opis,
      zanrovi: formData.zanrovi,
      slika: formData.slika,
    };

    try {
      const response = await fetch("http://localhost:5108/Korisnik/registrujKorisnika", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Greška pri registraciji korisnika");
      }

      const data = await response.text();
      alert(data);

      setFormData({
        fullName: "",
        email: "",
        password: "",
        opis: "",
        slika: "",
        zanrovi: [],
      });

      setIsRegister(false);

      setTimeout(() => {
        navigate("../");
      }, 1000);
    } catch (error) {
      console.error("Greška pri slanju podataka na backend:", error);
      alert("Došlo je do greške prilikom registracije.");
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    const { email, password } = loginData;

    try {
      const response = await fetch(`http://localhost:5108/Korisnik/logujKorisnika/${email}/${password}`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorText = await response.text();
        alert(errorText);
        return;
      }
      tryLoad();

      const token = await response.text();
      sessionStorage.setItem("jwt", token);

      navigate("../knjige");

      setLoginData({
        email: "",
        password: "",
      });
    } catch (error) {
      console.error("Greška pri prijavi korisnika:", error);
      alert("Došlo je do greške prilikom prijave.");
    }
  };
  return (
    <div className="relative h-screen bg-white">
      <div className="flex justify-center items-center h-full px-4">
        <div className="w-full max-w-7xl h-[70%] flex rounded-xl overflow-hidden shadow-xl relative">
          {/* Leva strana - Slika */}
          <div
            className="w-1/2 h-full bg-cover bg-center rounded-l-xl rounded-r-[200px]"
            style={{ backgroundImage: `url(${myImage})` }}
          ></div>
  
          {/* Spirala */}
          <div
            className="absolute inset-0 flex justify-center items-center"
            style={{
              backgroundImage: `url(${spirala})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              width: "60%",
              height: "60%",
              zIndex: 10,
              top: "50%",
              left: "77%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          ></div>
  
          {/* Desna strana - Login ili Register */}
          <div className="w-1/2 h-full flex justify-center items-center bg-[rgb(224,209,190)] bg-opacity-90 rounded-l-[200px]">
            <div className="w-full p-8 max-w-sm space-y-6">
              {isRegister ? (
                <>
                  <h2 className="text-4xl font-bold mb-2 mt-4 text-black text-center">Register</h2>
                  <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="w-full p-3 bg-transparent border border-black rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                      value={formData.fullName || ""}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Username"
                      className="w-full p-3 bg-transparent border border-black rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full p-3 bg-transparent border border-black rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                      value={formData.password || ""}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <textarea
                      placeholder="Describe yourself"
                      className="w-full p-3 bg-transparent border border-black rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                      value={formData.opis || ""}
                      onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                    />
                    <div className="flex flex-col items-start">
                      <label className="text-black mb-2">Choose a Profile Image</label>
                      <div className="flex flex-row items-center">
                     
                      {formData.slika && (
                        <img
                          src={formData.slika}
                          alt="Preview"
                          className="mt-1 h-16 w-24  object-cover rounded-lg"
                        />
                      )}
                       <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="text-black ml-4"
                      />
                    </div>
                    </div>
                    <div className="mt-4">
                  {formData.zanrovi.length === 0 ? (
                    <h3 className="text-lg font-semibold text-black">Select Genres</h3>
                  ) : (
                    <h3 className="text-lg font-semibold text-black">
                      Thank you for selecting your favorite genres!
                    </h3>
                  )}
                    <button
                      type="button" // Dodato kako bi se sprečilo podrazumevano submit ponašanje
                      onClick={handleOpenZanrovi} // Funkcija koja otvara selekciju žanrova
                      className="text-sky-800 hover:underline text-sm mt-2 inline-block bg-transparent border-none cursor-pointer"
                    >
                      Choose your favorite genres
                    </button>
                  </div>

                    <button
                      type="submit"
                      className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
                    >
                      Register
                    </button>
                  </form>
                  <p className=" text-sm text-black text-center">
                    Already have an account?{" "}
                    <span
                      onClick={() => setIsRegister(false)}
                      className="text-sky-600 cursor-pointer hover:underline"
                    >
                      Login
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-4xl font-bold mb-10 text-black text-center">Login</h2>
                  <form className="space-y-4" onSubmit={handleLoginSubmit}>
                    <input
                      type="text"
                      placeholder="Username"
                      className="w-full p-3 bg-transparent border border-black rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                      value={loginData.email || ""}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full p-3 bg-transparent border border-black rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                      value={loginData.password || ""}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                    <button
                      type="submit"
                      className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
                    >
                      Login
                    </button>
                  </form>
                  <p className="mt-4 text-sm text-black text-center">
                    Don't have an account?{" "}
                    <span
                      onClick={() => setIsRegister(true)}
                      className="text-sky-800 cursor-pointer hover:underline"
                    >
                      Register
                    </span>
                  </p>
                </>
              )}
            </div>


              {isZanroviOpen && (
            <div className="fixed top-0 left-0 w-full h-full bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
                <SviZanrovi 
                  onZanroviSelect={(selected) => handleZanroviSelect(selected)}
                  onClose={() => setIsZanroviOpen(false)}
                />
                <button
                  onClick={() => setIsZanroviOpen(false)}
                  className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  X
                </button>
            </div>
          )}



          </div>
        </div>
      </div>
    </div>
  );
}

export default Pocetna;