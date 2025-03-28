import { useState, useEffect, useContext} from 'react';
import { AppContext } from "../App.js";
import SviZanrovi from "./SviZanrovi.js";

function UpdateProfile({ isOpen, onClose, userData }) {
    console.log(userData)

    const { korisnik, loading } = useContext(AppContext);
    const [isZanroviOpen, setIsZanroviOpen] = useState(false);

       // Otvaranje modala za žanrove
    const handleOpenZanrovi = () => {
        setIsZanroviOpen(true);
    };

    // Zatvaranje modala i postavljanje selektovanih žanrova
    const handleZanroviSelect = (selectedZanrovi) => {
        setFormData((prevFormData) => ({
        ...prevFormData,
        genres: selectedZanrovi,
        }));


    };


    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        description: '', 
        photo: '', 
        genres: []
    });

    const [refresh, setRefresh] = useState(false); // State to trigger refresh

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setFormData((prev) => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (userData) {
            setFormData({

                fullName: userData.ime || '',
                email: userData.username || '',
                description: userData.opis || '',
                photo: userData.slika || '',
                genres: userData.zanrovi || [] 
            });
        }
    }, [userData, isOpen]);

    useEffect(() => {
        if (refresh) {
            // Trigger a page refresh after user data update
            window.location.reload();
        }
    }, [refresh]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        const token = sessionStorage.getItem("jwt");  // Preuzmi token sa sessionStorage
        if (token !== null) {
            try {
                const response = await fetch("http://localhost:5108/Korisnik/azurirajKorisnika", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,  // Koristi token za autorizaciju
                    },
                    body: JSON.stringify({
                        ime: formData.fullName || korisnik.ime,  // Ako nema nove vrednosti, koristi vrednosti iz konteksta
                        username: formData.email || korisnik.username,
                        //sifra:korisnik.sifra, ne moze ovo
                        opis: formData.description || korisnik.opis,
                        zanrovi: formData.genres || korisnik.zanrovi,
                        slika: formData.photo || korisnik.slika,
                        
                    }),
                });
    
                if (!response.ok) {
                    const errorMessage = await response.text();
                    console.error("Error updating user:", errorMessage);
                    alert(`Error: ${errorMessage}`);
                 } else {
                     //const result = await response.text();
                    // console.log("User updated successfully:", result);
                     setRefresh(true);  // Ova funkcija može pokrenuti reload ili osvežavanje stanja
                 }

            } catch (error) {
                console.error("Error during update:", error);
                alert("An error occurred. Please try again later.");
            }
        } else {
            alert("Token not found. Please log in again.");
        }
    
        onClose();  // Zatvori modal nakon što je ažuriranje završeno
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
            }}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    padding: '20px',
                    width: '400px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    position: 'relative',
                }}
            >
                <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#000' }}>Update Profile</h1>
                <form>
                    <div style={{ marginBottom: '15px' }}>
                        <label
                            htmlFor="fullName"
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold',
                                color: '#333',
                            }}
                        >
                            Full Name:
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                                color: '#000',
                                fontSize: '14px',
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label
                            htmlFor="email"
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold',
                                color: '#333',
                            }}
                        >
                            Username:
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                                color: '#000',
                                fontSize: '14px',
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label
                            htmlFor="description"
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold',
                                color: '#333',
                            }}
                        >
                            Description:
                        </label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                                color: '#000',
                                fontSize: '14px',
                            }}
                        />
                    </div>
                    <div className="mt-4">
                        <button
                        type="button" // Dodato kako bi se sprečilo podrazumevano submit ponašanje
                        onClick={handleOpenZanrovi} // Funkcija koja otvara selekciju žanrova
                        className="text-yellow-900 hover:underline text-sm mb-2 mt-2 inline-block bg-transparent border-none cursor-pointer"
                        >
                        Choose your favorite genres
                        </button>
                    </div> 

                    <div style={{ marginBottom: '20px', position: 'relative' }}>
                        <label
                            htmlFor="photo"
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold',
                                color: '#333',
                            }}
                        >
                            Photo:
                        </label>
                        {formData.photo && (
                            <div style={{ position: 'absolute', top: '0', left: '0', width: '80px', height: '80px' }}>
                                <img
                                    src={formData.photo}
                                    alt="Profile"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '5px',
                                    }}
                                />
                            </div>
                        )}
                        <input
                            type="file"
                            id="photo"
                            name="photo"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{
                                width: formData.photo ? 'calc(100% - 90px)' : '100%',
                                padding: '10px',
                                marginLeft: formData.photo ? '90px' : '0',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                                fontSize: '14px',
                            }}
                        />
                    </div>
                    <div className="flex justify-center space-x-4">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-6 py-3 bg-green-700 text-white rounded-lg border-none cursor-pointer hover:bg-green-600"
                    >
                        Save
                    </button>

                        <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg border-none cursor-pointer hover:bg-red-500"
                    >
                        Cancel
                    </button>

                    </div>
                </form>
            </div>
            {isZanroviOpen && (
                <div className="fixed top-0 left-0 w-full h-full bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
                    <SviZanrovi 
                    onZanroviSelect={(selected) => handleZanroviSelect(selected)}
                    onClose={() => setIsZanroviOpen(false)}
                    />
                    <button
                    onClick={() => setIsZanroviOpen(false)}
                    className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg"
                    >
                    X
                    </button>
                </div>
            )}
        </div>
    );
}

export default UpdateProfile;