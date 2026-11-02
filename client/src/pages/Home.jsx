import { Compass, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  return (
    <>
      <section className="hero">
        <div><span className="eyebrow">Lost & found, made simple</span><h1>Help belongings find their way home.</h1><p>Report lost items, post found belongings, and connect safely with their rightful owners.</p>
          <div className="hero-actions"><Link className="button primary" to="/items?type=Lost">Lost Items</Link><Link className="button found-button" to="/items?type=Found">Found Items</Link><Link className="button secondary" to={user ? '/report' : '/login'}>Report an Item</Link></div>
        </div>
        <div className="hero-panel"><Search /><strong>One place to search</strong><p>Browse community reports by item, category, and location.</p></div>
      </section>
      <section className="section"><h2>How FindIt works</h2><div className="feature-grid">
        <article><Search /><h3>Search listings</h3><p>Find reports using clear filters and location details.</p></article>
        <article><Compass /><h3>Report an item</h3><p>Create a lost or found report in just a few steps.</p></article>
        <article><ShieldCheck /><h3>Submit a claim</h3><p>Contact the community and provide proof in a claim message.</p></article>
      </div><Link className="button primary centered" to="/items">Browse all listings</Link></section>
    </>
  );
}
