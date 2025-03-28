import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UserProfile = ({ ime, opis, slika }) => {
  const [brojPrijatelja, setBrojPrijatelja] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBrojPrijatelja = async () => {
      try {
        const token = sessionStorage.getItem("jwt");

        const response = await fetch("http://localhost:5108/Korisnik/VratiBrojPrijatelja", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Greška pri dohvatanju broja prijatelja.");
        }

        const data = await response.json();
        setBrojPrijatelja(data);
      } catch (error) {
        console.error("Došlo je do greške:", error.message);
      }
    };

    fetchBrojPrijatelja();
  }, []);

  return (
    <div className="relative flex flex-col items-center bg-white p-6 rounded-2xl shadow-lg max-w-sm mx-auto">
      {/* Prikaz broja prijatelja u gornjem desnom uglu */}
      <div
        className="absolute top-2 right-2 bg-black text-white text-sm px-3 py-1 rounded-full cursor-pointer hover:bg-gray-800 transition"
        onClick={() => navigate("/prijatelji")}
      >
        Friends: {brojPrijatelja}
      </div>

      {/* Profilna slika */}
      <img
        src={slika || "https://via.placeholder.com/150"}
        alt={`${ime}'s profile`}
        className="w-32 h-32 rounded-full object-cover border-4 border-black"
      />

      {/* Ime korisnika */}
      <h1 className="text-2xl font-semibold text-black mt-4">{ime}</h1>

      {/* Opis korisnika */}
      <p className="text-gray-700 text-center mt-2">
        {opis || "Korisnik još nije dodao opis."}
      </p>
    </div>
  );
};

export default UserProfile;