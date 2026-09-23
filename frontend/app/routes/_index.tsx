import { Link } from 'react-router';
import { pageMeta } from '~/utils/seo';

export const meta = () => pageMeta(
  'Conecta y comparte con tus amigos',
  'FriendsGo es el espacio para compartir momentos, conocer personas y seguir en contacto con tu comunidad.',
  { indexable: true },
);

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-black text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="text-2xl font-bold tracking-tight text-white" aria-label="FriendsGo, inicio">
          Friends<span className="text-blue-400">Go</span>
        </Link>
        <nav className="flex items-center gap-3" aria-label="Acceso">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-200 hover:text-white">Iniciar sesión</Link>
          <Link to="/signup" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">Crear cuenta</Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Tu comunidad, más cerca</p>
          <h1 className="max-w-xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">Los buenos momentos se comparten.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-gray-400">Publica lo que te inspira, descubre nuevas amistades y mantén tus conversaciones en un solo lugar.</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link to="/signup" className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500">Únete a FriendsGo</Link>
            <Link to="/login" className="rounded-xl border border-gray-700 px-6 py-3 font-semibold hover:border-gray-500">Ya tengo una cuenta</Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md rounded-3xl border border-gray-800 bg-gray-900/70 p-6 shadow-2xl shadow-blue-950/40">
          <div className="mb-5 flex items-center gap-3">
            <img src="/images/friendsgo-mark.svg" alt="" className="h-11 w-11 rounded-xl object-contain" />
            <div><p className="font-semibold">Una red para compartir</p><p className="text-sm text-gray-500">Momentos que te acercan</p></div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-blue-600/25 via-purple-600/20 to-gray-900 p-7">
            <p className="text-3xl" aria-hidden="true">✦</p>
            <h2 className="mt-4 text-xl font-semibold">Tu gente, tus historias</h2>
            <p className="mt-2 leading-7 text-gray-400">Crea publicaciones, conversa y descubre lo que comparte tu círculo.</p>
          </div>
          <ul className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-gray-400">
            <li className="rounded-lg bg-gray-800/70 px-2 py-3">Publicaciones</li>
            <li className="rounded-lg bg-gray-800/70 px-2 py-3">Amistades</li>
            <li className="rounded-lg bg-gray-800/70 px-2 py-3">Conversaciones</li>
          </ul>
        </div>
      </section>
      <footer className="border-t border-gray-900 px-6 py-5 text-center text-sm text-gray-600">FriendsGo · Conecta, comparte, disfruta.</footer>
    </main>
  );
}
