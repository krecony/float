import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SupabaseProvider } from './providers/SupabaseProvider';
import { MerchantTerminal } from './pages/MerchantTerminal';

export default function App() {
  return (
    <SupabaseProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MerchantTerminal />} />
        </Routes>
      </BrowserRouter>
    </SupabaseProvider>
  );
}
