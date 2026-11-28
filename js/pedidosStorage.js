const CLAVE_PEDIDOS = 'ratonBiblioteca_pedidos';

// Recupera los pedidos y conserva una lista vacía si no hay datos válidos.
export function obtenerPedidos() {
    try {
        const datos = localStorage.getItem(CLAVE_PEDIDOS);
        if (!datos) {
            return [];
        }

        const pedidos = JSON.parse(datos);
        if (Array.isArray(pedidos)) {
            return pedidos;
        }

        return [];
    } catch (error) {
        console.error('No se pudieron leer los pedidos guardados:', error);
        return [];
    }
}

// Guarda una copia del carrito vinculada al usuario con sesión activa.
export function guardarPedido(carrito, sesion) {
    if (!Array.isArray(carrito) || carrito.length === 0) {
        return { correcto: false, mensaje: 'El carrito está vacío.' };
    }

    if (!sesion || !sesion.id) {
        return { correcto: false, mensaje: 'Debes iniciar sesión para confirmar el pedido.' };
    }

    const productos = carrito.map((producto) => ({
        id: producto.id,
        nombre: producto.nombre,
        autor: producto.autor || '',
        precio: Number(producto.precio) || 0,
        cantidad: Number(producto.cantidad) || 1,
        imagen: producto.imagen || ''
    }));

    let id;
    if (globalThis.crypto && globalThis.crypto.randomUUID) {
        id = globalThis.crypto.randomUUID();
    } else {
        id = `pedido-${Date.now()}`;
    }

    const pedido = {
        id: id,
        usuarioId: sesion.id,
        correoUsuario: sesion.correo,
        fechaCreacion: new Date().toISOString(),
        estado: 'pendiente',
        productos: productos,
        total: productos.reduce(
            (suma, producto) => suma + producto.precio * producto.cantidad,
            0
        )
    };

    try {
        const pedidosActualizados = [...obtenerPedidos(), pedido];
        localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidosActualizados));
        return { correcto: true, pedido: pedido };
    } catch (error) {
        console.error('No se pudo guardar el pedido:', error);
        return { correcto: false, mensaje: 'No se pudo guardar el pedido en este navegador.' };
    }
}