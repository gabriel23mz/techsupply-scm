import { useEffect, useState } from 'react';

function Footer() {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      setCurrentTime(
        now.toLocaleTimeString('es-EC', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    };

    updateTime();

    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <footer className="app-footer">
      <span>TechSupply SCM v1.0.0 • Sistema Distribuido Cloud</span>
      <span>Última actualización: Hoy, {currentTime}</span>
    </footer>
  );
}

export default Footer;

