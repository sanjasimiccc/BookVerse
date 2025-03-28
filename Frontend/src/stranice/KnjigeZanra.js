import {useState, useEffect, useContext} from 'react'
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../App.js";
import Header from '../komponente/Header.js';
import Knjiga from '../komponente/Knjiga.js'; 


const KnjigeZanra = () =>
{
    const [knjige, setKnjige] = useState([])
    const [top3, setTop3] = useState([])
    const [zanr, setZanr] = useState(null)
    const [kraj, setKraj] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [trenutnaStrana, setTrenutnaStrana] = useState(1);
    const brojKnjigaPoStrani = 6
    const {jeAdmin, tryLoad} = useContext(AppContext);
    const { idZanra } = useParams()
    const navigate =  useNavigate()

    useEffect(() => {
      const fetchKnjigeZanra = async () => {
      try {
          const response = await fetch(`http://localhost:5108/Knjiga/vratiKnjigePoZanru/${idZanra}/${trenutnaStrana}/${brojKnjigaPoStrani}`, {
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${sessionStorage.getItem('jwt')}`, 
              }
          });
          if (!response.ok) {
              throw new Error("Greška pri učitavanju knjiga zanra");
          }
          const data = await response.json();
          console.log(data)
          setKnjige(data.knjige)
          setKraj(data.kraj)
          } catch (error) {
              console.error("Greska prilikom ucitavanja zanrova.")
          } 
      };

      fetchKnjigeZanra()

    }, [trenutnaStrana]);

    const sledecaStrana = () => {
        setTrenutnaStrana((prethodnaStrana) => prethodnaStrana + 1);
    };
    
    const prethodnaStrana = () => {
        if (trenutnaStrana > 1) {
          setTrenutnaStrana((prethodnaStrana) => prethodnaStrana - 1);
        }
    };


    useEffect(() => {
      tryLoad()
      const fetchZanr = async () => {
        try {
            const response = await fetch(`http://localhost:5108/Zanr/vratiZanr/${idZanra}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStorage.getItem('jwt')}`, 
                }
            });
            if (!response.ok) {
                throw new Error("Greška pri učitavanju zanra");
            }
            const data = await response.json();
            setZanr(data)
            } catch (error) {
                console.error("Greska prilikom ucitavanja zanra.")
            } 
      };
      const fetchTop3 = async () => {
          try {
              const response = await fetch(`http://localhost:5108/Zanr/vrati3NajcitanijeKnjigeZanra/${idZanra}`, {
                  headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${sessionStorage.getItem('jwt')}`, 
                  }
              });
              if (!response.ok) {
                  throw new Error("Greška pri učitavanju knjiga zanra");
              }
              const data = await response.json();
              setTop3(data)
              } catch (error) {
                  console.error("Greska prilikom ucitavanja top3 knjiga zanra.")
              } 
      };
        fetchZanr()
        fetchTop3()
    }, []);

    const handleDeleteZanr = async () => {
      try {
        const response = await fetch(`http://localhost:5108/Zanr/obrisiZanr/${zanr.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("jwt")}`
          }
        });
  
        if (response.ok) {
          navigate("/knjige"); 
        } else {
          alert("Genre can't be deleted due to linked books and users.")
          console.error("Error deleting genre");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    


    return (
        <div className="bg-gray-100 min-h-screen">
          <Header />
          <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-start mt-16">
              {zanr !== null && (
                <div className="relative w-full max-w-5xl mt-8">
                  <h1 className="text-6xl font-bold text-center">
                    {zanr.naziv}
                  </h1>
                  {jeAdmin && ( <button 
                    className="absolute top-0 right-0 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete
                  </button>)}
                </div>
              )}
              <div className="bg-gray-100 shadow-md rounded-lg max-w-5xl w-full p-8">
          
                {top3.length == 3 && (
                  <>
                    <h2 className="text-4xl font-bold text-center mt-0 mb-6">
                      Top 3
                    </h2>
                    <div className="relative overflow-hidden">      
                      <div className="flex justify-center py-4" style={{ border: '1px solid #ccc', borderRadius: '8px' }}>
                        {top3.map((knjiga, index) => (
                          <div
                            key= {`zanr-${index}`}
                            className="ml-4 mr-4 w-[230px] bg-white p-4 rounded-lg shadow-md cursor-pointer"
                            onClick={() => navigate(`/detalji-knjige/${knjiga.id}`)}
                          >
                            <img
                              src={knjiga.slika}
                              alt={knjiga.naslov}
                              className="w-full h-32 object-contain rounded-lg mb-4"
                            />
                            <h3 className="text-lg font-medium text-center">{knjiga.naslov}</h3>
                            <p className="text-md text-yellow-900 text-center mb-2">{knjiga.autor}</p>
                            <p className="text-sm italic text-yellow-900 text-center">Read by {knjiga.brojCitanja} {knjiga.brojCitanja === 1 ? 'person' : 'people'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
        
        
                  {/* Sve knjige */}
                  <div className="mt-12">
                    <h2 className="text-4xl font-bold text-center mb-6">Books to Dive Into</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {knjige.map((knjiga, index) => (
                      <Knjiga key={knjiga.id} knjiga={knjiga} index = {index} />
                      ))}
                    </div>
        
                    <div className="flex justify-center mt-8">
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
                        className={`px-4 py-2 rounded-full ml-2 ${
                          kraj ? "bg-gray-400 text-gray-300 cursor-not-allowed" : "bg-gray-500 text-white hover:opacity-100"
                        }`}
                      >
                        &#8594;
                      </button>
                    </div>
                  </div>
              </div>
          </div>

          {/* Delete modal */}
        {showDeleteModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                      <p className="text-center text-gray-800 mb-4">
                          Are you sure you want to delete this genre?
                      </p>
                      <div className="flex justify-center gap-4">
                          <button
                              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-600"
                              onClick={handleDeleteZanr}
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
      );

}

export default KnjigeZanra