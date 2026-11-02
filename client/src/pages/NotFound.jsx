import { Link } from 'react-router-dom';

export default function NotFound() {
  return <section className="not-found"><span>404</span><h1>Page not found</h1><p>The page you are looking for does not exist.</p><Link className="button primary" to="/">Return home</Link></section>;
}
