
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from "../App.js";
import DodavanjeAutora from '../stranice/DodavanjeAutora.js';
import DodavanjeZanra from '../stranice/DodavanjeZanra.js';
import DodavanjeKnjige from '../stranice/DodavanjeKnjige.js';


const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [zanrovi, setZanrovi] = useState([]);
    const [autori, setAutori] = useState([]);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showAddAuthor, setShowAddAuthor] = useState(false);
    const [showAddGenre, setShowAddGenre] = useState(false);
    const [showDeleteAuthors, setShowDeleteAuthors] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const [refresh, setRefresh] = useState(false)
    const { setKorisnik, jeAdmin, tryLoad} = useContext(AppContext);
    const [showAddBook, setShowAddBook] = useState(false);


    const isBooksPage = location.pathname === "/knjige";

    const fetchAutori = async () => {
        try {
            const response = await fetch("http://localhost:5108/Autor/vratiSveAutoreZaBrisanje" , {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStorage.getItem('jwt')}`, 
                  }
            });

            if (!response.ok) {
                throw new Error("Greska pri ucitavanju autora");
            }
            const data = await response.json();
            setAutori(data);
        } catch (error) {
            console.error("Greska prilikom ucitavanja autora.");
        }
    };

    useEffect(() => {
        tryLoad() //jel sam smela ovako, da nije previse?

        const fetchZanrovi = async () => {
            try {
                const response = await fetch("http://localhost:5108/Zanr/vratiSveZanrove");
                if (!response.ok) {
                    throw new Error("Greska pri ucitavanju zanrova");
                }
                const data = await response.json();
                setZanrovi(data);
            } catch (error) {
                console.error("Greska prilikom ucitavanja zanrova.");
            }
        };
        fetchZanrovi()

        if(jeAdmin)
            fetchAutori()
    }, []);

    useEffect(() => {
        if (refresh) {
            window.location.reload();
        }
    }, [refresh]);


    const handleLogout = async () => {
      try{
        const response = await fetch('http://localhost:5108/Korisnik/izlogujKorisnika', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('jwt')}`
          },
          credentials: 'include',
  
        });
        const responseData = await response.json();
        console.log(responseData);

        if (response.ok && responseData.message === "success") {
          sessionStorage.removeItem('jwt');
          localStorage.removeItem('selectedGenres')
          setKorisnik(null);
          navigate('/');
        }
      } catch (error) {
        console.error(error.message);
      }
    };

    const handleDeleteAuthor = async () => {
        try {
          const response = await fetch(`http://localhost:5108/Autor/obrisiAutora/${selectedAuthor}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("jwt")}`
            }
          });
    
          if (response.ok) {
            alert("Author is successfully deleted!")
            setShowDeleteModal(false)
          } else {
            alert("Author can't be deleted due to linked books.")
            console.error("Error deleting author");
          }
        } catch (error) {
          console.error("Error:", error);
        }
      };

        // const refreshAuthors = () => {
        //     setRefresh(true)
        // };
    
  

    return (
      <header className="bg-gray-800 text-white p-4 shadow-md fixed top-0 w-full z-50">
          <div className="container flex items-center justify-between flex-1 mx-auto">
              <div className="flex items-center space-x-4">
                  <div 
                      className="text-2xl font-bold cursor-pointer"
                      onClick={() => navigate('../knjige')}
                  >
                      BookVerse
                  </div>

                  {isBooksPage && (
                      <button 
                          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded"
                          onClick={() => setIsSidebarOpen(true)}
                      >
                          Genres
                      </button>
                  )}
              </div>

                <div className="relative flex items-center space-x-4">
                    {jeAdmin && (
                        <button
                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        Options
                    </button>
                    )}
                    {/* Dropdown menu */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-900 text-white rounded-lg shadow-lg z-50">
                            <ul className="py-2">
                                <li
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-800"
                                    onClick={() => { setShowAddAuthor(true); setShowDropdown(false) }}
                                >
                                    Add Author
                                </li>
                                <li
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-800"
                                    onClick={() => { setShowAddGenre(true); setShowDropdown(false) }}
                                >
                                    Add Genre
                                </li>
                                <li
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-800"
                                    onClick={() => { setShowAddBook(true); setShowDropdown(false) }}
                                >
                                    Add Book
                                </li>
                                <li
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-800"
                                    onClick={() => { setShowDeleteAuthors(true); setShowDropdown(false) }}
                                >
                                    Delete Authors
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* Move logout button here and apply ml-auto to push it to the right */}
                    
                    <button
                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg mr-4"
                        onClick={() => navigate('/profil')} 
                    >
                        <i className="fas fa-user"></i> {/* FontAwesome user icon */}
                    </button>

                    <button
                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                        onClick={() => setShowLogoutModal(true)}
                    >
                        <i className="fas fa-sign-out-alt"></i>
                    </button>     
              </div>
          </div>

          {isBooksPage && (
              <div 
                  className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white shadow-lg transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} z-50`}
              >
                  <div className="p-4 flex justify-between items-center border-b border-gray-700">
                      <h2 className="text-lg font-semibold">Genres</h2>
                      <button 
                          className="text-gray-400 hover:text-white"
                          onClick={() => setIsSidebarOpen(false)}
                      >
                          ✕
                      </button>
                  </div>
                  <ul className="p-4 space-y-2">
                      {zanrovi.map((zanr, index) => (
                          <li
                              key={index}
                              className="cursor-pointer hover:bg-gray-700 p-2 rounded"
                              onClick={() => navigate(`/knjigeZanra/${zanr.id}`)}
                          >
                              {zanr.naziv}
                          </li>
                      ))}
                  </ul>
              </div>    
          )}

          {isSidebarOpen && (
              <div 
                  className="fixed top-0 left-0 w-full h-full"
                  onClick={() => setIsSidebarOpen(false)}
              ></div>
          )}

            { showAddAuthor &&  (<DodavanjeAutora
                isOpen={showAddAuthor}
                onClose={() => setShowAddAuthor(false)}
            /> )}

            { showAddBook &&  (<DodavanjeKnjige
                isOpen={showAddBook}
                onClose={() => setShowAddBook(false)}
            /> )}

            { showAddGenre &&  (<DodavanjeZanra
                isOpen={showAddGenre}
                onClose={() => setShowAddGenre(false)}
                //refreshAuthors = { refreshAuthors()} // Prosleđivanje funkcije za osvežavanje autora
            /> )}

          {/* Logout modal */}
          {showLogoutModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                      <p className="text-center text-gray-800 mb-4">
                          Are you sure you want to log out?
                      </p>
                      <div className="flex justify-center gap-4">
                          <button
                              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-600"
                              onClick={handleLogout}
                          >
                              Yes
                          </button>
                          <button
                              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                              onClick={() => setShowLogoutModal(false)}
                          >
                              No
                          </button>
                      </div>
                  </div>
              </div>
          )}

            {showDeleteAuthors && (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg w-1/3 max-w-lg max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl text-yellow-900 font-bold">Delete Authors</h2>
                    <button onClick={() => setShowDeleteAuthors(false)} className="text-gray-600 hover:text-gray-900">
                    X
                    </button>
                </div>
                <ul className="space-y-3">
                    {autori.map((autor) => (
                    <li key={autor.id} className="flex justify-between items-center p-2 border-b border-gray-300">
                        <span className="text-lg text-yellow-900">{autor.punoIme}</span>
                        <button 
                            onClick={() => { setSelectedAuthor(autor.id);  setShowDeleteAuthors(false); setShowDeleteModal(true) }}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                        Delete
                        </button>
                    </li>
                    ))}
                </ul>
                </div>
            </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <p className="text-center text-gray-800 mb-4">
                            Are you sure you want to delete the author?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-600"
                                onClick={() => { handleDeleteAuthor(); setRefresh(true) }}
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



      </header>
  );
};

export default Header// import React, { useState, useEffect, useContext } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { AppContext } from "../App.js";
// import DodavanjeAutora from '../stranice/DodavanjeAutora.js';
// import DodavanjeZanra from '../stranice/DodavanjeZanra.js';
// import DodavanjeKnjige from '../stranice/DodavanjeKnjige.js';

// const Header = () => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//     const [zanrovi, setZanrovi] = useState([]);
//     const [autori, setAutori] = useState([]);
//     const [showLogoutModal, setShowLogoutModal] = useState(false);
//     const [showDropdown, setShowDropdown] = useState(false);
//     const [showAddAuthor, setShowAddAuthor] = useState(false);
//     const [showAddGenre, setShowAddGenre] = useState(false);
//     const [showAddBook, setShowAddBook] = useState(false);
//     const [showDeleteAuthors, setShowDeleteAuthors] = useState(false);
//     const [selectedAuthor, setSelectedAuthor] = useState(null);
//     const { setKorisnik, jeAdmin, tryLoad} = useContext(AppContext);

//     const isBooksPage = location.pathname === "/knjige";

//     useEffect(() => {
//         tryLoad();
        
//         const fetchZanrovi = async () => {
//             try {
//                 const response = await fetch("http://localhost:5108/Zanr/vratiSveZanrove");
//                 if (!response.ok) {
//                     throw new Error("Greska pri ucitavanju zanrova");
//                 }
//                 const data = await response.json();
//                 setZanrovi(data);
//             } catch (error) {
//                 console.error("Greska prilikom ucitavanja zanrova.");
//             }
//         };
//         fetchZanrovi();

//         if (jeAdmin) {
//             const fetchAutori = async () => {
//                 try {
//                     const response = await fetch("http://localhost:5108/Autor/vratiSveAutore", {
//                         headers: {
//                             'Content-Type': 'application/json',
//                             Authorization: `Bearer ${sessionStorage.getItem('jwt')}`,
//                         }
//                     });

//                     if (!response.ok) {
//                         throw new Error("Greska pri ucitavanju autora");
//                     }
//                     const data = await response.json();
//                     setAutori(data);
//                 } catch (error) {
//                     console.error("Greska prilikom ucitavanja autora.");
//                 }
//             };
//             fetchAutori();
//         }
//     }, []);

//     const handleLogout = async () => {
//         try {
//             const response = await fetch('http://localhost:5108/Korisnik/izlogujKorisnika', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     Authorization: `Bearer ${sessionStorage.getItem('jwt')}`
//                 },
//                 credentials: 'include',
//             });
//             const responseData = await response.json();

//             if (response.ok && responseData.message === "success") {
//                 sessionStorage.removeItem('jwt');
//                 setKorisnik(null);
//                 navigate('/');
//             }
//         } catch (error) {
//             console.error(error.message);
//         }
//     };

//     return (
//       <header className="bg-gray-800 text-white p-4 shadow-md fixed top-0 w-full z-50">
//           <div className="container mx-auto flex items-center justify-between">
//               <div className="flex items-center space-x-4">
//                   <div 
//                       className="text-2xl font-bold cursor-pointer"
//                       onClick={() => navigate('../knjige')}
//                   >
//                       BookVerse
//                   </div>

//                   {isBooksPage && (
//                       <button 
//                           className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded"
//                           onClick={() => setIsSidebarOpen(true)}
//                       >
//                           Genres
//                       </button>
//                   )}
//               </div>

//               <div className="ml-auto relative">
//                     {jeAdmin && (
//                         <button
//                         className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
//                         onClick={() => setShowDropdown(!showDropdown)}
//                     >
//                         Options
//                     </button>
//                     )}
//                     {showDropdown && (
//                         <div className="absolute right-0 mt-2 w-48 bg-gray-900 text-white rounded-lg shadow-lg z-50">
//                             <ul className="py-2">
//                                 <li className="px-4 py-2 cursor-pointer hover:bg-gray-800" onClick={() => { setShowAddAuthor(true); setShowDropdown(false) }}>Add Author</li>
//                                 <li className="px-4 py-2 cursor-pointer hover:bg-gray-800" onClick={() => { setShowAddGenre(true); setShowDropdown(false) }}>Add Genre</li>
//                                 <li className="px-4 py-2 cursor-pointer hover:bg-gray-800" onClick={() => { setShowAddBook(true); setShowDropdown(false) }}>Add Book</li>
//                                 <li className="px-4 py-2 cursor-pointer hover:bg-gray-800" onClick={() => { setShowDeleteAuthors(true); setShowDropdown(false) }}>Delete Authors</li>
//                             </ul>
//                         </div>
//                     )}
//                     <button className="bg-gray-800 hover:bg-gray-600 text-white px-4 py-2 rounded-lg" onClick={() => {setShowLogoutModal(true); setShowDropdown(false) }}>Logout</button>
//               </div>
//           </div>

//           { showAddAuthor && (<DodavanjeAutora isOpen={showAddAuthor} onClose={() => setShowAddAuthor(false)} /> )}
//           { showAddGenre && (<DodavanjeZanra isOpen={showAddGenre} onClose={() => setShowAddGenre(false)} /> )}
//           { showAddBook && (<DodavanjeKnjige isOpen={showAddBook} onClose={() => setShowAddBook(false)} /> )}
//       </header>
//     );
// };

// export default Header;