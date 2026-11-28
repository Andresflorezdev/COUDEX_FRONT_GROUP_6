import { obtenerSesion } from './auth.js';

const CLAVE_FAVORITOS = 'ratonBiblioteca_favoritos';

function obtenerClaveFavoritos() {
    const sesion = obtenerSesion();

    if (sesion && sesion.id) {
        return `${CLAVE_FAVORITOS}_${sesion.id}`;
    }

    return `${CLAVE_FAVORITOS}_visitante`;
}

export function obtenerFavoritos() {
    try {
        const favoritosGuardados = localStorage.getItem(obtenerClaveFavoritos());

        if (!favoritosGuardados) {
            return [];
        }

        const favoritos = JSON.parse(favoritosGuardados);

        if (Array.isArray(favoritos)) {
            return favoritos.map((favorito) => {
                if (typeof favorito === 'string') {
                    return { id: favorito, nombre: favorito };
                }

                return favorito;
            });
        }

        return [];
    } catch (error) {
        console.error('No se pudieron leer los favoritos:', error);
        return [];
    }
}

export function alternarFavorito(producto) {
    if (!producto || !producto.id) {
        return { correcto: false, guardado: false };
    }

    const favoritos = obtenerFavoritos();
    const idProducto = String(producto.id);
    const indiceFavorito = favoritos.findIndex((favorito) => favorito.id === idProducto);
    let guardado = false;

    if (indiceFavorito === -1) {
        favoritos.push({
            id: idProducto,
            nombre: producto.nombre || 'Libro sin título',
            autor: producto.autor || '',
            precio: Number(producto.precio) || 0
        });
        guardado = true;
    } else {
        favoritos.splice(indiceFavorito, 1);
    }

    try {
        localStorage.setItem(obtenerClaveFavoritos(), JSON.stringify(favoritos));
        return { correcto: true, guardado };
    } catch (error) {
        console.error('No se pudo guardar el favorito:', error);
        return { correcto: false, guardado: false };
    }
}
