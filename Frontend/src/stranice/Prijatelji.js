import React, {useContext, useState, useEffect } from "react";
import { AppContext } from "../App"; 
import Header from "../komponente/Header";

const Prijatelji = () => {
  const [prijatelji, setPrijatelji] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [noUsersFound, setNoUsersFound] = useState(false);
  const {jeAdmin} = useContext(AppContext);

  useEffect(() => {
    const fetchPrijatelji = async () => {
      try {
        const token = sessionStorage.getItem("jwt");
        const response = await fetch("http://localhost:5108/Korisnik/prikaziPrijatelje", {
          method: "GET",
          headers: { Authorization: `Bearer ${token} `},
        });
        if (!response.ok) throw new Error("Greška pri dohvatanju prijatelja.");
        const data = await response.json();
        setPrijatelji(data);
      } catch (error) {
        console.error("Greška:", error.message);
      }
    };
    fetchPrijatelji();
  }, []);

  useEffect(() => {
    // Ako je searchQuery prazno, učitaj sve korisnike
    if (!searchQuery.trim()) {
      fetchAllUsers();
    }
  }, [searchQuery]);

  const fetchAllUsers = async () => {
    try {
      const token = sessionStorage.getItem("jwt");
      const response = await fetch("http://localhost:5108/Korisnik/vratiSveKorisnike", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Greška pri dohvatanju korisnika.");
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Greška:", error.message);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setNoUsersFound(false);
    try {
      const token = sessionStorage.getItem("jwt");
      const response = await fetch(`http://localhost:5108/Korisnik/vratiKorisnika/${searchQuery}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setNoUsersFound(true);
        } else {
          throw new Error("Greška pri pretrazi.");
        }
      } else {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Greška:", error.message);
    }
  };


const handleDeleteUser = async (id) => {
  try {
    const token = sessionStorage.getItem("jwt");
    const response = await fetch(`http://localhost:5108/Korisnik/obrisiKorisnika/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Greška pri brisanju korisnika.");
    setSearchResults(searchResults.filter((user) => user.id !== id));
    setPrijatelji(prijatelji.filter((friend) => friend.id !== id));
    alert("Korisnik uspešno obrisan.");
  } catch (error) {
    console.error("Greška:", error.message);
  }
};

  const handleAddFriend = async (id) => {
    try {
      const token = sessionStorage.getItem("jwt");
      const response = await fetch(`http://localhost:5108/Korisnik/dodajPrijatelja/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {

        const addedFriend = searchResults.find((user) => user.id === id);
        setSearchResults(searchResults.filter((user) => user.id !== id));
        setPrijatelji([...prijatelji, addedFriend]);
      } else {
        alert("Došlo je do greške, verovatno ste već prijatelji.");
      }
    } catch (error) {
      console.error("Greška:", error.message);
    }
  };

  const handleRemoveFriend = async (id) => {
    try {
      const token = sessionStorage.getItem("jwt");
      const response = await fetch(`http://localhost:5108/Korisnik/ponistiPrijateljstvo/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Brisanje prijatelja nije uspelo.");
      setPrijatelji(prijatelji.filter((friend) => friend.id !== id));
    } catch (error) {
      console.error("Greška:", error.message);
    }
  };

  const isFriend = (userId) => {
    return prijatelji.some((friend) => friend.id === userId); // Proverava da li je korisnik već prijatelj
  };
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-8">
      <Header/>
      <h1 className="text-4xl font-serif mb-6 text-rose-800">Friends</h1>
      <div className="flex w-full max-w-5xl space-x-8">
        
        {/* Prijatelji */}
        <div className="w-1/2 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-2xl font-serif mb-4">Your Friends</h2>
          {prijatelji.length === 0 ? (
            <p className="text-gray-500">You have no friends yet.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {prijatelji.map((friend) => (
                <li key={friend.id} className="flex justify-between items-center p-3 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    <img src={friend.slika} alt={friend.ime} className="w-12 h-12 rounded-full" />
                    <span className="font-medium text-black">{friend.ime}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
  
        {/* Pretraga korisnika */}
        <div className="w-1/2 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-2xl font-serif mb-4">Find Users</h2>
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Search users..."
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
            >
              Search
            </button>
          </div>
          {isSearching && noUsersFound ? (
            <p className="text-gray-500">No users found matching your query.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {searchResults.map((user) => (
                <li key={user.id} className="flex justify-between items-center p-3 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    <img src={user.slika} alt={user.ime} className="w-12 h-12 rounded-full" />
                    <span className="font-medium text-black">{user.ime}</span>
                  </div>
                  <div className="flex space-x-2">
                    {!isFriend(user.id) && ( // Ako korisnik nije prijatelj, prikaži "Add Friend"
                      <button
                        onClick={() => handleAddFriend(user.id)}
                        className="px-3 py-1 bg-green-700 text-white rounded-lg hover:bg-green-600"
                      >
                        Add Friend
                      </button>
                    )}
                    {jeAdmin && ( // Ako je admin, prikaži "Delete"
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-500"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Prijatelji;