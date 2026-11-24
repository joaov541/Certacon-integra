import AppRoutes from './routes/AppRoutes';
import { PermissoesProvider } from './context/PermissoesContext';

function App() {
  return <PermissoesProvider><AppRoutes /></PermissoesProvider>;
}

export default App;
