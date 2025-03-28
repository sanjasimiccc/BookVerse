import React, { useState } from "react";
import { FaStar } from "react-icons/fa";

const DodajOcenu = ({ knjigaId, onOcenaDodata }) => {
  const [ocena, setOcena] = useState(0); // Trenutno selektovana ocena
  const [hover, setHover] = useState(null); // Zvezdica na kojoj je hover
  const [komentar, setKomentar] = useState(""); // Komentar korisnika
  const [poruka, setPoruka] = useState(""); // Poruka za korisnika

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Provera da li je ocena između 1 i 5
    if (ocena < 1 || ocena > 5) {
      setPoruka("Molimo Vas da izaberete ocenu između 1 i 5.");
      return;
    }
  
    // Dohvatanje korisničkog ID iz tokena
    // const korisnikId = sessionStorage.getItem("korisnikId");
  
    // if (!korisnikId) {
    //   setPoruka("Greška: Korisnik nije prijavljen.");
    //   return;
    // }
  
    try {
      const response = await fetch("http://localhost:5108/Korisnik/dodajOcenu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("jwt")}`, 
        },
        body: JSON.stringify({
          knjigaId: knjigaId, 
          ocena: ocena,
          komentar: komentar,
          korisnikId: "00145688-2acb-4d9a-9762-a61c1a777c30"
        }),
      });
  
      if (response.ok) {
        setPoruka("Uspešno ste dodali ocenu!");
        onOcenaDodata(); // Osvežava stranicu ili vraća na početni ekran
      } else {
        const error = await response.text();
        setPoruka(`${error}`);
      }
    } catch (err) {
      setPoruka(`Došlo je do greške: ${err.message}`);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="flex mb-4">
          {[...Array(5)].map((_, i) => {
            const starValue = i + 1;
            return (
              <label key={i}>
                <input
                  type="radio"
                  name="ocena"
                  value={starValue}
                  onClick={() => setOcena(starValue)}
                  className="hidden"
                />
                <FaStar
                  className={`cursor-pointer text-2xl ${
                    starValue <= (hover || ocena) ? "text-yellow-500" : "text-gray-300"
                  }`}
                  onMouseEnter={() => setHover(starValue)}
                  onMouseLeave={() => setHover(null)}
                />
              </label>
            );
          })}
        </div>
        <textarea
          className="w-full border rounded-lg p-2 mb-4"
          placeholder="Add comment"
          value={komentar}
          onChange={(e) => setKomentar(e.target.value)}
        ></textarea>
        <button
          type="submit"
          className="bg-gray-800 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          Save
        </button>
      </form>
      {poruka && <p className="mt-4 text-red-600">{poruka}</p>}
    </div>
  );
};

export default DodajOcenu;
