import { Link } from 'react-router';
import { FaArrowRight, FaComments, FaHeart, FaSmile, FaUserFriends, FaVideo } from 'react-icons/fa';
import ThemeToggle from '~/components/Shared/ThemeToggle';
import { pageMeta } from '~/utils/seo';

export const meta = () => pageMeta(
  'Conecta y comparte con tus amigos',
  'FriendsGo es el espacio para compartir momentos, conocer personas y seguir en contacto con tu comunidad.',
  { indexable: true },
);

const features = [
  { title: 'Tu día merece un post', description: 'Ese plan improvisado, una foto que te encanta o algo que te hizo sonreír. Compártelo con tu gente.', icon: FaUserFriends },
  { title: 'Siempre hay algo que contar', description: 'Retoma esa charla pendiente, organiza el próximo plan o simplemente pregunta cómo va el día.', icon: FaComments },
  { title: 'Un hola, cara a cara', description: 'Las mejores conversaciones también pasan en pantalla. Conecta por videollamada y siente a tu gente más cerca.', icon: FaVideo },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-page text-ink">
      <header>
        <div className="landing-shell flex min-h-24 flex-wrap items-center justify-between gap-4 py-5">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight" aria-label="FriendsGo, inicio">
            <img src="/images/friendsgo-mark.svg" alt="" className="h-10 w-10" />Friends<span className="brand-word -ml-2">Go</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-3 sm:gap-6" aria-label="Acceso">
            <Link to="/login" className="text-sm font-semibold hover:text-accent">Iniciar sesión</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <section className="landing-shell grid items-center gap-16 py-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20 lg:py-20" aria-labelledby="landing-title">
        <div>
          <p className="landing-eyebrow mb-6 inline-flex items-center gap-2 rounded-full bg-soft px-4 py-2 text-accent"><FaSmile aria-hidden="true" />Tu gente, un poquito más cerca</p>
          <h1 id="landing-title" className="landing-title">La vida es mejor<br /><span className="brand-gradient">cuando la compartes.</span></h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-copy">Pequeños momentos, buenas conversaciones y nuevas amistades. Aquí tienes un espacio para ser tú y conectar con los demás.</p>
          <Link to="/signup" className="friendly-button mt-8 inline-flex items-center gap-5 bg-primary px-7 py-4 font-semibold text-white hover:bg-primary-hover">Encuentra a tu gente <FaArrowRight className="text-sm" aria-hidden="true" /></Link>
          <p className="mt-5 text-sm text-muted">¿Ya estás por aquí? <Link to="/login" className="font-semibold text-accent hover:underline">Qué bueno verte de nuevo</Link></p>
        </div>
        <div>
          <div className="community-scene" aria-hidden="true">
            <span className="community-orbit"><FaHeart /></span>
            <div className="community-card p-5 sm:p-6">
              <div className="flex items-center gap-3"><span className="feature-icon text-xl"><FaSmile /></span><div><p className="font-semibold">Pequeños grandes momentos</p><p className="mt-1 text-xs text-muted">Así podría empezar tu próxima historia</p></div></div>
              <div className="mt-5 flex min-h-36 flex-col items-center justify-center rounded-2xl bg-soft px-5 py-7 text-center">
                <span className="mb-3 text-4xl">☀️</span><p className="text-xl font-semibold">Un café, una charla<br />y ninguna prisa.</p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-accent"><FaHeart /><span>De esos planes que apetece compartir</span></div>
            </div>
            <div className="community-card relative mt-5 ml-3 p-4 sm:ml-8">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-accent"><FaComments />Una conversación puede cambiarte el día</p>
              <p className="mr-7 rounded-2xl rounded-bl-sm bg-soft px-4 py-3 text-sm">¿Nos ponemos al día? 👋</p>
              <p className="mt-2 ml-7 rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm text-white">¡Claro! Tengo mil cosas que contarte 💜</p>
            </div>
          </div>
          <p className="mt-5 text-center text-xs text-muted">Un vistazo a los momentos que puedes compartir.</p>
        </div>
      </section>

      <section className="landing-shell py-12 md:py-16" aria-labelledby="features-title">
        <div className="mb-9 text-center">
          <p className="landing-eyebrow mb-3 text-accent">Conectar empieza con algo pequeño</p>
          <h2 id="features-title" className="text-3xl font-bold tracking-tight sm:text-4xl">Más tú. Más cerca. Más FriendsGo.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {features.map(({ title, description, icon: Icon }) => (
            <article key={title} className="feature-card">
              <div className="feature-icon mb-6"><Icon className="text-2xl" aria-hidden="true" /></div>
              <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-copy">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-shell pb-10">
        <div className="friendly-cta flex flex-col items-center gap-6 px-6 py-12 text-center md:py-16">
          <FaUserFriends className="text-4xl text-accent" aria-hidden="true" />
          <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Tu próxima buena historia<br />puede empezar con un hola.</h2>
          <p className="max-w-lg leading-7 text-copy">Haz sitio a nuevas amistades y a más momentos con las de siempre.</p>
          <Link to="/signup" className="friendly-button inline-flex items-center gap-5 bg-primary px-7 py-4 font-semibold text-white hover:bg-primary-hover">Me apunto <FaArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
      <footer className="landing-shell flex flex-wrap justify-between gap-4 py-7 text-sm text-muted"><p>FriendsGo · Hecho para conectar <span aria-hidden="true">💜</span></p><Link to="/login" className="hover:text-accent">¿Seguimos la conversación?</Link></footer>
    </main>
  );
}
