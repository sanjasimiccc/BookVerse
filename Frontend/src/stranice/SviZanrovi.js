import React, { useEffect, useState } from "react";

const SviZanrovi = ({ onZanroviSelect, onClose}) => {
    const [zanrovi, setZanrovi] = useState([]);
    const [selectedZanrovi, setSelectedZanrovi] = useState([]);

    useEffect(() => {
    const fetchZanrovi = async () => {
        try {
            const response = await fetch("http://localhost:5108/Zanr/vratiSveZanrove");
            if (!response.ok) {
            throw new Error("Greška pri učitavanju žanrova");
            }
            const data = await response.json();
            setZanrovi(data);
        } 
        catch (error) {
            console.error("Greška prilikom učitavanja žanrova:", error);
        }
        // Ako postoji prethodni izbor u localStorage, postavi ga kao selektovane
        const savedGenres = JSON.parse(localStorage.getItem("selectedGenres"));
        if (savedGenres) {
            setSelectedZanrovi(savedGenres);
        }
    };

    fetchZanrovi();
    }, []);

    // Selektovanje/odselektovanje žanra
    const handleCardClick = (zanrId) => {
        setSelectedZanrovi((prevSelected) =>
            prevSelected.includes(zanrId)
            ? prevSelected.filter((id) => id !== zanrId) // Ukloni ako je već selektovan
            : [...prevSelected, zanrId] // Dodaj ako nije selektovan
        );
    };

    // // Prosljeđivanje izabrane liste nazad parent komponenti (Registracija)
    // useEffect(() => {
    //     onZanroviSelect(selectedZanrovi);
    // }, [selectedZanrovi, onZanroviSelect]);

    // Funkcija koja se poziva pri kliknu na Finish
    const handleFinishClick = () => {
        console.log(selectedZanrovi)
        onZanroviSelect(selectedZanrovi);
        localStorage.setItem("selectedGenres", JSON.stringify(selectedZanrovi));
        onClose();
    };

    return (
    <div className="p-0 w-full h-full bg-gray-100">
        <h1 className="text-3xl text-yellow-900 font-bold text-center mt-8 mb-8">Genres</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {zanrovi.map((zanr) => (
            <div
            key={zanr.id}
            className={`p-4 ml-4 mr-4 rounded-lg shadow-md cursor-pointer transition ${
                selectedZanrovi.includes(zanr.id)
                ? "bg-yellow-700 text-white"
                : "bg-white text-yellow-900"
            }`}
            onClick={() => handleCardClick(zanr.id)}
            >
            <img
                src={zanr.slika} 
                alt={zanr.naziv}
                className="w-full h-32 object-cover rounded-lg mb-4"
            />
            <h2 className="text-lg font-medium text-center">{zanr.naziv}</h2>
            </div>
        ))}
        </div>
        <button
            className="absolute bottom-4 right-4 bg-yellow-900 text-white px-6 py-3 rounded-lg shadow-md hover:bg-yellow-600 transition"
           onClick={handleFinishClick}
        >
            Finish
        </button>
    </div>
  );
};

export default SviZanrovi;