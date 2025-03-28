import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../komponente/Header.js";
import Knjiga from '../komponente/Knjiga.js'; 


const PocetnaKnjige = () => {
  const [knjigeZanr, setKnjigeZanr] = useState([]); 
  const [knjigeOcenjene, setKnjigeOcenjene] = useState([]);
  const [knjigeNaStranici, setKnjigeNaStranici] = useState([])
  const [knjigePretrage, setKnjigePretrage] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const [kraj, setKraj] = useState(false);
  const [trenutnaStrana, setTrenutnaStrana] = useState(1);
  const brojKnjigaPoStrani = 6

  const [currentIndexZanr, setCurrentIndexZanr] = useState(0); 
  const [currentIndexOcenjene, setCurrentIndexOcenjene] = useState(0); 

  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState(false); 

  const navigate = useNavigate();

  const handleSearch = async () => {
    if(searchQuery.trim() !== '') {
      try {
        const response = await fetch(`http://localhost:5108/Knjiga/pretragaKnjigePoNaslovu/${searchQuery}`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionStorage.getItem('jwt')}`, 
              }
        });
        if (!response.ok) {
          throw new Error("Greška pri učitavanju knjiga");
        }
        const data = await response.json();
        setKnjigePretrage(data)
        console.log(knjigePretrage)
      } catch (error) {
        setError(error.message); 
      } finally {
        setIsLoading(false);
      }
    }
    else{
      fetchSveKnjige()
    }

  };

  useEffect( () => {
    fetchSveKnjige()
  }, [trenutnaStrana])
  

  useEffect(() => {
    const fetchKnjigeZanr = async () => {
      try {
        const response = await fetch("http://localhost:5108/Korisnik/preporuciKnjige", {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionStorage.getItem('jwt')}`, 
              }
        });
        if (!response.ok) {
          throw new Error("Greška pri učitavanju knjiga");
        }
        const data = await response.json();
        setKnjigeZanr(data)
        //console.log(knjigeZanr)
      } catch (error) {
        setError(error.message); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchKnjigeZanr();
  }, []); // Prazan niz kao zavisnost znači da će se izvršiti samo jednom pri mountovanju

  useEffect(() => {
    const fetchKnjigeOcenjene = async () => {
      try {
        const response = await fetch("http://localhost:5108/Korisnik/preporuciNaOsnovuOcenaPrijatelja", {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionStorage.getItem('jwt')}`, 
              }
        });
        if (!response.ok) {
          throw new Error("Greška pri učitavanju knjiga");
        }
        const data = await response.json();
        setKnjigeOcenjene(data);
        //console.log(knjigeOcenjene)
      } catch (error) {
        setError(error.message); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchKnjigeOcenjene();
  }, []);

  const fetchSveKnjige = async () => {
    try {
      const response = await fetch(
        `http://localhost:5108/Knjiga/vratiSveKnjige/${trenutnaStrana}/${brojKnjigaPoStrani}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("jwt")}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Greška pri učitavanju svih knjiga");
      }
      const data = await response.json();
      console.log(data)
      setKnjigeNaStranici(data.knjige)
      setKraj(data.kraj)
    } catch (error) {
      setError(error.message);
    }
  };

  const sledecaStrana = () => {
    setTrenutnaStrana((prethodnaStrana) => prethodnaStrana + 1);
  };

  const prethodnaStrana = () => {
    if (trenutnaStrana > 1) {
      setTrenutnaStrana((prethodnaStrana) => prethodnaStrana - 1);
    }
  };

    const nextZanr = () => {
        if (currentIndexZanr + 5 < knjigeZanr.length) {
        setCurrentIndexZanr(currentIndexZanr + 5);
        }
    };
    const prevZanr = () => {
    if (currentIndexZanr - 5 >= 0) {
        setCurrentIndexZanr(currentIndexZanr - 5);
    }
    };

    const nextOcenjene = () => {
    if (currentIndexOcenjene + 5 < knjigeOcenjene.length) {
        setCurrentIndexOcenjene(currentIndexOcenjene + 5);
    }
    };
    const prevOcenjene = () => {
    if (currentIndexOcenjene - 5 >= 0) {
        setCurrentIndexOcenjene(currentIndexOcenjene - 5);
    }
    };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
    <Header />
    <div className="flex justify-center items-center mt-6 mb-6">
      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-[80%] sm:w-[60%] md:w-[50%] lg:w-[40%] mt-16">
        <input
          type="text"
          placeholder="Search for a book by its title..."
          value = {searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 w-full outline-none"
        />
        <button 
          className="p-2 bg-gray-200 hover:bg-gray-300"
          onClick={handleSearch}
        >
          🔍
        </button>
      </div>
    </div>
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-gray-100 shadow-md rounded-lg max-w-5xl w-full mx-auto p-8">
        <h1 className="text-5xl text-gray-900 font-bold text-center mt-4 mb-6">
          Explore the world of books
        </h1>
  
        {knjigeZanr.length > 0 && (
          <>
            <h2 className="text-xl text-gray-900 font-bold text-center mt-6 mb-4">
              Recommendations based on your genre preferences and friends' reads
            </h2>
            <div className="relative overflow-hidden">
              { currentIndexZanr > 0 && (
                <button
                  onClick={prevZanr}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white p-2 rounded-full opacity-50 hover:opacity-100 transition-all z-10 ml-4"
                >
                  &#8592;
                </button>
              )}

              <div className="flex gap-4 overflow-hidden py-4" style={{ border: '2px solid #ccc', borderRadius: '8px' }}>
                {knjigeZanr.slice(currentIndexZanr, currentIndexZanr + 5).map((knjiga, index) => (
                  <div
                    key= {`zanr-${index}`}
                    className="ml-4 min-w-[200px] max-w-[250px] bg-white p-4 rounded-lg shadow-md cursor-pointer"
          
                    onClick={() => {
                      navigate(`/detalji-knjige/${knjiga.id}`)}}
                  >
                    <img
                      src={knjiga.slika}
                      alt={knjiga.naslov}
                      className="w-full h-32 object-contain rounded-lg mb-4"
                    />
                    <h3 className="text-lg font-medium text-center">{knjiga.naslov}</h3>
                    <p className="text-md text-center text-yellow-900">{knjiga.autor}</p>
                  </div>
                ))}
              </div>
              { (currentIndexZanr + 5 < knjigeZanr.length) && (
                <button
                  onClick={nextZanr}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white p-2 rounded-full opacity-50 hover:opacity-100 transition-all z-10 mr-4"
                >
                  &#8594;
                </button>
              )}

            </div>
          </>
        )}
  
        {knjigeOcenjene.length > 0 && (
        <>
          <h2 className="text-xl text-gray-900 font-bold text-center mt-12 mb-4">
            Highly rated by friends
          </h2>
          <div className="relative overflow-hidden">
            {currentIndexOcenjene > 0 && (
              <button
                onClick={prevOcenjene}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white p-2 rounded-full opacity-50 hover:opacity-100 transition-all z-10 ml-4"
              >
                &#8592;
              </button>
            )}
            <div 
              className="flex gap-4 py-4 overflow-hidden" 
              style={{ border: '2px solid #ccc', borderRadius: '8px' }}
            >
              {knjigeOcenjene.slice(currentIndexOcenjene, currentIndexOcenjene + 5).map((knjiga, index) => (
                <div
                  key={`ocenjene-${index}`}
                  className="ml-4 min-w-[200px] max-w-[250px] bg-white p-4 rounded-lg shadow-md cursor-pointer"
                  onClick={() => navigate(`/detalji-knjige/${knjiga.id}`)}
                >
                  <img
                    src={knjiga.slika}
                    alt={knjiga.naslov}
                    className="w-full h-32 object-contain rounded-lg mb-4"
                  />
                  <h3 className="text-lg font-medium text-center">{knjiga.naslov}</h3>
                  <h2 className="text-md text-yellow-900 text-center">{knjiga.autor} </h2>
                </div>
              ))}
            </div>
            {(currentIndexOcenjene + 5 < knjigeOcenjene.length) && (
              <button
                onClick={nextOcenjene}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white p-2 rounded-full opacity-50 hover:opacity-100 transition-all z-10 mr-4"
              >
                &#8594;
              </button>
            )}
          </div>
        </>
      )}

        <div className="mt-12">
          <h2 className="text-xl text-gray-900 font-bold text-center mt-6 mb-4">
            {knjigePretrage.length > 0 ? "Search Results" : "All Books"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {(knjigePretrage.length > 0 ? knjigePretrage : knjigeNaStranici).map((knjiga) => (
              <Knjiga key={knjiga.id} knjiga={knjiga} />
            ))}
          </div>

          {knjigePretrage.length === 0 && (
            <div className="flex justify-center items-center mt-4">
              <button 
                onClick={prethodnaStrana} 
                disabled={trenutnaStrana === 1} 
                className={`px-4 py-2 rounded-full mr-2 ${
                  trenutnaStrana === 1 ? "bg-gray-400 text-gray-300 cursor-not-allowed" : "bg-gray-500 text-white hover:opacity-100"
                }`}
              >
                &#8592;
              </button>

              <button 
                onClick={sledecaStrana} 
                disabled={kraj} 
                className={`px-4 py-2 rounded-full ml-2 ${kraj ? "bg-gray-400 text-gray-300 cursor-not-allowed" : "bg-gray-500 text-white hover:opacity-100"}`}
              >
                &#8594;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
};  

export default PocetnaKnjige;