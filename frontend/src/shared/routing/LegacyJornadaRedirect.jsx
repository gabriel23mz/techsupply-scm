import {
  Navigate,
  useLocation,
  useParams,
} from 'react-router-dom';

function LegacyJornadaRedirect() {
  const { id } = useParams();
  const location = useLocation();

  return (
    <Navigate
      replace
      to={`/jornadas/${id}`}
      state={location.state}
    />
  );
}

export default LegacyJornadaRedirect;
