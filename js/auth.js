// Autenticación simulada con localStorage para el prototipo del sitio.
const CLAVE_USUARIOS = 'ratonBiblioteca_usuarios';
const CLAVE_SESION = 'ratonBiblioteca_sesion';
let eventosGlobalesConectados = false;

function leerJSON(clave, valorInicial) {
    try {
        const valor = localStorage.getItem(clave);
        if (valor) {
            return JSON.parse(valor);
        }

        return valorInicial;
    } catch (error) {
        console.error(`No se pudo leer ${clave} de localStorage:`, error);
        return valorInicial;
    }
}

export function obtenerUsuarios() {
    const usuarios = leerJSON(CLAVE_USUARIOS, []);

    if (Array.isArray(usuarios)) {
        return usuarios;
    }

    return [];
}

export function obtenerSesion() {
    const sesion = leerJSON(CLAVE_SESION, null);

    if (sesion && typeof sesion === 'object') {
        return sesion;
    }

    return null;
}

function normalizarCorreo(correo) {
    return String(correo || '').trim().toLocaleLowerCase('es');
}

export function registrarUsuario(datos) {
    const usuarios = obtenerUsuarios();
    const correo = normalizarCorreo(datos.correo);

    if (usuarios.some((usuario) => normalizarCorreo(usuario.correo) === correo)) {
        return { correcto: false, mensaje: 'Ya existe una cuenta registrada con ese correo.' };
    }

    let id;
    if (globalThis.crypto && globalThis.crypto.randomUUID) {
        id = globalThis.crypto.randomUUID();
    } else {
        id = `usuario-${Date.now()}`;
    }

    const usuario = {
        id: id,
        nombre: String(datos.nombre || '').trim(),
        apellido: String(datos.apellido || '').trim(),
        correo: correo,
        celular: String(datos.celular || '').trim(),
        contrasena: String(datos.contrasena || '')
    };

    try {
        localStorage.setItem(CLAVE_USUARIOS, JSON.stringify([...usuarios, usuario]));
        return { correcto: true, usuario };
    } catch (error) {
        console.error('No se pudo guardar el usuario:', error);
        return { correcto: false, mensaje: 'No se pudo guardar la cuenta en este navegador.' };
    }
}

export function iniciarSesion(correo, contrasena) {
    const correoNormalizado = normalizarCorreo(correo);
    const usuario = obtenerUsuarios().find((item) => (
        normalizarCorreo(item.correo) === correoNormalizado
        && item.contrasena === String(contrasena || '')
    ));

    if (!usuario) {
        return { correcto: false, mensaje: 'Correo o contraseña inválidos.' };
    }

    const sesion = {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo
    };

    try {
        localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
        return { correcto: true, usuario: sesion };
    } catch (error) {
        console.error('No se pudo guardar la sesión:', error);
        return { correcto: false, mensaje: 'No se pudo iniciar sesión en este navegador.' };
    }
}

export function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
}

export function actualizarNavegacionAuth() {
    const sesion = obtenerSesion();
    const enlaceRegistro = document.querySelector('#nav-registrar');
    const enlaceLogin = document.querySelector('#nav-login');
    const menuCuenta = document.querySelector('#nav-cuenta');
    const nombreCuenta = document.querySelector('#nav-cuenta-nombre');

    if (enlaceRegistro) {
        if (sesion) {
            enlaceRegistro.classList.add('d-none');
        } else {
            enlaceRegistro.classList.remove('d-none');
        }
    }

    if (enlaceLogin) {
        if (sesion) {
            enlaceLogin.classList.add('d-none');
        } else {
            enlaceLogin.classList.remove('d-none');
        }
    }

    if (menuCuenta) {
        if (sesion) {
            menuCuenta.classList.remove('d-none');
        } else {
            menuCuenta.classList.add('d-none');
        }
    }

    if (nombreCuenta && sesion) {
        if (sesion.nombre) {
            nombreCuenta.textContent = sesion.nombre;
        } else {
            nombreCuenta.textContent = 'Mi cuenta';
        }
    }
}

function mostrarMensaje(formulario, mensaje, tipo = 'danger') {
    let aviso = formulario.querySelector('[data-auth-aviso]');
    if (!aviso) {
        aviso = document.createElement('div');
        aviso.dataset.authAviso = 'true';
        aviso.setAttribute('role', 'alert');
        formulario.prepend(aviso);
    }
    aviso.className = `alert alert-${tipo} py-2`;
    aviso.textContent = mensaje;
}

function conectarFormularioRegistro(navegar) {
    const formulario = document.querySelector('.registro-formulario');
    if (!formulario) {
        return;
    }

    if (formulario.dataset.authConectado) {
        return;
    }
    formulario.dataset.authConectado = 'true';

    const campoContrasena = formulario.elements.contrasena;
    const campoConfirmar = formulario.elements.confirmar;
    function validarConfirmacionContrasena() {
        if (campoConfirmar.value && campoConfirmar.value !== campoContrasena.value) {
            campoConfirmar.setCustomValidity('Las contraseñas no coinciden.');
        } else {
            campoConfirmar.setCustomValidity('');
        }
    }

    campoConfirmar.addEventListener('input', validarConfirmacionContrasena);
    campoContrasena.addEventListener('input', validarConfirmacionContrasena);

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (campoConfirmar.value !== campoContrasena.value) {
            campoConfirmar.setCustomValidity('Las contraseñas no coinciden.');
        } else {
            campoConfirmar.setCustomValidity('');
        }
        if (!formulario.reportValidity()) return;

        const resultado = registrarUsuario({
            nombre: formulario.elements.nombre.value,
            apellido: formulario.elements.apellido.value,
            correo: formulario.elements.correo.value,
            celular: formulario.elements.celular.value,
            contrasena: campoContrasena.value
        });

        if (!resultado.correcto) {
            mostrarMensaje(formulario, resultado.mensaje);
            return;
        }

        formulario.reset();
        alert('Cuenta creada. Ahora inicia sesión con tu correo y contraseña.');
        await navegar('login');
    });
}

function conectarFormularioLogin(navegar) {
    const formulario = document.querySelector('.login-formulario');
    if (!formulario) {
        return;
    }

    if (formulario.dataset.authConectado) {
        return;
    }
    formulario.dataset.authConectado = 'true';

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (!formulario.reportValidity()) return;

        const resultado = iniciarSesion(
            formulario.elements.correo.value,
            formulario.elements.contrasena.value
        );
        if (!resultado.correcto) {
            mostrarMensaje(formulario, resultado.mensaje);
            return;
        }

        actualizarNavegacionAuth();
        alert(`¡Bienvenido/a, ${resultado.usuario.nombre}!`);
        await navegar('inicio');
    });
}

export function inicializarAuth(navegar) {
    actualizarNavegacionAuth();
    conectarFormularioRegistro(navegar);
    conectarFormularioLogin(navegar);

    if (eventosGlobalesConectados) return;
    eventosGlobalesConectados = true;
    document.addEventListener('click', (evento) => {
        if (evento.target.closest('[data-auth-cerrar]')) {
            cerrarSesion();
            actualizarNavegacionAuth();
        }
        if (evento.target.closest('[data-auth-perfil]')) {
            const sesion = obtenerSesion();
            if (sesion) alert(`${sesion.nombre} ${sesion.apellido}\n${sesion.correo}`);
        }
    });

    window.addEventListener('storage', (evento) => {
        if (evento.key === CLAVE_SESION || evento.key === CLAVE_USUARIOS) {
            actualizarNavegacionAuth();
        }
    });
}
