import { useState, useEffect} from 'react';

function AzuriranjeAutora({ isOpen, onClose, authorData }) {
    console.log(authorData)

    const [formData, setFormData] = useState({
        fullName: '',
        biography: '', 
        photo: ''
    })

    const [refresh, setRefresh] = useState(false)

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
        if (authorData) {
            setFormData({

                fullName: authorData.punoIme || '',
                biography: authorData.biografija || '',
                photo: authorData.slika || '',
            });
        }
    }, [authorData, isOpen]);

    useEffect(() => {
        if (refresh) {
            window.location.reload();
        }
    }, [refresh]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAuthorUpdate = async () => {
        const token = sessionStorage.getItem("jwt");
        if (token !== null) {
            try {
                const response = await fetch(`http://localhost:5108/Autor/azurirajAutora/${authorData.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        punoIme: formData.fullName,
                        biografija: formData.biography,
                        slika: formData.photo
                    }),
                });
  
                if (!response.ok) {
                    const errorMessage = await response.text();
                    console.error("Error updating author:", errorMessage);
                    alert(`Error: ${errorMessage}`);
                } else {
                    setRefresh(true);
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
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#000' }}>Update Author</h2>
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
                            htmlFor="biography"
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold',
                                color: '#333',
                            }}
                        >
                            Biography:
                        </label>
                        <input
                            type="text"
                            id="biography"
                            name="biography"
                            value={formData.biography}
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
                        onClick={handleAuthorUpdate}
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

export default AzuriranjeAutora;