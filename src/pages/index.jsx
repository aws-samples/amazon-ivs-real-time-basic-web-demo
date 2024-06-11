import './home.css';
import ModalProvider from '../contexts/ModalContext';
import StartScreen from '../components/StartScreen';

function Home() {
  return (
    <ModalProvider>
      <StartScreen />
    </ModalProvider>
  );
}

export default Home;
