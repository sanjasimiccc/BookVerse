import { useState, useEffect } from "react";

function DodavanjeKnjige({ isOpen, onClose }) {
  const [autori, setAutori] = useState([]);
  const [zanrovi, setZanrovi] = useState([]);
  const [knjiga, setKnjiga] = useState({
    naslov: "",
    opis: "",
    slika: "",
    brojStranica: "",
    autor: "",
    zanr: "",
  });
  const [poruka, setPoruka] = useState("");
  const [errors, setErrors] = useState({});


  useEffect(() => {
    fetch("http://localhost:5108/Autor/vratiSveAutore", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("jwt")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setAutori(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5108/Zanr/vratiSveZanrove")
      .then((res) => res.json())
      .then((data) => setZanrovi(data))
      .catch((err) => console.error(err));
  }, []);

  const handleChange = (e) => {
    setKnjiga({
      ...knjiga,
      [e.target.name]: e.target.value,
    });

     // Ukloni grešku ako je polje popunjeno
     if (e.target.value.trim() !== "") {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [e.target.name]: undefined,
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setKnjiga({ ...knjiga, slika: reader.result });
        setErrors((prevErrors) => ({ ...prevErrors, slika: undefined })); // Uklanja grešku slike ako je dodata
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {};
    if (!knjiga.naslov) newErrors.naslov = "*Title is required";
    if (!knjiga.opis) newErrors.opis = "*Description is required";
    if (!knjiga.brojStranica) newErrors.brojStranica = "*Number of pages is required";
    if (!knjiga.autor) newErrors.autor = "*Author is required";
    if (!knjiga.zanr) newErrors.zanr = "*Genre is required";
    if(!knjiga.slika) newErrors.slika = "*Book image is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await fetch("http://localhost:5108/Knjiga/dodavanjeKnjige", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("jwt")}`,
        },
        body: JSON.stringify(knjiga),
      });
      if (res.ok) {
        setPoruka("Knjiga je uspešno dodata!");
        setKnjiga({
          naslov: "",
          opis: "",
          slika: "",
          brojStranica: "",
          autor: "",
          zanr: "",
        });
        setErrors({})
        setTimeout(() => {
          window.location.reload(); //osvezavanje
        }, 1000);
      } else {
        const errMessage = await res.text();
        setPoruka(errMessage);
      }
    } catch (err) {
      setPoruka("Došlo je do greške prilikom dodavanja knjige.");
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg relative">
        <h2 className="text-xl font-bold text-center text-black mb-4">
          Add Book
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="naslov"
            placeholder="Title"
            value={knjiga.naslov}
            onChange={handleChange}
            className={`w-full p-2 border rounded mb-2 text-black ${errors.naslov ? "border-red-500" : ""}`}
          />
          {errors.naslov && <p className="text-red-500 text-sm">{errors.naslov}</p>}

          <input
            type="text"
            name="opis"
            placeholder="Description"
            value={knjiga.opis}
            onChange={handleChange}
            className={`w-full p-2 border rounded mb-2 text-black ${errors.opis ? "border-red-500" : ""}`}
            />
            {errors.opis && <p className="text-red-500 text-sm">{errors.opis}</p>}

          <input
            type="number"
            name="brojStranica"
            placeholder="Number of pages"
            value={knjiga.brojStranica}
            onChange={handleChange}
            className={`w-full p-2 border rounded mb-2 text-black ${errors.brojStranica ? "border-red-500" : ""}`}
          />
          {errors.brojStranica && <p className="text-red-500 text-sm">{errors.brojStranica}</p>}

          <select
            name="autor"
            value={knjiga.autor}
            onChange={handleChange}
            className={`w-full p-2 border rounded mb-2 text-black ${errors.autor ? "border-red-500" : ""}`}
            >
            <option value="">Select an author</option>
            {autori.map((autor) => (
              <option key={autor.id} value={autor.id}>
                {autor.punoIme}
              </option>
            ))}
          </select>
          {errors.autor && <p className="text-red-500 text-sm">{errors.autor}</p>}


          <select
            name="zanr"
            value={knjiga.zanr}
            onChange={handleChange}
            className={`w-full p-2 border rounded mb-2 text-black ${errors.zanr ? "border-red-500" : ""}`}
            >
            <option value="">Seleect a genre</option>
            {zanrovi.map((zanr) => (
              <option key={zanr.id} value={zanr.id}>
                {zanr.naziv}
              </option>
            ))}
          </select>
          {errors.zanr && <p className="text-red-500 text-sm">{errors.zanr}</p>}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full p-2 border rounded mb-2"
          />
           {errors.slika && <p className="text-red-500">{errors.slika}</p>}

          <div className={`w-full flex justify-center items-center border rounded mb-2 ${knjiga.slika ? "h-40" : "h-0"}`}>
            {knjiga.slika && (
              <img
                src={knjiga.slika}
                alt="Slika knjige"
                className="w-28 h-40 object-cover rounded transition-all duration-300"
              />
            )}
          </div>
        <div className="flex justify-center space-x-4">
        <button
            type="button"
            onClick={handleSubmit}
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
        {poruka && <p className="text-center text-red-500 mt-2">{poruka}</p>}
      </div>
    </div>
  );
}

export default DodavanjeKnjige;
