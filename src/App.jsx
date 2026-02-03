import React, { useState, useEffect } from 'react';
import { Plus, X, LogIn, LogOut, ShieldCheck, User, TrendingUp, DollarSign, Building } from 'lucide-react';
import { propiedadesService } from './propiedadesService';
import { Navbar } from './components/Navbar';
import { CardPropiedad } from './components/CardPropiedad';
import { Formulario } from './components/Formulario';
import { Login } from './components/Login';

function App() {
  const [propiedades, setPropiedades] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [precioMax, setPrecioMax] = useState(1000000);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const verificarSesion = async () => {
      const user = await propiedadesService.obtenerUsuario();
      setUsuario(user);
    };
    verificarSesion();
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const data = await propiedadesService.obtenerTodas();
      setPropiedades(data);
    } catch (e) { console.error(e); }
  };

  const manejarLogin = async (email, pass) => {
    const user = await propiedadesService.login(email, pass);
    setUsuario(user);
    setMostrarLogin(false);
  };

  const manejarLogout = async () => {
    await propiedadesService.logout();
    setUsuario(null);
    setMostrarForm(false);
  };

  // CÁLCULOS PARA EL JEFE
  const totalInventario = propiedades.reduce((acc, curr) => acc + (curr.precio || 0), 0);
  const promedioPrecio = propiedades.length > 0 ? totalInventario / propiedades.length : 0;

  if (mostrarLogin) return <Login alLoguear={manejarLogin} alCancelar={() => setMostrarLogin(false)} />;

  const filtradas = propiedades.filter(c => 
    (c.titulo.toLowerCase().includes(busqueda.toLowerCase()) || c.zona?.toLowerCase().includes(busqueda.toLowerCase())) 
    && c.precio <= precioMax
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <Navbar 
        busqueda={busqueda} setBusqueda={setBusqueda}
        precioMax={precioMax} setPrecioMax={setPrecioMax}
        mostrarFiltros={mostrarFiltros} setMostrarFiltros={setMostrarFiltros}
        total={filtradas.length}
      />

      <main className="max-w-md mx-auto p-4">
        
        {/* DASHBOARD DEL JEFE (Solo visible para rol Jefe) */}
        {usuario?.rol === 'Jefe' && !mostrarForm && (
          <div className="grid grid-cols-2 gap-3 mb-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-[#0056b3] p-5 rounded-[30px] text-white shadow-lg">
              <DollarSign size={20} className="mb-2 opacity-50" />
              <p className="text-[10px] font-black uppercase opacity-70">Valor Total</p>
              <p className="text-lg font-black italic">${(totalInventario/1000000).toFixed(1)}M</p>
            </div>
            <div className="bg-white p-5 rounded-[30px] text-slate-800 shadow-md border border-slate-100">
              <TrendingUp size={20} className="mb-2 text-green-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase">Promedio</p>
              <p className="text-lg font-black italic">${Math.round(promedioPrecio/1000)}k</p>
            </div>
          </div>
        )}

        {/* BOTONES DE CONTROL */}
        <div className="mb-6">
          {!usuario ? (
            <button onClick={() => setMostrarLogin(true)} className="w-full bg-slate-800 text-white font-bold py-5 rounded-[25px] flex items-center justify-center gap-2 shadow-xl">
              <LogIn size={18} /> ACCESO AGENTES
            </button>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-white px-6 py-3 rounded-full shadow-sm border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">{usuario.rol} Activo</span>
                </div>
                <button onClick={manejarLogout} className="text-red-500 text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</button>
              </div>
              <button onClick={() => setMostrarForm(!mostrarForm)} className="w-full bg-[#0056b3] text-white font-black py-5 rounded-[25px] flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all">
                {mostrarForm ? <X size={20} /> : <Plus size={20} />} {mostrarForm ? 'CANCELAR REGISTRO' : 'NUEVA CAPTACIÓN'}
              </button>
            </div>
          )}
        </div>

        {mostrarForm && usuario && (
          <Formulario alTerminar={() => { setMostrarForm(false); cargarDatos(); }} />
        )}

        {/* LISTADO DE PROPIEDADES */}
        <div className="grid grid-cols-1 gap-4">
          {filtradas.map(casa => (
            <CardPropiedad 
              key={casa.id} 
              casa={casa} 
              alEliminar={usuario?.rol === 'Jefe' ? (id) => propiedadesService.eliminar(id).then(cargarDatos) : null} 
              alCompartir={(c) => window.open(`https://wa.me/?text=🏠 *${c.titulo}* en ${c.zona}. Precio: $${c.precio.toLocaleString()}. Ver foto: ${c.imagen_url}`, '_blank')} 
              rolUsuario={usuario?.rol} 
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;