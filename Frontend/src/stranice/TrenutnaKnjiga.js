import React, { useState,useEffect } from "react";


const TrenutnaKnjiga = ({ knjiga, onClose }) => {
  const initialProgress = knjiga?.trenutnaStrana || 0;

  const [novaStrana, setNovaStrana] = useState(initialProgress);
  const [trenutnaStrana, setTrenutnaStrana] = useState(initialProgress);
    const [refresh, setRefresh] = useState(false)
  
    useEffect(() => {
      if (refresh) {
          window.location.reload();
      }
  }, [refresh]);


  if (!knjiga) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-red-500">Podaci o knjizi nisu dostupni.</p>
          <button className="mt-4 px-4 py-2 bg-gray-600 text-white rounded" onClick={onClose}>
            Zatvori
          </button>
        </div>
      </div>
    );
  }


  const progress = (trenutnaStrana / knjiga.knjiga.brojStranica) * 100;

  const handleUpdateProgress = async () => {
    if (novaStrana > knjiga.knjiga.brojStranica) {
      setNovaStrana(knjiga.knjiga.brojStranica);
    }

    try {
      const token = sessionStorage.getItem("jwt");
      const response = await fetch(
        `http://localhost:5108/Korisnik/azurirajCitanje/${knjiga.knjiga.id}/${novaStrana}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setTrenutnaStrana(novaStrana);
        setRefresh(true);
 
      } else {
        const errorData = await response.json();
        alert(`Error updating progress: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      alert("An error occurred while communicating with the server.");
    }
  };

  const handleInputChange = (e) => {
    let value = Number(e.target.value);

    if (value > knjiga.knjiga.brojStranica) {
      value = knjiga.knjiga.brojStranica;
    }

    setNovaStrana(value);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-1/3 max-w-lg relative">
        <button className="absolute top-4 right-4 text-red font-bold " onClick={onClose}>
          ✕
        </button>

        <div className="flex flex-col items-center space-y-4">
          <img
            src={knjiga.knjiga.slika}
            alt={knjiga.knjiga.naslov}
            className="w-48 h-72 object-cover rounded-lg shadow-lg"
          />
          <h1 className="text-xl font-bold text-center">{knjiga.knjiga.naslov}</h1>
          <p className="text-gray-500 text-center">Autor: {knjiga.autor || "Nepoznato"}</p>
          <p className="text-gray-500 text-center">Total pages: {knjiga.knjiga.brojStranica}</p>
        </div>

        <div className="w-full mt-6">
          <div className="relative">
            <span className="text-sm font-semibold py-1 px-2 rounded-full text-black bg-[rgb(224,209,190)]">
              Progress: {progress.toFixed(0)}%
            </span>
            <div className="w-full h-4 bg-gray-200 rounded mt-2">
              <div className="bg-[rgb(176,156,131)] h-full rounded" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        <div className="w-full flex items-center space-x-4 mt-6">
          <label className="text-lg text-gray-700 font-semibold">Update page number:</label>
          <input
            type="number"
            value={novaStrana}
            onChange={handleInputChange}
            min="0"
            max={knjiga.knjiga.brojStranica}
            className="w-20 p-2 border rounded-md text-lg text-gray-700"
          />
        </div>

        <button
          onClick={handleUpdateProgress}
          className="mt-6 w-full py-2 bg-[rgb(176,156,131)] text-black rounded-md shadow-md hover:bg-[rgb(224,209,190)] transition-all"
        >
          Update Progress
        </button>
      </div>
    </div>
  );
};

export default TrenutnaKnjiga;