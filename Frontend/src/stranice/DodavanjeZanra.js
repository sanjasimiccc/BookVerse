import { useState, useEffect, useContext} from 'react';

function DodavanjeZanra({ isOpen, onClose}) {

    const [formData, setFormData] = useState({
        name: '',
        photo: '', 
    });
    const [errors, setErrors] = useState({});

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setFormData((prev) => ({ ...prev, photo: reader.result }));
                setErrors((prevErrors) => ({ ...prevErrors, photo: undefined })); // Uklanja grešku slike ako je dodata
            };
            reader.readAsDataURL(file);
        }

    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (e.target.value.trim() !== "") {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [e.target.name]: undefined,
            }));
        }
    };

    const handleSave = async () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = "*Name is required";
        if (!formData.photo) newErrors.photo = "*Photo is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const token = sessionStorage.getItem("jwt")
        if (token !== null) {
            try {
                const response = await fetch("http://localhost:5108/Zanr/dodajZanr", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`, 
                    },
                    body: JSON.stringify({
                        naziv: formData.name,
                        slika: formData.photo,          
                    }),
                });
    
                if (!response.ok) {
                    const errorMessage = await response.text();
                    console.error("Error adding new genre:", errorMessage);
                    alert(`Error: ${errorMessage}`);
                 } else {
                    setErrors({})
                    window.location.reload()
                 }

            } catch (error) {
                console.error("Error during update:", error);
                alert("An error occurred. Please try again later.");
            }
        } else {
            alert("Token not found. Please log in again.");
        }
    
        onClose();  
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
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#000' }}>Add New Genre </h2>
                <form>
                    <div style={{ marginBottom: '15px' }}>
                        <label
                            htmlFor="name"
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold',
                                color: '#333',
                            }}
                        >
                            Name:
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full p-2 border rounded mb-2 text-black ${errors.name ? "border-red-500" : ""}`}
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
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
                        {errors.photo && <p className="text-red-500">{errors.photo}</p>}
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
        </div>
    );
}

export default DodavanjeZanra;