import React from 'react';
import { useNavigate } from "react-router-dom";


const Knjiga = ({ knjiga, index }) => {

    const navigate = useNavigate()
    //console.log(knjiga)

    return (
    <div
        key={index}
        className="bg-white p-4 rounded-lg shadow-md cursor-pointer"
        onClick={() => navigate(`/detalji-knjige/${knjiga.id}`)}
        >
        <img
            src={knjiga.slika}
            alt={knjiga.naslov}
            className="w-full h-32 object-contain rounded-lg mb-4"
        />
        <h3 className="text-lg font-medium  text-center">{knjiga.naslov}</h3>
        <h2 className="text-md text-center text-yellow-900 ">{knjiga.autor} </h2>
        
    </div>
    );
};

export default Knjiga;