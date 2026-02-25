import React, { useState, useEffect } from 'react';

const BlurUpImage = ({ src, alt, className }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(null);

    useEffect(() => {
        // Generar la URL de baja resolución (Thumbnail Ultra-light)
        // Si es Unsplash, usamos sus parámetros de optimización
        let thumb = src;
        if (src.includes('unsplash.com')) {
            const baseUrl = src.split('?')[0];
            thumb = `${baseUrl}?w=20&q=10&blur=10&auto=format`;
        } else {
            // Para otras imágenes, podríamos usar un placeholder o una miniatura si existe
            thumb = src;
        }

        setCurrentSrc(thumb);

        const img = new Image();
        img.src = src;
        img.onload = () => {
            setCurrentSrc(src);
            setIsLoaded(true);
        };
    }, [src]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <img
                src={currentSrc}
                alt={alt}
                className={`w-full h-full object-cover transition-all duration-700 ${isLoaded ? 'blur-0 scale-100' : 'blur-xl scale-110'
                    }`}
            />
            {!isLoaded && (
                <div className="absolute inset-0 bg-blue-50/20 backdrop-blur-sm animate-pulse" />
            )}
        </div>
    );
};

export default BlurUpImage;
