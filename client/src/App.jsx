import { Route, Routes } from 'react-router-dom';
import { AuthLayout, GuestLayout } from './pages/LayoutPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import BuilderPage from './pages/BuilderPage';
import PreviewPage from './pages/PreviewPage';

function App() {
  return (
    <Routes>
      <Route element={<GuestLayout />}>
        <Route path='/login' element={<AuthPage mode='login' />} />
        <Route path='/register' element={<AuthPage mode='register' />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path='/' element={<HomePage />} />
        <Route path='/builder/:id' element={<BuilderPage />} />
        <Route path='/preview/:id' element={<PreviewPage />} />
      </Route>
    </Routes>
  );
}

export default App;
