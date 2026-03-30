import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CadastroCliente from './pages/CadastroCliente';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/cadastro" element={<CadastroCliente />} />
        <Route path="/"         element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;