import React, { useEffect, useState, useContext } from "react";  
import { useParams, useNavigate} from "react-router-dom";
import Header from "../komponente/Header";
import DodajOcenu from "../komponente/DodajOcenu";
import Knjiga from "../komponente/Knjiga";
import { AppContext } from "../App.js";
import AzuriranjeAutora from "./AzuriranjeAuotra.js";

import { FaStar } from "react-icons/fa";
import AzuriranjeKnjige from "./AzuriranjeKnjige.js";

const DetaljiKnjige = () => {
  const { idKnjige } = useParams();
  const [knjiga, setKnjiga] = useState(null);
  const [autor, setAutor] = useState(null);
  const [zanr, setZanr] = useState(null);
  const [knjigeAutora, setKnjigeAutora] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);  
  const [error, setError] = useState(null);
  const [showAutorInfo, setShowAutorInfo] = useState(false);
  const [refresh, setRefresh] = useState(false); 
  const [showAuthorUpdate, setShowAuthorUpdate] = useState(false);

  const [activeTab, setActiveTab] = useState("komentari"); // State for tabs
  const [komentari, setKomentari] = useState([]);
  const [ocena, setOcena] = useState(null);
  const {jeAdmin} = useContext(AppContext);

  const [showBookUpdate, setShowBookUpdate] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();


  useEffect(() => {
    if (refresh) {
        window.location.reload();
    }
  }, [refresh]);  


  const fetchDetaljiKnjige = async () => {
    setIsLoading(true); 
    try {
      const response = await fetch(`http://localhost:5108/Knjiga/preuzmiKnjigu/${idKnjige}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("jwt")}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Error fetching book details");
      }
      const data = await response.json();
      setKnjiga(data.knjiga);
      setAutor(data.autor);
      setZanr(data.zanr)

      const autorBooksResponse = await fetch(`http://localhost:5108/Knjiga/vratiKnjigePoAutoru/${data.autor.id}/${data.knjiga.id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("jwt")}`,
        },
      });
      const autorBooksData = await autorBooksResponse.json();
      setKnjigeAutora(autorBooksData); 

      const komentariResponse = await fetch(`http://localhost:5108/Knjiga/vratiKomentareIOcenuKnjige/${data.knjiga.id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("jwt")}`,
        },
      });
      const komentari = await komentariResponse.json();
      setKomentari(komentari.komentari); 
      setOcena(komentari.prosecnaOcena)

      setIsLoading(false); 
    } catch (error) {
      setError(error.message);
      setIsLoading(false); 
    }
  };
  
  const handleReading = async () => {
    const token = sessionStorage.getItem("jwt");
    if (token !== null) {
        try {
            const response = await fetch(`http://localhost:5108/Korisnik/citanjeKnjige/${knjiga.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                console.error("Error updating author:", errorMessage);
                alert(`Error: ${errorMessage}`);
            } else {
                navigate('../profil')
            }

        } catch (error) {
            console.error("Error during update:", error);
            alert("An error occurred. Please try again later.");
        }
    } else {
        alert("Token not found. Please log in again.");
    }
};


  useEffect(() => {
    fetchDetaljiKnjige();
  }, [idKnjige]);

  const handleAutorClick = () => {
    setShowAutorInfo(!showAutorInfo);
  };


  const handleDeleteBook = async () => {
    const token = sessionStorage.getItem("jwt");
    if (token !== null) {
        try {
            const response = await fetch(`http://localhost:5108/Knjiga/obrisiKnjigu/${knjiga.id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                console.error("Error updating author:", errorMessage);
                alert(`Error: ${errorMessage}`);
            } else {
                navigate('../knjige')
            }

        } catch (error) {
            console.error("Error during update:", error);
            alert("An error occurred. Please try again later.");
        }
    } else {
        alert("Token not found. Please log in again.");
    }
};

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const onOcenaDodata = () => {
    fetchDetaljiKnjige();
  };

  return (
    <div>
      <Header />
      <div className="flex min-h-screen p-12">
        {/* Left side with image */}
        <div className="flex flex-col items-center justify-start flex-1">
          <img
            src={knjiga?.slika}
            alt={knjiga?.naslov}
            className="h-1/2 w-auto object-cover rounded-lg shadow-lg mb-4 mt-8"
          />
          <div className="flex flex-col items-start ml-4">
            <p className="text-lg text-yellow-900 mb-4">
            Average grade: 
              <span className="ml-2 flex">
                {[...Array(5)].map((_, i) => {
                  const fullStar = i < Math.floor(ocena);
                  const halfStar = i === Math.floor(ocena) && ocena % 1 >= 0.5;
                  return (
                    <FaStar
                      key={i}
                      className={fullStar ? "text-yellow-500" : halfStar ? "text-yellow-500 half-filled-star" : "text-gray-300"}
                    />
                  );
                })}
              </span>
            </p>
            <p className="text-lg text-yellow-900 mb-4">Number of pages: {knjiga?.brojStranica}</p>
            {autor && (
              <div>
                <p
                  className="text-lg text-yellow-900 cursor-pointer italic underline"
                  onClick={handleAutorClick}
                >
                  Author: {autor.punoIme}
                </p>
              </div>
            )}
            <button className="bg-rose-800 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mt-5" onClick={handleReading}>
                Start reading 
            </button>
          </div>
        </div>

        {/* Right side with book details */}
        <div className="flex flex-1 flex-col justify-start p-6">
          <h1 className="text-3xl text-yellow-900 font-bold mb-4">{knjiga?.naslov}</h1>
          <p className="text-lg text-yellow-900 mb-6">Genre: {zanr}</p>
          <p className="text-lg text-yellow-900 mb-4">{knjiga?.opis}</p>

          <div className="mt-6 flex space-x-4">
            {jeAdmin && (
               
                <button
                    onClick={() => setShowBookUpdate(true) }
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                    >
                      Update Book
                </button>
              )}
                <AzuriranjeKnjige
                  isOpen={showBookUpdate}
                  onClose={() => setShowBookUpdate(false)}
                  bookData={knjiga}
                />
              {jeAdmin && (
                <button 
                  onClick={() => {setShowDeleteModal(true);}}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                  Delete Book
                </button>
              )}
              <div className="ml-auto relative">
                {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <p className="text-center text-gray-800 mb-4">
                            Are you sure you want to delete book?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-600"
                                onClick={handleDeleteBook}
                            >
                                Yes
                            </button>
                            <button
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
              
            
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <div className="flex space-x-4 border-b">
              <button
                className={`px-4 py-2 ${activeTab === "komentari" ? "border-b-2 border-yellow-900 font-bold" : ""}`}
                onClick={() => setActiveTab("komentari")}
              >
                Comments
              </button>
              <button
                className={`px-4 py-2 ${activeTab === "dodajKomentar" ? "border-b-2 border-yellow-900 font-bold" : ""}`}
                onClick={() => setActiveTab("dodajKomentar")}
              >
                Add comment
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "komentari" && (
              <div className="mt-4">
                {komentari.length > 0 ? (
                  <div
                    style={{
                      maxHeight: '300px', // You can adjust this height as per your preference
                      overflowY: 'auto', // Enables vertical scrolling
                    }}
                  >
                    {komentari.map((komentar, index) => (
                      <div key={index} className="border-b py-2">
                        <p className="text-sm text-gray-600 font-bold">{komentar.korisnikIme}</p>
                        <p className="text-lg text-yellow-900">{komentar.komentar}</p>
                        <p className="text-lg text-yellow-900">
                          <span className="flex">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                className={i < Math.round(ocena) ? "text-yellow-500 text-center" : "text-gray-300 text-center"}
                              />
                            ))}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-700">There are no comments for this book.</p>
                )}
              </div>
            )}


            {activeTab === "dodajKomentar" && (
              <div className="mt-4">
                <DodajOcenu
                  knjigaId={knjiga.id}
                  onOcenaDodata={onOcenaDodata}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for author */}
      {showAutorInfo && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-1/3 max-w-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl text-yellow-900 font-bold flex-1">Author: {autor.punoIme}</h2>
              
              <div className="flex gap-2">
                {jeAdmin && 
                 (<button
                    onClick={() => setShowAuthorUpdate(true) }
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm mr-4"
                    >
                      Update
                  </button>
                )}
                <AzuriranjeAutora
                  isOpen={showAuthorUpdate}
                  onClose={() => setShowAuthorUpdate(false)}
                  authorData={autor}
                />

                <button
                  onClick={handleAutorClick}
                  className="text-gray-600 hover:text-gray-900 text-lg"
                >
                  X
                </button>
              </div>
            </div>

            <div className="flex mt-4">
              <img
                src={autor.slika}
                alt={autor.punoIme}
                className="h-20 w-20 object-cover rounded-full mr-4"
              />
              <div className="flex-1">
                <p className="text-lg text-yellow-900">Biography:</p>
                <p className="text-lg text-gray-700">{autor.biografija}</p>
              </div>
            </div>
          </div>
        </div>
      )}


      <hr className="border-t-2 border-yellow-900 my-6 ml-10 mr-10" />

    {/* Knjige od istog autora */}
    <div className="p-6 mt-6">
      <h2 className="text-3xl text-yellow-900 font-bold mb-4 text-center">Books by the same author</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {knjigeAutora && knjigeAutora.length > 0 ? (
          knjigeAutora.map((knjiga, index) => (
            <Knjiga key={knjiga.id} knjiga={knjiga} index={index} />
          ))
        ) : (
          <p className="text-gray-700">The author has no other books.</p>
        )}
      </div>
    </div>

    </div>
  );
};

export default DetaljiKnjige;