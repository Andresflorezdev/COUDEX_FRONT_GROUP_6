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
        correo: usuario.correo,
        celular: usuario.celular
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

function mostrarModalMensaje(titulo, mensaje, tipo = 'info', alCerrar) {
    const modalElemento = document.querySelector('#modal-auth-mensaje');
    const tituloElemento = document.querySelector('#modal-auth-titulo');
    const mensajeElemento = document.querySelector('#modal-auth-mensaje-texto');

    if (!modalElemento || !tituloElemento || !mensajeElemento) {
        console.error('No se encontró el componente del modal de autenticación.');
        return;
    }

    tituloElemento.textContent = titulo;
    mensajeElemento.textContent = mensaje;
    modalElemento.dataset.tipo = tipo;

    if (alCerrar) {
        modalElemento.addEventListener('hidden.bs.modal', alCerrar, { once: true });
    }

    bootstrap.Modal.getOrCreateInstance(modalElemento).show();
}

function mostrarModalPerfil() {
    const sesion = obtenerSesion();
    if (!sesion) {
        return;
    }

    document.querySelector('#perfil-auth-nombre').textContent = sesion.nombre || '—';
    document.querySelector('#perfil-auth-apellido').textContent = sesion.apellido || '—';
    document.querySelector('#perfil-auth-correo').textContent = sesion.correo || '—';
    document.querySelector('#perfil-auth-celular').textContent = sesion.celular || '—';
    const modalPerfil = document.querySelector('#modal-auth-perfil');
    if (modalPerfil) {
        bootstrap.Modal.getOrCreateInstance(modalPerfil).show();
    }
}

function conectarControlesVisibilidad(formulario) {
    const botones = formulario.querySelectorAll('[data-toggle-password]');

    botones.forEach((boton) => {
        if (boton.dataset.passwordConectado) {
            return;
        }
        boton.dataset.passwordConectado = 'true';

        boton.addEventListener('click', () => {
            const campo = boton.previousElementSibling;
            const icono = boton.querySelector('i');

            if (!campo || campo.tagName !== 'INPUT' || !icono) {
                return;
            }

            if (campo.type === 'password') {
                campo.type = 'text';
                boton.setAttribute('aria-label', 'Ocultar contraseña');
                boton.setAttribute('title', 'Ocultar contraseña');
                boton.setAttribute('aria-pressed', 'true');
                icono.className = 'bi bi-eye-fill';
            } else {
                campo.type = 'password';
                boton.setAttribute('aria-label', 'Mostrar contraseña');
                boton.setAttribute('title', 'Mostrar contraseña');
                boton.setAttribute('aria-pressed', 'false');
                icono.className = 'bi bi-eye';
            }
        });
    });

    formulario.addEventListener('reset', () => {
        botones.forEach((boton) => {
            const campo = boton.previousElementSibling;
            const icono = boton.querySelector('i');

            if (!campo || !icono) {
                return;
            }

            campo.type = 'password';
            boton.setAttribute('aria-label', 'Mostrar contraseña');
            boton.setAttribute('title', 'Mostrar contraseña');
            boton.setAttribute('aria-pressed', 'false');
            icono.className = 'bi bi-eye';
        });
    });
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
    conectarControlesVisibilidad(formulario);

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
            mostrarModalMensaje('No se pudo crear la cuenta', resultado.mensaje, 'error');
            return;
        }

        formulario.reset();
        mostrarModalMensaje(
            'Cuenta creada',
            'Ahora inicia sesión con tu correo y contraseña.',
            'success',
            () => navegar('login')
        );
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
    conectarControlesVisibilidad(formulario);

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (!formulario.reportValidity()) return;

        const resultado = iniciarSesion(
            formulario.elements.correo.value,
            formulario.elements.contrasena.value
        );
        if (!resultado.correcto) {
            mostrarModalMensaje('No se pudo iniciar sesión', resultado.mensaje, 'error');
            return;
        }

        actualizarNavegacionAuth();
        mostrarModalMensaje(
            'Sesión iniciada',
            `¡Bienvenido/a, ${resultado.usuario.nombre}!`,
            'success',
            () => navegar('inicio')
        );
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
            mostrarModalPerfil();
        }
    });

    window.addEventListener('storage', (evento) => {
        if (evento.key === CLAVE_SESION || evento.key === CLAVE_USUARIOS) {
            actualizarNavegacionAuth();
        }
    });
}
