import { Link } from 'react-router-dom';
import { Empty, Panel } from '../components/ui';

export default function NotFound() {
  return <div className="page"><Panel><Empty title="Page not found" action={<Link to="/" className="btn primary">Back to the map</Link>}>The address does not match any page.</Empty></Panel></div>;
}
