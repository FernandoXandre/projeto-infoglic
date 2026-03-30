import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CadastroCliente from './pages/CadastroCliente';
import Login from './pages/Login';
import RecuperarSenha from './pages/RecuperarSenha';
import RedefinirSenha from './pages/RedefinirSenha';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"              element={<Login />} />
        <Route path="/cadastro"           element={<CadastroCliente />} />
        <Route path="/recuperar-senha"    element={<RecuperarSenha />} />
        <Route path="/redefinir-senha/:token" element={<RedefinirSenha />} />
        <Route path="/"                   element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
