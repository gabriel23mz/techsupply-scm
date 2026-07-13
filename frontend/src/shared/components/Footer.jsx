import {
  useEffect,
  useState,
} from 'react';

function Footer() {
  const [
    currentTime,
    setCurrentTime,
  ] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString(
          'es-EC',
          {
            hour: '2-digit',
            minute: '2-digit',
          },
        ),
      );
    };

    updateTime();

    const intervalId =
      setInterval(
        updateTime,
        60000,
      );

    return () =>
      clearInterval(intervalId);
  }, []);

  return (
    <footer className="app-footer">
      <span>
        TechSupply SCM v2.4.0 · Módulo Outbound
      </span>

      <span>
        Sesión activa · {currentTime}
      </span>
    </footer>
  );
}

export default Footer;
