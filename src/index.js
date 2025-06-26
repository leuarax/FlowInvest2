import React from 'react';
import ReactDOM from 'react-dom/client';
import AddRealEstate from './components/AddRealEstate';
import { Routes, Route } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Routes>
      <Route path="/add-real-estate" element={<AddRealEstate />} />
    </Routes>
  </React.StrictMode>
);
