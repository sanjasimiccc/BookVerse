import React, { createContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Pocetna from './stranice/Pocetna.js'; 
import SviZanrovi from './stranice/SviZanrovi.js'
import PocetnaKnjige from './stranice/PocetnaKnjige.js'
import DetaljiKnjige from './stranice/DetaljiKnjige.js';
import DodavanjeKnjige from './stranice/DodavanjeKnjige.js';
import DodavanjeAutora from './stranice/DodavanjeAutora.js';
import TrenutnaKnjiga from "./stranice/TrenutnaKnjiga.js";
import ProfilnaStrana from "./stranice/ProfilnaStrana.js";
import KnjigeZanra from './stranice/KnjigeZanra.js'
import Prijatelji from "./stranice/Prijatelji.js";



export const AppContext = createContext();

function App() {
  const [korisnik, setKorisnik] = useState(null); // Stanje za korisnika
  const [jeAdmin, setJeAdmin] = useState(false);

  useEffect(() => {
    tryLoad(); // Pozivanje funkcije za učitavanje korisnika
  }, []);

  // Funkcija za učitavanje korisnika
  const tryLoad = async () => {
    const token = sessionStorage.getItem("jwt");
    if (token !== null) {
      try {
        const response = await fetch("http://localhost:5108/Korisnik/VratiLogovanogKorisnika", {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched user data:", data);
          setKorisnik(data.korisnik); // Postavljanje korisnika u stanje
          setJeAdmin(data.jeAdmin)
          localStorage.setItem("selectedGenres", JSON.stringify(data.korisnik.zanrovi))
          sessionStorage.setItem("mojiID", `${data.korisnik.id}`);
        } else {
          sessionStorage.removeItem("jwt");
          console.error("Failed to fetch user:", await response.text());
        }
      } catch (error) {
        console.error("Error:", error.message);
      }
    }
  };

  return (
    <AppContext.Provider value={{ korisnik, jeAdmin, tryLoad, setKorisnik }}>
      <Router>
        <Routes>
          <Route path="/" element={<Pocetna />} /> 
          <Route path="/zanrovi" 
                element={<SviZanrovi onZanroviSelect={(zanrovi) => console.log(zanrovi)} />} 
          />
          <Route path="/knjige" element={<PocetnaKnjige />} /> 
          <Route path="/profil" element={<ProfilnaStrana />} />
          <Route path="/knjiga/:id" element={<TrenutnaKnjiga />} />
          <Route path="/detalji-knjige/:idKnjige" element={<DetaljiKnjige />} />
          <Route path="/dodavanje-knjige" element={<DodavanjeKnjige />} /> 
          <Route path="/dodavanje-autora" element={<DodavanjeAutora />} />

          <Route path="/prijatelji" element={<Prijatelji />} />
          <Route path="/knjigeZanra/:idZanra" element={<KnjigeZanra/>} />
        </Routes>
      </Router>
    </AppContext.Provider>

  );
}

export default App;